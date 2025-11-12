import pool from '../db.js';
import { cleanupOldOrders } from '../utils/cleanupOrders.js';
import { createYooKassaPayment, isYooKassaConfigured } from '../services/yookassa.js';

const ORDER_TYPES = new Set(['dine_in', 'takeaway', 'delivery']);
const PAYMENT_METHODS = new Set(['cash', 'card']);

//  заказы
export const getAllOrders = async (request, reply) => {
  try {
    const limit = parseInt(request.query.limit) || 12;
    const offset = parseInt(request.query.offset) || 0;

    const result = await pool.query(
      `SELECT 
        o.id, o.table_id, o.reservation_id, o.order_type, o.customer_name, 
        o.customer_phone, o.comment, o.status, o.total_amount, o.created_at,
        o.payment_method, o.payment_status, o.payment_id, o.payment_confirmation_url,
        o.payment_receipt_url, o.delivery_address, o.delivery_fee, o.payment_metadata,
        t.name AS table_name,
        r.customer_name AS reservation_customer,
        oi.id AS item_id, oi.quantity AS item_quantity, oi.unit_price AS item_unit_price, 
        oi.item_comment AS item_comment,
        mi.name AS menu_item_name, mi.description AS menu_item_description
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN reservations r ON o.reservation_id = r.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE o.id IN (
         SELECT id FROM orders 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2
       )
       ORDER BY o.created_at DESC, oi.id`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM orders');
    const total = parseInt(countResult.rows[0].total);

    const ordersMap = new Map();
    
    result.rows.forEach(row => {
      const orderId = row.id;
      
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: row.id,
          table_id: row.table_id,
          reservation_id: row.reservation_id,
          order_type: row.order_type,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          comment: row.comment,
          status: row.status,
          total_amount: row.total_amount,
          created_at: row.created_at,
          payment_method: row.payment_method,
          payment_status: row.payment_status,
          payment_id: row.payment_id,
          payment_confirmation_url: row.payment_confirmation_url,
          payment_receipt_url: row.payment_receipt_url,
          delivery_address: row.delivery_address,
          delivery_fee: row.delivery_fee,
          payment_metadata: row.payment_metadata,
          table_name: row.table_name,
          reservation_customer: row.reservation_customer,
          items: []
        });
      }

      if (row.item_id) {
        ordersMap.get(orderId).items.push({
          id: row.item_id,
          quantity: row.item_quantity,
          unit_price: row.item_unit_price,
          item_comment: row.item_comment,
          menu_item_name: row.menu_item_name,
          menu_item_description: row.menu_item_description
        });
      }
    });

    const orders = Array.from(ordersMap.values());
    
    return reply.send({
      orders,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + orders.length < total
      }
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Ошибка при получении заказов' });
  }
};

