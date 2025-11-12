import pool from '../db.js';
import { createYooKassaPayment, isYooKassaConfigured } from '../services/yookassa.js';

const PAYMENT_METHODS = new Set(['cash', 'card']);

const formatCurrency = (value) => {
  const number = Number.parseFloat(value ?? 0);
  if (Number.isNaN(number)) {
    return 0;
  }
  return Number(number.toFixed(2));
};

const mapReservationRows = (rows) => {
  const reservationsMap = new Map();

  rows.forEach((row) => {
    if (!reservationsMap.has(row.id)) {
      reservationsMap.set(row.id, {
        id: row.id,
        table_id: row.table_id,
        table_name: row.table_name,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        start_at: row.start_at,
        end_at: row.end_at,
        status: row.status,
        note: row.note,
        total_amount: row.total_amount,
        payment_method: row.payment_method,
        payment_status: row.payment_status,
        payment_id: row.payment_id,
        payment_confirmation_url: row.payment_confirmation_url,
        payment_receipt_url: row.payment_receipt_url,
        payment_metadata: row.payment_metadata,
        created_at: row.created_at,
        items: [],
      });
    }

    if (row.item_id) {
      reservationsMap.get(row.id).items.push({
        id: row.item_id,
        menu_item_id: row.menu_item_id,
        menu_item_name: row.menu_item_name,
        quantity: row.item_quantity,
        unit_price: row.item_unit_price,
        comment: row.item_comment,
      });
    }
  });

  return Array.from(reservationsMap.values());
};

// брони 
export const getAllReservations = async (request, reply) => {
  try {
    const result = await pool.query(
      `SELECT 
         r.*,
         t.name AS table_name,
         ri.id AS item_id,
         ri.menu_item_id,
         ri.quantity AS item_quantity,
         ri.unit_price AS item_unit_price,
         ri.comment AS item_comment,
         mi.name AS menu_item_name
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
       LEFT JOIN menu_items mi ON ri.menu_item_id = mi.id
       ORDER BY r.start_at DESC, ri.id`
    );
    return reply.send(mapReservationRows(result.rows));
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Ошибка при получении бронирований' });
  }
};

