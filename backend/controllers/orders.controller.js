import pool from '../db.js';

// Получить все заказы — админ
export const getAllOrders = async (req, res) => {
  try {
    // Получаем основные данные заказов
    const ordersResult = await pool.query(
      `SELECT o.id, o.table_id, t.name AS table_name, o.reservation_id, r.customer_name AS reservation_customer,
              o.order_type, o.customer_name, o.customer_phone, o.comment, o.status, o.total_amount, o.created_at
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN reservations r ON o.reservation_id = r.id
       ORDER BY o.created_at DESC`
    );

    // Для каждого заказа получаем позиции
    const ordersWithItems = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT oi.id, oi.quantity, oi.unit_price, oi.item_comment,
                  mi.name AS menu_item_name, mi.description AS menu_item_description
           FROM order_items oi
           LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE oi.order_id = $1
           ORDER BY oi.id`,
          [order.id]
        );

        return {
          ...order,
          items: itemsResult.rows
        };
      })
    );

    res.json(ordersWithItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении заказов' });
  }
};

// Создать заказ (клиент)
export const createOrder = async (req, res) => {
  try {
    const { table_id, reservation_id, order_type, customer_name, customer_phone, comment, items } = req.body;

    // Считаем общую сумму
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.unit_price * item.quantity;
    }

    // Создаем заказ
    const orderResult = await pool.query(
      `INSERT INTO orders (table_id, reservation_id, order_type, customer_name, customer_phone, comment, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [table_id || null, reservation_id || null, order_type, customer_name, customer_phone, comment, total_amount]
    );

    const order = orderResult.rows[0];

    // Добавляем позиции заказа
    const insertPromises = items.map(item =>
      pool.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, item_comment)
         VALUES ($1,$2,$3,$4,$5)`,
        [order.id, item.menu_item_id, item.quantity, item.unit_price, item.item_comment || null]
      )
    );
    await Promise.all(insertPromises);

    res.status(201).json({ order_id: order.id, message: 'Заказ успешно создан' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при создании заказа' });
  }
};

// Обновить статус заказа — админ
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE orders SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Заказ не найден' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении статуса заказа' });
  }
};
