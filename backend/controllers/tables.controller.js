import pool from '../db.js';

// Добавить новый столик
export const createTable = async (req, res) => {
  try {
    const { name, seats } = req.body;
    const result = await pool.query(
      `INSERT INTO tables (name, seats) VALUES ($1, $2) RETURNING *`,
      [name, seats]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при добавлении столика' });
  }
};


// Получить все столики с информацией о доступности (для бронирования)
export const getTablesWithAvailability = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.seats, t.is_occupied,
              COUNT(CASE WHEN o.status NOT IN ('completed', 'cancelled') THEN 1 END) as active_orders_count,
              COUNT(CASE WHEN r.status IN ('pending', 'confirmed') THEN 1 END) as active_reservations_count
       FROM tables t
       LEFT JOIN orders o ON t.id = o.table_id
       LEFT JOIN reservations r ON t.id = r.table_id
       GROUP BY t.id, t.name, t.seats, t.is_occupied
       ORDER BY t.id`
    );

    // Добавляем информацию о доступности
    const tablesWithAvailability = result.rows.map(table => ({
      ...table,
      is_available: !table.is_occupied && 
                   parseInt(table.active_orders_count) === 0 && 
                   parseInt(table.active_reservations_count) === 0,
      availability_reason: table.is_occupied ? 'Занят' :
                          parseInt(table.active_orders_count) > 0 ? 'Активные заказы' :
                          parseInt(table.active_reservations_count) > 0 ? 'Забронирован' :
                          'Доступен'
    }));

    res.json(tablesWithAvailability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении столиков' });
  }
};

// Получить все столики
export const getAllTables = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, token, seats, is_occupied, created_at FROM tables ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении столиков' });
  }
};

// Получить столик по токену (для QR)
export const getTableByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pool.query(
      `SELECT id, name, token, seats, is_occupied FROM tables WHERE token=$1`,
      [token]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Столик не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при поиске столика' });
  }
};

// Получить столик по ID (админ)
export const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, name, token, seats, is_occupied, created_at FROM tables WHERE id=$1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Столик не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении столика' });
  }
};

// Обновить столик (админ)
export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, seats, is_occupied } = req.body;

    const result = await pool.query(
      `UPDATE tables SET name=$1, seats=$2, is_occupied=$3 WHERE id=$4 RETURNING *`,
      [name, seats, is_occupied, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Столик не найден' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении столика' });
  }
};

// Удалить столик (админ)
export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, есть ли активные заказы для этого столика
    const ordersResult = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE table_id=$1 AND status NOT IN ('completed', 'cancelled')`,
      [id]
    );

    if (parseInt(ordersResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Нельзя удалить столик с активными заказами. Сначала завершите все заказы.' 
      });
    }

    // Проверяем, есть ли активные бронирования
    const reservationsResult = await pool.query(
      `SELECT COUNT(*) FROM reservations WHERE table_id=$1 AND status IN ('pending', 'confirmed')`,
      [id]
    );

    if (parseInt(reservationsResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Нельзя удалить столик с активными бронированиями. Сначала отмените бронирования.' 
      });
    }

    const result = await pool.query(`DELETE FROM tables WHERE id=$1 RETURNING *`, [id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Столик не найден' });

    res.json({ message: 'Столик успешно удален', deletedTable: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при удалении столика' });
  }
};

// Обновить статус столика (занят/свободен) — только админ
export const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_occupied } = req.body;

    const result = await pool.query(
      `UPDATE tables SET is_occupied=$1 WHERE id=$2 RETURNING *`,
      [is_occupied, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Столик не найден' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении статуса столика' });
  }
};
