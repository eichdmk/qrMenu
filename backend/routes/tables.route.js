import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import {
  createTable,
  getAllTables,
  getTablesWithAvailability,
  getTableById,
  getTableByToken,
  updateTable,
  updateTableStatus,
  deleteTable
} from '../controllers/tables.controller.js';

const router = express.Router();

// Получить все столики (только для админа)
router.get('/', authenticateToken, isAdmin, getAllTables);

// Получить столики с информацией о доступности (публично для бронирования)
router.get('/availability', getTablesWithAvailability);

// Получить столик по ID (админ)
router.get('/id/:id', authenticateToken, isAdmin, getTableById);

// Получить столик по токену (для QR-кода, публичный)
router.get('/:token', getTableByToken);

// Добавить новый столик (админ)
router.post('/', authenticateToken, isAdmin, createTable);

// Обновить столик (админ)
router.put('/:id', authenticateToken, isAdmin, updateTable);

// Обновить только статус столика (админ)
router.patch('/:id/status', authenticateToken, isAdmin, updateTableStatus);

// Удалить столик (админ)
router.delete('/:id', authenticateToken, isAdmin, deleteTable);

export default router;