export const createOrder = async (request, reply) => {
  const {
    table_id,
    reservation_id,
    order_type = 'dine_in',
    customer_name,
    customer_phone,
    comment,
    items,
    payment_method = 'cash',
    delivery_address,
    delivery_fee = 0,
    payment_return_url,
    payment_metadata = {}
  } = request.body ?? {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    return reply.status(400).send({ message: 'Необходимо указать позиции заказа' });
  }

  if (!ORDER_TYPES.has(order_type)) {
    return reply.status(400).send({ message: 'Недопустимый тип заказа' });
  }

  if (!PAYMENT_METHODS.has(payment_method)) {
    return reply.status(400).send({ message: 'Недопустимый способ оплаты' });
  }

  const normalizedDeliveryFee = Number.parseFloat(delivery_fee || 0);
  if (Number.isNaN(normalizedDeliveryFee) || normalizedDeliveryFee < 0) {
    return reply.status(400).send({ message: 'Некорректная стоимость доставки' });
  }

  const initialPaymentMetadata =
    payment_metadata && typeof payment_metadata === 'object'
      ? payment_metadata
      : {};

  let normalizedItems;
  try {
    normalizedItems = items.map((item) => {
      const quantity = Number.parseInt(item.quantity, 10);
      const unitPrice = Number.parseFloat(item.unit_price ?? item.unitPrice ?? item.price);
      const menuItemId = item.menu_item_id ?? item.menuItemId ?? item.id;

      if (!menuItemId) {
        throw new Error('Не указано блюдо для позиции заказа');
      }

      if (Number.isNaN(quantity) || quantity <= 0) {
        throw new Error('Некорректное количество для позиции заказа');
      }
      if (Number.isNaN(unitPrice) || unitPrice < 0) {
        throw new Error('Некорректная цена для позиции заказа');
      }

      return {
        menu_item_id: menuItemId,
        quantity,
        unit_price: unitPrice,
        item_comment: item.item_comment ?? item.comment ?? null,
      };
    });
  } catch (validationError) {
    return reply.status(400).send({
      message: validationError.message || 'Некорректные данные по позициям заказа',
    });
  }

  let totalAmount = normalizedItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  totalAmount += normalizedDeliveryFee;

  if (payment_method === 'card' && totalAmount <= 0) {
    return reply.status(400).send({ message: 'Сумма заказа для онлайн-оплаты должна быть больше 0' });
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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (
        table_id,
        reservation_id,
        order_type,
        customer_name,
        customer_phone,
        comment,
        total_amount,
        payment_method,
        payment_status,
        delivery_address,
        delivery_fee,
        payment_metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        table_id || null,
        reservation_id || null,
        order_type,
        customer_name,
        customer_phone,
        comment,
        totalAmount,
        payment_method,
        payment_method === 'card' ? 'pending' : 'succeeded',
        delivery_address || null,
        normalizedDeliveryFee,
        JSON.stringify(initialPaymentMetadata),
      ]
    );

    const order = orderResult.rows[0];

    for (const item of normalizedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, item_comment)
         VALUES ($1,$2,$3,$4,$5)`,
        [order.id, item.menu_item_id, item.quantity, item.unit_price, item.item_comment]
      );
    }

    let paymentPayload = null;

    if (payment_method === 'card') {
      if (!isYooKassaConfigured()) {
        throw new Error('YOO_KASSA_NOT_CONFIGURED');
      }

      const payment = await createYooKassaPayment({
        amount: totalAmount,
        orderId: order.id,
        description: `Оплата заказа №${order.id}`,
        returnUrl: paymentReturnUrl,
        metadata: payment_metadata,
      });

      const confirmationUrl =
        payment?.confirmation?.confirmation_url ||
        payment?.confirmation?.url ||
        payment?.confirmation?.redirect?.url ||
        null;

      await client.query(
        `UPDATE orders
         SET payment_id = $1,
             payment_status = $2,
             payment_confirmation_url = $3,
             payment_metadata = jsonb_set(payment_metadata, '{yookassa}', $4::jsonb, true)
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
          order.id,
        ]
      );

      paymentPayload = {
        id: payment.id,
        status: payment.status,
        confirmation_url: confirmationUrl,
      };
    }

    await client.query('COMMIT');

    return reply.status(201).send({
      order_id: order.id,
      message:
        payment_method === 'card'
          ? 'Заказ создан. Завершите оплату.'
          : 'Заказ успешно создан',
      payment: paymentPayload,
    });
  } catch (err) {
    await client.query('ROLLBACK');

    if (err.message === 'YOO_KASSA_NOT_CONFIGURED') {
      console.error('YooKassa configuration is missing');
      return reply
        .status(503)
        .send({ message: 'Онлайн-оплата временно недоступна' });
    }

    if (err.message && err.message.startsWith('Некоррект')) {
      return reply.status(400).send({ message: err.message });
    }

    console.error('Error creating order:', err);
    return reply.status(500).send({ message: 'Ошибка при создании заказа' });
  } finally {
    client.release();
  }
};

export const updateOrderStatus = async (request, reply) => {
  try {
    const { id } = request.params;
    const { status } = request.body;

    if (status === 'completed') {
      await pool.query(
        `UPDATE orders SET status = $1, completed_at = NOW() WHERE id = $2`,
        [status, id]
      );
    } else {
      await pool.query(
        `UPDATE orders SET status = $1 WHERE id = $2`,
        [status, id]
      );
    }

    const orderResult = await pool.query(
      `SELECT o.*, t.name AS table_name
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return reply.status(404).send({ message: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.*, m.name AS menu_item_name
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       WHERE oi.order_id = $1`,
      [id]
    );

    const fullOrder = {
      ...order,
      items: itemsResult.rows
    };

    return reply.send(fullOrder);
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Ошибка при обновлении статуса заказа' });
  }
};

export const getOrderByPaymentId = async (request, reply) => {
  const { paymentId } = request.params;

  if (!paymentId) {
    return reply.status(400).send({ message: 'Не указан идентификатор платежа' });
  }

  try {
    const result = await pool.query(
      `SELECT 
         id,
         payment_id,
         payment_status,
         payment_method,
         status,
         total_amount,
         created_at
       FROM orders
       WHERE payment_id = $1`,
      [paymentId]
    );

    if (result.rowCount === 0) {
      const reservationResult = await pool.query(
        `SELECT 
           id,
           payment_id,
           payment_status,
           payment_method,
           status,
           total_amount,
           created_at,
           payment_confirmation_url,
           payment_receipt_url
         FROM reservations
         WHERE payment_id = $1`,
        [paymentId]
      );

      if (reservationResult.rowCount === 0) {
        return reply.status(404).send({ message: 'Заказ с указанным платежом не найден' });
      }

      return reply.send({
        ...reservationResult.rows[0],
        entity_type: 'reservation',
      });
    }

    return reply.send({
      ...result.rows[0],
      entity_type: 'order',
    });
  } catch (err) {
    console.error('Error fetching order by payment id:', err);
    return reply.status(500).send({ message: 'Ошибка при получении заказа' });
  }
};

