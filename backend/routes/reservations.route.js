import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation
} from '../controllers/reservations.controller.js';

const router = express.Router();

// Получить все брони — админ
router.get('/', authenticateToken, isAdmin, getAllReservations);

// Получить бронь по ID — админ
router.get('/:id', authenticateToken, isAdmin, getReservationById);

// Создать бронь — клиент (публично)
router.post('/', createReservation);

// Обновить бронь — админ
router.put('/:id', authenticateToken, isAdmin, updateReservation);

// Обновить только статус брони — админ
router.patch('/:id/status', authenticateToken, isAdmin, updateReservationStatus);

// Удалить бронь — админ
router.delete('/:id', authenticateToken, isAdmin, deleteReservation);

export default router;
