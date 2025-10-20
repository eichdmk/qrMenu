import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Для __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

// Получить все блюда
export const getAllMenuItems = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.category_id, c.name AS category_name, m.name, m.description, m.price, m.image_url, m.available
       FROM menu_items m
       LEFT JOIN categories c ON m.category_id = c.id
       ORDER BY m.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении меню' });
  }
};

// Получить блюдо по ID
export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT m.id, m.category_id, c.name AS category_name, m.name, m.description, m.price, m.image_url, m.available
       FROM menu_items m
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Блюдо не найдено' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении блюда' });
  }
};

// Добавить новое блюдо
export const createMenuItem = async (req, res) => {
  try {
    const { category_id, name, description, price, available } = req.body;
    let image_url = null;

    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, image_url, available)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [category_id || null, name, description, price, image_url, available ?? true]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при добавлении блюда' });
  }
};

// Обновить блюдо
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, available } = req.body;

    // Получаем текущее блюдо
    const current = await pool.query(`SELECT * FROM menu_items WHERE id=$1`, [id]);
    if (current.rows.length === 0) return res.status(404).json({ message: 'Блюдо не найдено' });

    let image_url = current.rows[0].image_url;

    // Если загружен новый файл, заменяем
    if (req.file) {
      // Удаляем старое изображение
      if (image_url) {
        const oldPath = path.join(__dirname, '../', image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE menu_items SET category_id=$1, name=$2, description=$3, price=$4, image_url=$5, available=$6
       WHERE id=$7 RETURNING *`,
      [category_id || null, name, description, price, image_url, available ?? true, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении блюда' });
  }
};

// Удалить блюдо
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Получаем текущее блюдо
    const current = await pool.query(`SELECT * FROM menu_items WHERE id=$1`, [id]);
    if (current.rows.length === 0) return res.status(404).json({ message: 'Блюдо не найдено' });

    // Удаляем изображение, если есть
    const image_url = current.rows[0].image_url;
    if (image_url) {
      const imgPath = path.join(__dirname, '../', image_url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await pool.query(`DELETE FROM menu_items WHERE id=$1`, [id]);
    res.json({ message: 'Блюдо удалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при удалении блюда' });
  }
};