export const getOrderSummaryPublic = async (request, reply) => {
  const { orderId } = request.params;

  if (!orderId) {
    return reply.status(400).send({ message: 'Не указан идентификатор заказа' });
  }

  try {
    const result = await pool.query(
      `SELECT 
         id,
         payment_status,
         payment_method,
         status,
         total_amount,
         payment_id,
         created_at
       FROM orders
       WHERE id = $1`,
      [orderId]
    );

    if (result.rowCount === 0) {
      return reply.status(404).send({ message: 'Заказ не найден' });
    }

    return reply.send(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order summary:', err);
    return reply.status(500).send({ message: 'Ошибка при получении заказа' });
  }
};

let connectedClients = [];
let latestOrderId = null;

export const streamOrders = async (request, reply) => {
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.setHeader('Access-Control-Allow-Origin', '*');
  reply.raw.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  try {
    const lastOrderResult = await pool.query(
      'SELECT id FROM orders ORDER BY created_at DESC LIMIT 1'
    );
    if (lastOrderResult.rows.length > 0) {
      latestOrderId = lastOrderResult.rows[0].id;
    }
  } catch (err) {
    console.error('Error getting last order:', err);
  }

  const clientId = Date.now();
  const client = { id: clientId, response: reply.raw };
  connectedClients.push(client);

  reply.raw.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  const checkInterval = setInterval(async () => {
    try {
      const result = await pool.query(
        `SELECT o.*, t.name AS table_name
         FROM orders o
         LEFT JOIN tables t ON o.table_id = t.id
         WHERE o.id > $1 
         ORDER BY o.created_at DESC`,
        [latestOrderId || 0]
      );

      if (result.rows.length > 0) {
        const newOrders = result.rows;
        latestOrderId = newOrders[0].id;

        const orderIds = newOrders.map(o => o.id);
        const allItemsResult = await pool.query(
          `SELECT oi.order_id, oi.id, oi.quantity, oi.unit_price, oi.item_comment,
                  mi.name AS menu_item_name, mi.description AS menu_item_description
           FROM order_items oi
           LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE oi.order_id = ANY($1)
           ORDER BY oi.order_id, oi.id`,
          [orderIds]
        );

        const itemsByOrder = new Map();
        allItemsResult.rows.forEach(item => {
          if (!itemsByOrder.has(item.order_id)) {
            itemsByOrder.set(item.order_id, []);
          }
          itemsByOrder.get(item.order_id).push({
            id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            item_comment: item.item_comment,
            menu_item_name: item.menu_item_name,
            menu_item_description: item.menu_item_description
          });
        });

        const ordersWithItems = newOrders.map(order => ({
          ...order,
          items: itemsByOrder.get(order.id) || []
        }));

        const message = `data: ${JSON.stringify({ 
          type: 'new_order', 
          orders: ordersWithItems 
        })}\n\n`;

        connectedClients = connectedClients.filter(client => {
          try {
            client.response.write(message);
            return true;
          } catch (err) {
            return false;
          }
        });
      }
    } catch (err) {
      console.error('Error checking new orders:', err);
    }
  }, 1000);

  request.raw.on('close', () => {
    clearInterval(checkInterval);
    connectedClients = connectedClients.filter(c => c.id !== clientId);
    console.log(`Client ${clientId} disconnected. Active clients: ${connectedClients.length}`);
  });

  reply.raw.on('close', () => {
    clearInterval(checkInterval);
    connectedClients = connectedClients.filter(c => c.id !== clientId);
    console.log(`Client ${clientId} disconnected. Active clients: ${connectedClients.length}`);
  });
};

// Ручная очистка старых заказов (для администратора)
export const manualCleanupOrders = async (request, reply) => {
  try {
    const daysOld = parseInt(request.query.days) || 7;
    
    if (daysOld < 1) {
      return reply.status(400).send({ message: 'Количество дней должно быть больше 0' });
    }

    const result = await cleanupOldOrders(daysOld);
    
    return reply.send({
      message: `Очистка завершена успешно`,
      deletedOrders: result.deletedOrders,
      deletedItems: result.deletedItems,
      daysOld
    });
  } catch (err) {
    console.error('Ошибка при ручной очистке заказов:', err);
    return reply.status(500).send({ message: 'Ошибка при очистке заказов' });
  }
};