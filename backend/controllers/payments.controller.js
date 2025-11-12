import crypto from 'node:crypto';
import pool from '../db.js';
import { isYooKassaConfigured } from '../services/yookassa.js';

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

const buildExpectedAuthHeader = () => {
  if (!shopId || !secretKey) {
    return null;
  }
  const token = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
};

const mapPaymentStatus = (status) => {
  switch (status) {
    case 'succeeded':
      return 'succeeded';
    case 'waiting_for_capture':
    case 'pending':
    case 'waiting_for_payment':
      return 'pending';
    case 'canceled':
      return 'canceled';
    case 'refunded':
      return 'refunded';
    default:
      return 'pending';
  }
};

export const handleYooKassaWebhook = async (request, reply) => {
  if (!isYooKassaConfigured()) {
    return reply.status(503).send({ message: 'Интеграция YooKassa не настроена' });
  }

  const signatureHeader =
    request.headers['x-yookassa-signature'] ||
    request.headers['X-Yookassa-Signature'] ||
    request.headers['X-YooKassa-Signature'];

  if (signatureHeader) {
    if (!secretKey) {
      return reply.status(503).send({ message: 'Интеграция YooKassa не настроена' });
    }

    if (typeof request.rawBody !== 'string') {
      console.error('YooKassa webhook: raw body is not available for signature validation');
      return reply
        .status(500)
        .send({ message: 'Сервер временно не готов обработать уведомление' });
    }

    const signatureMatch = signatureHeader.trim().match(/^sha256=(.+)$/i);
    if (!signatureMatch || !signatureMatch[1]) {
      return reply.status(401).send({ message: 'Некорректная подпись' });
    }

    const providedSignature = signatureMatch[1].trim();

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(request.rawBody, 'utf8')
        .digest('hex');

      const providedBuffer = Buffer.from(providedSignature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (
        providedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
      ) {
        return reply.status(401).send({ message: 'Некорректная подпись' });
      }
    } catch (error) {
      console.error('YooKassa webhook signature verification failed:', error);
      return reply.status(401).send({ message: 'Некорректная подпись' });
    }
  } else {
    const expectedAuth = buildExpectedAuthHeader();
    if (!expectedAuth) {
      return reply.status(503).send({ message: 'Интеграция YooKassa не настроена' });
    }

    const authHeader = request.headers.authorization || request.headers.Authorization || '';
    if (authHeader !== expectedAuth) {
      return reply.status(401).send({ message: 'Некорректная авторизация' });
    }
  }

  const event = request.body;
  if (!event || !event.event || !event.object) {
    return reply.status(400).send({ message: 'Некорректное уведомление' });
  }

  const payment = event.object;
  const paymentId = payment?.id;
  const paymentStatus = payment?.status;
  const paymentMetadata = payment?.metadata || {};
  const entityType = paymentMetadata?.type || 'order';
  const isReservationPayment = entityType === 'reservation_preorder';
  const reservationId = isReservationPayment
    ? paymentMetadata?.reservation_id || paymentMetadata?.order_id
    : null;
  const orderId = !isReservationPayment ? paymentMetadata?.order_id : null;

  if ((!orderId && !reservationId) || !paymentId || !paymentStatus) {
    return reply.status(400).send({ message: 'Недостаточно данных в уведомлении' });
  }

  const normalizedStatus = mapPaymentStatus(paymentStatus);
  const paymentMethodType = payment?.payment_method?.type;
  const isCardPayment = paymentMethodType === 'bank_card';
  const receiptUrl = payment?.receipt?.registration_url || payment?.receipt_registration || null;
  const confirmationUrl =
    payment?.confirmation?.confirmation_url ||
    payment?.confirmation?.url ||
    payment?.confirmation?.redirect?.url ||
    null;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (reservationId) {
      const reservationUpdateResult = await client.query(
        `UPDATE reservations
         SET payment_status = $1,
             payment_id = $2,
             payment_receipt_url = COALESCE($3, payment_receipt_url),
             payment_method = CASE
               WHEN $4::text IS NOT NULL THEN $4
               ELSE payment_method
             END,
             payment_metadata = jsonb_set(
               jsonb_set(
                 COALESCE(payment_metadata, '{}'::jsonb),
                 '{yookassa,last_event}',
                 $5::jsonb,
                 true
               ),
               '{yookassa,last_payment}',
               $6::jsonb,
               true
             ),
             payment_confirmation_url = COALESCE($7, payment_confirmation_url)
         WHERE id = $8
         RETURNING id, status`,
        [
          normalizedStatus,
          paymentId,
          receiptUrl,
          isCardPayment ? 'card' : null,
          JSON.stringify({ event: event.event, received_at: new Date().toISOString() }),
          JSON.stringify(payment),
          confirmationUrl,
          reservationId,
        ]
      );

      if (reservationUpdateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ message: 'Бронь для оплаты не найдена' });
      }

      if (normalizedStatus === 'succeeded') {
        await client.query(
          `UPDATE reservations
           SET status = CASE 
             WHEN status = 'pending' THEN 'confirmed'
             ELSE status
           END
           WHERE id = $1`,
          [reservationId]
        );
      } else if (normalizedStatus === 'canceled') {
        await client.query(
          `UPDATE reservations
           SET status = CASE 
             WHEN status IN ('pending','confirmed') THEN 'pending'
             ELSE status
           END
           WHERE id = $1`,
          [reservationId]
        );
      }
    } else {
      const updateResult = await client.query(
        `UPDATE orders
         SET payment_status = $1,
             payment_id = $2,
             payment_receipt_url = COALESCE($3, payment_receipt_url),
             payment_method = CASE
               WHEN $7::text IS NOT NULL THEN $7
               ELSE payment_method
             END,
             payment_metadata = jsonb_set(
               jsonb_set(payment_metadata, '{yookassa,last_event}', $4::jsonb, true),
               '{yookassa,last_payment}',
               $5::jsonb,
               true
             )
         WHERE id = $6
         RETURNING id, status, payment_method`,
        [
          normalizedStatus,
          paymentId,
          receiptUrl,
          JSON.stringify({ event: event.event, received_at: new Date().toISOString() }),
          JSON.stringify(payment),
          orderId,
          isCardPayment ? 'card' : null,
        ]
      );

      if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ message: 'Заказ для оплаты не найден' });
      }

      if (normalizedStatus === 'succeeded' && isCardPayment) {
        await client.query(
          `UPDATE orders
           SET status = CASE 
             WHEN status = 'pending' THEN 'preparing'
             ELSE status
           END
           WHERE id = $1`,
          [orderId]
        );
      } else if (normalizedStatus === 'canceled') {
        await client.query(
          `UPDATE orders
           SET status = CASE 
             WHEN status IN ('pending','preparing') THEN 'cancelled'
             ELSE status
           END
           WHERE id = $1`,
          [orderId]
        );
      }
    }

    await client.query('COMMIT');

    return reply.status(200).send({ message: 'OK' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка обработки уведомления YooKassa:', err);
    return reply.status(500).send({ message: 'Ошибка обработки уведомления' });
  } finally {
    client.release();
  }
};

