import { authenticateToken, isAdmin } from '../middleware/auth.js';
import {
  getAllOrders,
  createOrder,
  updateOrderStatus,
  streamOrders,
  manualCleanupOrders,
  getOrderByPaymentId,
  getOrderSummaryPublic
} from '../controllers/orders.controller.js';

export default async function ordersRoutes(fastify, options) {
  // Получить все заказы — админ
  fastify.get('/', { preHandler: [authenticateToken, isAdmin] }, getAllOrders);

  // Создать заказ — клиент
  fastify.post('/', createOrder);

  // Публичная сводка заказа
  fastify.get('/summary/:orderId', getOrderSummaryPublic);

  // Получить заказ по идентификатору платежа — клиент
  fastify.get('/payment/:paymentId', getOrderByPaymentId);

  // Обновить статус заказа — админ
  fastify.put('/:id', { preHandler: [authenticateToken, isAdmin] }, updateOrderStatus);

  // SSE endpoint для уведомлений о новых заказах
  fastify.get('/stream', streamOrders);

  // Ручная очистка старых заказов — админ
  fastify.post('/cleanup', { preHandler: [authenticateToken, isAdmin] }, manualCleanupOrders);
}
