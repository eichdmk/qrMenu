import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import {
  getAllOrders,
  createOrder,
  updateOrderStatus
} from '../controllers/orders.controller.js';

const router = express.Router();

// Получить все заказы — админ
router.get('/', authenticateToken, isAdmin, getAllOrders);

// Создать заказ — клиент
router.post('/', createOrder);

// Обновить статус заказа — админ
router.put('/:id', authenticateToken, isAdmin, updateOrderStatus);

export default router;