export const getPaymentStatusById = async (request, reply) => {
  const { paymentId } = request.params ?? {};

  if (!paymentId) {
    return reply.status(400).send({ message: 'Не указан идентификатор платежа' });
  }

  try {
    const orderResult = await pool.query(
      `SELECT 
         id,
         payment_id,
         payment_status,
         payment_method,
         status,
         total_amount,
         payment_confirmation_url,
         payment_receipt_url,
         created_at,
         'order' AS entity_type
       FROM orders
       WHERE payment_id = $1`,
      [paymentId]
    );

    if (orderResult.rowCount > 0) {
      return reply.send(orderResult.rows[0]);
    }

    const reservationResult = await pool.query(
      `SELECT 
         id,
         payment_id,
         table_id,
         customer_name,
         start_at,
         end_at,
         total_amount,
         payment_method,
         payment_status,
         payment_id,
         payment_confirmation_url,
         payment_receipt_url,
         status,
         created_at,
         'reservation' AS entity_type
       FROM reservations
       WHERE payment_id = $1`,
      [paymentId]
    );

    if (reservationResult.rowCount > 0) {
      return reply.send(reservationResult.rows[0]);
    }

    return reply.status(404).send({ message: 'Платеж с указанным идентификатором не найден' });
  } catch (error) {
    console.error('Ошибка при получении статуса платежа:', error);
    return reply.status(500).send({ message: 'Ошибка при получении статуса платежа' });
  }
};