export const createReservation = async (request, reply) => {
  const {
    table_id,
    customer_name,
    customer_phone,
    start_at,
    end_at,
    items = [],
    payment_method = 'cash',
    note = null,
    payment_return_url,
  } = request.body ?? {};

  if (!PAYMENT_METHODS.has(payment_method)) {
    return reply.status(400).send({ message: 'Недопустимый способ оплаты' });
  }

  let normalizedItems = [];
  if (Array.isArray(items) && items.length > 0) {
    try {
      normalizedItems = items.map((item) => {
        const menuItemId = item.menu_item_id ?? item.menuItemId ?? item.id;
        const quantity = Number.parseInt(item.quantity, 10);
        const comment = item.comment ?? item.item_comment ?? null;

        if (!menuItemId) {
          throw new Error('Не выбрано блюдо для предзаказа');
        }
        if (Number.isNaN(quantity) || quantity <= 0) {
          throw new Error('Некорректное количество блюда');
        }

        return {
          menu_item_id: menuItemId,
          quantity,
          comment,
        };
      });
    } catch (error) {
      return reply.status(400).send({
        message: error.message || 'Некорректные данные блюд',
      });
    }
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const tableCheck = await client.query(
      `SELECT id, name FROM tables WHERE id=$1`,
      [table_id]
    );

    if (tableCheck.rows.length === 0) {
      return reply.status(404).send({ message: 'Столик не найден' });
    }

    const reservationConflicts = await client.query(
      `SELECT COUNT(*) AS conflict_count
       FROM reservations
       WHERE table_id=$1
         AND status IN ('pending', 'confirmed')
         AND NOT (end_at <= $2::timestamptz OR start_at >= $3::timestamptz)`,
      [table_id, start_at, end_at]
    );

    if (parseInt(reservationConflicts.rows[0].conflict_count, 10) > 0) {
      return reply.status(400).send({ message: 'Столик уже забронирован в это время' });
    }

    const reservationDate = new Date(start_at);
    const twoHoursBeforeStart = new Date(reservationDate.getTime() - 2 * 60 * 60 * 1000);
    
    const activeOrders = await client.query(
      `SELECT COUNT(*) AS orders_count
       FROM orders
       WHERE table_id=$1
         AND status NOT IN ('completed', 'cancelled')
         AND created_at >= $2::timestamptz
         AND DATE(created_at) >= DATE($3::timestamptz)`,
      [table_id, twoHoursBeforeStart.toISOString(), reservationDate.toISOString()]
    );

    if (parseInt(activeOrders.rows[0].orders_count, 10) > 0) {
      return reply.status(400).send({ message: 'На столике есть активные заказы в это время' });
    }

    let totalAmount = 0;
    let menuItemsMap = new Map();

    if (normalizedItems.length > 0) {
      const menuItemsResult = await client.query(
        `SELECT id, name, price, available 
         FROM menu_items 
         WHERE id = ANY($1)`,
        [normalizedItems.map((item) => item.menu_item_id)]
      );

      if (menuItemsResult.rowCount !== normalizedItems.length) {
        return reply.status(400).send({ message: 'Некоторые блюда недоступны для брони' });
      }

      menuItemsMap = new Map(menuItemsResult.rows.map((row) => [row.id, row]));

      const unavailableItem = menuItemsResult.rows.find((row) => row.available === false);
      if (unavailableItem) {
        return reply.status(400).send({ message: `Блюдо "${unavailableItem.name}" временно недоступно` });
      }

      totalAmount = normalizedItems.reduce((sum, item) => {
        const menuItem = menuItemsMap.get(item.menu_item_id);
        return sum + menuItem.price * item.quantity;
      }, 0);
    }

    if (payment_method === 'card' && totalAmount <= 0) {
      return reply.status(400).send({ message: 'Для онлайн-оплаты нужно выбрать хотя бы одно блюдо' });
    }

    await client.query('BEGIN');
    transactionStarted = true;

    const reservationResult = await client.query(
      `INSERT INTO reservations (
        table_id,
        customer_name,
        customer_phone,
        start_at,
        end_at,
        note,
        total_amount,
        payment_method,
        payment_status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        table_id,
        customer_name,
        customer_phone,
        start_at,
        end_at,
        note,
        formatCurrency(totalAmount),
        payment_method,
        payment_method === 'card' ? 'pending' : 'unpaid',
      ]
    );

    const reservation = reservationResult.rows[0];

    const detailedItems = [];
    for (const item of normalizedItems) {
      const menuItem = menuItemsMap.get(item.menu_item_id);
      const insertResult = await client.query(
        `INSERT INTO reservation_items (reservation_id, menu_item_id, quantity, unit_price, comment)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, menu_item_id, quantity, unit_price, comment`,
        [
          reservation.id,
          item.menu_item_id,
          item.quantity,
          formatCurrency(menuItem.price),
          item.comment,
        ]
      );

      detailedItems.push({
        ...insertResult.rows[0],
        menu_item_name: menuItem.name,
      });
    }

    let paymentPayload = null;

    if (payment_method === 'card') {
      if (!isYooKassaConfigured()) {
        throw new Error('YOO_KASSA_NOT_CONFIGURED');
      }

      const defaultBaseUrl =
        process.env.YOOKASSA_RETURN_URL?.replace(/\/payment\/result$/, '') ||
        process.env.APP_BASE_URL ||
        request.headers?.origin ||
        (request.headers?.host ? `https://${request.headers.host}` : null);

      const paymentReturnUrl =
        payment_return_url ||
        process.env.YOOKASSA_RETURN_URL ||
        (defaultBaseUrl ? `${defaultBaseUrl.replace(/\/$/, '')}/payment/result` : 'https://example.com/payment/result');

      const payment = await createYooKassaPayment({
        amount: totalAmount,
        orderId: reservation.id,
        description: `Предоплата по брони №${reservation.id}`,
        returnUrl: paymentReturnUrl,
        metadata: {
          reservation_id: reservation.id,
          type: 'reservation_preorder',
        },
      });

      const confirmationUrl =
        payment?.confirmation?.confirmation_url ||
        payment?.confirmation?.url ||
        payment?.confirmation?.redirect?.url ||
        null;

      await client.query(
        `UPDATE reservations
         SET payment_id = $1,
             payment_status = $2,
             payment_confirmation_url = $3,
             payment_metadata = jsonb_set(
               COALESCE(payment_metadata, '{}'::jsonb),
               '{yookassa}',
               $4::jsonb,
               true
             )
         WHERE id = $5`,
        [
          payment.id,
          payment.status || 'pending',
          confirmationUrl,
          JSON.stringify({
            id: payment.id,
            status: payment.status,
            metadata: payment.metadata,
          }),
          reservation.id,
        ]
      );

      paymentPayload = {
        id: payment.id,
        status: payment.status,
        confirmation_url: confirmationUrl,
      };
    }

    await client.query('COMMIT');
    transactionStarted = false;

    return reply.status(201).send({
      reservation: {
        ...reservation,
        items: detailedItems,
        table_name: tableCheck.rows[0].name,
      },
      payment: paymentPayload,
      message:
        payment_method === 'card'
          ? 'Бронь создана. Завершите оплату, чтобы подтвердить предзаказ.'
          : 'Бронь успешно создана.',
    });
  } catch (err) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed for reservation creation:', rollbackError);
      }
    }

    if (err.message === 'YOO_KASSA_NOT_CONFIGURED') {
      console.error('YooKassa configuration is missing');
      return reply
        .status(503)
        .send({ message: 'Онлайн-оплата временно недоступна' });
    }

    console.error(err);
    return reply.status(500).send({ message: 'Ошибка при создании брони' });
  } finally {
    client.release();
  }
};

