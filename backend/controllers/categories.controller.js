import pool from '../db.js';

// Получить все категории
export const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении категорий' });
  }
};

// Добавить новую категорию
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при добавлении категории' });
  }
};

// Обновить категорию
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name=$1 WHERE id=$2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Категория не найдена' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении категории' });
  }
};

// Удалить категорию
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Можно добавить проверку: есть ли блюда в категории
    const result = await pool.query('DELETE FROM categories WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Категория не найдена' });
    res.json({ message: 'Категория удалена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при удалении категории' });
  }
};
