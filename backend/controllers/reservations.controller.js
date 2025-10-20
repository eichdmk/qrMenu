import pool from '../db.js';

// Получить все брони (только админ)
export const getAllReservations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.table_id, t.name AS table_name, r.customer_name, r.customer_phone, 
              r.start_at, r.end_at, r.status, r.created_at
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       ORDER BY r.start_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении бронирований' });
  }
};

// Создать новую бронь (клиент)
export const createReservation = async (req, res) => {
  try {
    const { table_id, customer_name, customer_phone, start_at, end_at } = req.body;

    // 1. Проверяем, существует ли столик
    const tableCheck = await pool.query(
      `SELECT id, name, is_occupied FROM tables WHERE id=$1`,
      [table_id]
    );

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Столик не найден' });
    }

    const table = tableCheck.rows[0];

    // 2. Проверяем текущую занятость столика
    if (table.is_occupied) {
      return res.status(400).json({ message: 'Столик сейчас занят' });
    }

    // 3. Проверяем активные заказы на столике
    const activeOrders = await pool.query(
      `SELECT COUNT(*) FROM orders 
       WHERE table_id=$1 AND status NOT IN ('completed', 'cancelled')`,
      [table_id]
    );

    if (parseInt(activeOrders.rows[0].count) > 0) {
      return res.status(400).json({ message: 'На столике есть активные заказы' });
    }

    // 4. Проверяем конфликты с другими бронированиями
    const availability = await pool.query(
      `SELECT COUNT(*) AS conflict_count
       FROM reservations
       WHERE table_id=$1
         AND status IN ('pending', 'confirmed')
         AND NOT (end_at <= $2 OR start_at >= $3)`,
      [table_id, start_at, end_at]
    );

    if (parseInt(availability.rows[0].conflict_count) > 0) {
      return res.status(400).json({ message: 'Столик уже забронирован в это время' });
    }

    // 5. Если все проверки пройдены, создаем бронь
    const result = await pool.query(
      `INSERT INTO reservations (table_id, customer_name, customer_phone, start_at, end_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [table_id, customer_name, customer_phone, start_at, end_at]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при создании брони' });
  }
};

// Получить бронь по ID (админ)
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.id, r.table_id, t.name AS table_name, r.customer_name, r.customer_phone, 
              r.start_at, r.end_at, r.status, r.created_at
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Бронь не найдена' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении брони' });
  }
};

// Обновить бронь (админ)
export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { table_id, customer_name, customer_phone, start_at, end_at, status } = req.body;

    // 1. Проверяем, существует ли столик
    const tableCheck = await pool.query(
      `SELECT id, name, is_occupied FROM tables WHERE id=$1`,
      [table_id]
    );

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Столик не найден' });
    }

    const table = tableCheck.rows[0];

    // 2. Проверяем текущую занятость столика (если меняем столик)
    const currentReservation = await pool.query(
      `SELECT table_id FROM reservations WHERE id=$1`,
      [id]
    );

    if (currentReservation.rows.length === 0) {
      return res.status(404).json({ message: 'Бронь не найдена' });
    }

    // Если меняем столик, проверяем его доступность
    if (currentReservation.rows[0].table_id !== table_id) {
      if (table.is_occupied) {
        return res.status(400).json({ message: 'Новый столик сейчас занят' });
      }

      // Проверяем активные заказы на новом столике
      const activeOrders = await pool.query(
        `SELECT COUNT(*) FROM orders 
         WHERE table_id=$1 AND status NOT IN ('completed', 'cancelled')`,
        [table_id]
      );

      if (parseInt(activeOrders.rows[0].count) > 0) {
        return res.status(400).json({ message: 'На новом столике есть активные заказы' });
      }
    }

    // 3. Проверяем конфликты с другими бронированиями (исключая текущую бронь)
    const availability = await pool.query(
      `SELECT COUNT(*) AS conflict_count
       FROM reservations
       WHERE table_id=$1
         AND id != $2
         AND status IN ('pending', 'confirmed')
         AND NOT (end_at <= $3 OR start_at >= $4)`,
      [table_id, id, start_at, end_at]
    );

    if (parseInt(availability.rows[0].conflict_count) > 0) {
      return res.status(400).json({ message: 'Столик уже забронирован в это время' });
    }

    // 4. Если все проверки пройдены, обновляем бронь
    const result = await pool.query(
      `UPDATE reservations SET table_id=$1, customer_name=$2, customer_phone=$3, 
              start_at=$4, end_at=$5, status=$6 WHERE id=$7 RETURNING *`,
      [table_id, customer_name, customer_phone, start_at, end_at, status, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Бронь не найдена' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении брони' });
  }
};

// Удалить бронь (админ)
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, есть ли связанные заказы
    const ordersResult = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE reservation_id=$1`,
      [id]
    );

    if (parseInt(ordersResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Нельзя удалить бронь с связанными заказами. Сначала удалите заказы.' 
      });
    }

    const result = await pool.query(`DELETE FROM reservations WHERE id=$1 RETURNING *`, [id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Бронь не найдена' });

    res.json({ message: 'Бронь успешно удалена', deletedReservation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при удалении брони' });
  }
};

// Обновить статус брони (только админ)
export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE reservations SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Бронь не найдена' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении статуса брони' });
  }
};