// Получить бронь по ID (админ)
export const getReservationById = async (request, reply) => {
  try {
    const { id } = request.params;
    const result = await pool.query(
      `SELECT 
         r.*,
         t.name AS table_name,
         ri.id AS item_id,
         ri.menu_item_id,
         ri.quantity AS item_quantity,
         ri.unit_price AS item_unit_price,
         ri.comment AS item_comment,
         mi.name AS menu_item_name
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
       LEFT JOIN menu_items mi ON ri.menu_item_id = mi.id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return reply.status(404).send({ message: 'Бронь не найдена' });
    return reply.send(mapReservationRows(result.rows)[0]);
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Ошибка при получении брони' });
  }
};

// Обновить бронь (админ)
export const updateReservation = async (request, reply) => {
  try {
    const { id } = request.params;
    const {
      table_id,
      customer_name,
      customer_phone,
      start_at,
      end_at,
      status,
      note,
      items = [],
      payment_method,
    } = request.body ?? {};

    const client = await pool.connect();
    let transactionStarted = false;

    try {
      const existingReservationResult = await client.query(
        `SELECT *
         FROM reservations
         WHERE id = $1`,
        [id]
      );

      if (existingReservationResult.rowCount === 0) {
        return reply.status(404).send({ message: 'Бронь не найдена' });
      }

      const existingReservation = existingReservationResult.rows[0];

      const newPaymentMethod = payment_method || existingReservation.payment_method;
      if (!PAYMENT_METHODS.has(newPaymentMethod)) {
        return reply.status(400).send({ message: 'Недопустимый способ оплаты' });
      }

      const tableCheck = await client.query(
        `SELECT id, name FROM tables WHERE id=$1`,
        [table_id ?? existingReservation.table_id]
      );

      if (tableCheck.rows.length === 0) {
        return reply.status(404).send({ message: 'Столик не найден' });
      }

      const effectiveTableId = table_id ?? existingReservation.table_id;
      const effectiveStartAt = start_at ?? existingReservation.start_at;
      const effectiveEndAt = end_at ?? existingReservation.end_at;

      const reservationConflicts = await client.query(
        `SELECT COUNT(*) AS conflict_count
         FROM reservations
         WHERE table_id=$1
           AND id != $2
           AND status IN ('pending', 'confirmed')
           AND NOT (end_at <= $3::timestamptz OR start_at >= $4::timestamptz)`,
        [effectiveTableId, id, effectiveStartAt, effectiveEndAt]
      );

      if (parseInt(reservationConflicts.rows[0].conflict_count, 10) > 0) {
        return reply.status(400).send({ message: 'Столик уже забронирован в это время' });
      }

      const reservationDate = new Date(effectiveStartAt);
      const twoHoursBeforeStart = new Date(reservationDate.getTime() - 2 * 60 * 60 * 1000);
      
      const activeOrders = await client.query(
        `SELECT COUNT(*) AS orders_count
         FROM orders
         WHERE table_id=$1
           AND status NOT IN ('completed', 'cancelled')
           AND created_at >= $2::timestamptz
           AND DATE(created_at) >= DATE($3::timestamptz)`,
        [effectiveTableId, twoHoursBeforeStart.toISOString(), reservationDate.toISOString()]
      );

      if (parseInt(activeOrders.rows[0].orders_count, 10) > 0) {
        return reply.status(400).send({ message: 'На столике есть активные заказы в это время' });
      }

      let normalizedItems = [];
      if (Array.isArray(items) && items.length > 0) {
        try {
          normalizedItems = items.map((item) => {
            const menuItemId = item.menu_item_id ?? item.menuItemId ?? item.id;
            const quantity = Number.parseInt(item.quantity, 10);
            const comment = item.comment ?? item.item_comment ?? null;

            if (!menuItemId) {
              throw new Error('Не выбрано блюдо для предзаказа');
            }
            if (Number.isNaN(quantity) || quantity <= 0) {
              throw new Error('Некорректное количество блюда');
            }

            return {
              menu_item_id: menuItemId,
              quantity,
              comment,
            };
          });
        } catch (error) {
          return reply.status(400).send({
            message: error.message || 'Некорректные данные блюд',
          });
        }
      }

      let totalAmount = existingReservation.total_amount || 0;
      let menuItemsMap = new Map();

      if (normalizedItems.length > 0) {
        const menuItemsResult = await client.query(
          `SELECT id, name, price, available 
           FROM menu_items 
           WHERE id = ANY($1)`,
          [normalizedItems.map((item) => item.menu_item_id)]
        );

        if (menuItemsResult.rowCount !== normalizedItems.length) {
          return reply.status(400).send({ message: 'Некоторые блюда недоступны для брони' });
        }

        menuItemsMap = new Map(menuItemsResult.rows.map((row) => [row.id, row]));

        const unavailableItem = menuItemsResult.rows.find((row) => row.available === false);
        if (unavailableItem) {
          return reply.status(400).send({ message: `Блюдо "${unavailableItem.name}" временно недоступно` });
        }

        totalAmount = normalizedItems.reduce((sum, item) => {
          const menuItem = menuItemsMap.get(item.menu_item_id);
          return sum + menuItem.price * item.quantity;
        }, 0);
      } else if (items && Array.isArray(items) && items.length === 0) {
        totalAmount = 0;
      }

      if (newPaymentMethod === 'card' && totalAmount <= 0) {
        return reply.status(400).send({ message: 'Для онлайн-оплаты нужно выбрать хотя бы одно блюдо' });
      }

      await client.query('BEGIN');
      transactionStarted = true;

      const updatedReservationResult = await client.query(
        `UPDATE reservations SET 
            table_id=$1,
            customer_name=$2,
            customer_phone=$3,
            start_at=$4,
            end_at=$5,
            status=$6,
            note=$7,
            payment_method=$8,
            total_amount=$9
         WHERE id=$10
         RETURNING *`,
        [
          effectiveTableId,
          customer_name ?? existingReservation.customer_name,
          customer_phone ?? existingReservation.customer_phone,
          effectiveStartAt,
          effectiveEndAt,
          status ?? existingReservation.status,
          note ?? existingReservation.note,
          newPaymentMethod,
          formatCurrency(totalAmount),
          id,
        ]
      );

      if (updatedReservationResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ message: 'Бронь не найдена' });
      }

      if (items) {
        await client.query(
          `DELETE FROM reservation_items WHERE reservation_id = $1`,
          [id]
        );

        for (const item of normalizedItems) {
          const menuItem = menuItemsMap.get(item.menu_item_id);
          await client.query(
            `INSERT INTO reservation_items (reservation_id, menu_item_id, quantity, unit_price, comment)
             VALUES ($1,$2,$3,$4,$5)`,
            [
              id,
              item.menu_item_id,
              item.quantity,
              formatCurrency(menuItem?.price ?? item.unit_price ?? 0),
              item.comment,
            ]
          );
        }
      }

      await client.query('COMMIT');
      transactionStarted = false;

      const detailedResult = await pool.query(
        `SELECT 
           r.*,
           t.name AS table_name,
           ri.id AS item_id,
           ri.menu_item_id,
           ri.quantity AS item_quantity,
           ri.unit_price AS item_unit_price,
           ri.comment AS item_comment,
           mi.name AS menu_item_name
         FROM reservations r
         JOIN tables t ON r.table_id = t.id
         LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
         LEFT JOIN menu_items mi ON ri.menu_item_id = mi.id
         WHERE r.id = $1`,
        [id]
      );

      return reply.send(mapReservationRows(detailedResult.rows)[0]);
    } catch (innerError) {
      if (transactionStarted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback failed for reservation update:', rollbackError);
        }
      }
      throw innerError;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Ошибка при обновлении брони' });
  }
};

// Удалить бронь (админ)
export const deleteReservation = async (request, reply) => {
  try {
    const { id } = request.params;

    const ordersResult = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE reservation_id=$1`,
      [id]
    );

    if (parseInt(ordersResult.rows[0].count) > 0) {
      return reply.status(400).send({ 
        message: 'Нельзя удалить бронь с связанными заказами. Сначала удалите заказы.' 
      });
    }

    const result = await pool.query(`DELETE FROM reservations WHERE id=$1 RETURNING *`, [id]);

    if (result.rows.length === 0) return reply.status(404).send({ message: 'Бронь не найдена' });

    return reply.send({ message: 'Бронь успешно удалена', deletedReservation: result.rows[0] });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Ошибка при удалении брони' });
  }
};

// Обновить статус брони (только админ)
export const updateReservationStatus = async (request, reply) => {
  try {
    const { id } = request.params;
    const { status } = request.body;

    const result = await pool.query(
      `UPDATE reservations SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0)
      return reply.status(404).send({ message: 'Бронь не найдена' });

    return reply.send(result.rows[0]);
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Ошибка при обновлении статуса брони' });
  }
};

export const getReservationPaymentStatus = async (request, reply) => {
  const { paymentId } = request.params ?? {};

  if (!paymentId) {
    return reply.status(400).send({ message: 'Не указан идентификатор платежа' });
  }

  try {
    const result = await pool.query(
      `SELECT 
         id,
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
         status
       FROM reservations
       WHERE payment_id = $1`,
      [paymentId]
    );

    if (result.rowCount === 0) {
      return reply.status(404).send({ message: 'Бронь с указанным платежом не найдена' });
    }

    return reply.send(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при получении статуса оплаты брони:', err);
    return reply.status(500).send({ message: 'Ошибка при получении информации об оплате' });
  }
};
