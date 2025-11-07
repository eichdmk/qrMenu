import Fastify from 'fastify';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { createDefaultAdmin } from './utils/initAdmin.js';
import { cleanupOldOrders } from './utils/cleanupOrders.js';
// Роуты
import menuRoutes from './routes/menu.route.js';
import ordersRoutes from './routes/orders.route.js';
import tablesRoutes from './routes/tables.route.js';
import reservationsRoutes from './routes/reservations.route.js';
import uploadRoutes from './routes/uploads.route.js';
import categoriesRoutes from './routes/categories.route.js';
import authRoutes from './routes/auth.route.js'; 

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: false
});

await fastify.register(import('@fastify/cors'), {
  origin: true
});

await fastify.register(import('@fastify/rate-limit'), {
  global: true,
  max: 100,
  timeWindow: '1 minute',
  hook: 'onRequest',
  allowList: (req, key) => req.ip === '127.0.0.1' || req.ip === '::1',
  errorResponseBuilder: (request, context) => {
    const retryAfter = Math.round(context.ttl / 1000);
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Превышен лимит запросов. Попробуйте позже.',
      retryAfter
    };
  }
});

await fastify.register(import('@fastify/static'), {
  root: path.join(__dirname, 'uploads'),
  prefix: '/uploads/'
});

await fastify.register(import('@fastify/multipart'), {
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
});

await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(menuRoutes, { prefix: '/api/menu' });
await fastify.register(ordersRoutes, { prefix: '/api/orders' });
await fastify.register(tablesRoutes, { prefix: '/api/tables' });
await fastify.register(reservationsRoutes, { prefix: '/api/reservations' });
await fastify.register(uploadRoutes, { prefix: '/api/upload' });
await fastify.register(categoriesRoutes, { prefix: '/api/categories' });

// Главная страница
fastify.get('/', async (request, reply) => {
  return { message: 'QR-Меню сервер работает!' };
});

// Обработчик 404
fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({ message: 'Эндпоинт не найден' });
});

// Создаем админа по умолчанию
createDefaultAdmin();

// Запускается каждый день в 3:00 ночи и проверяет заказы старше 7 дней
cron.schedule('0 3 * * *', async () => {
  console.log('[Cron] Запуск автоматической очистки старых заказов...');
  try {
    const result = await cleanupOldOrders(7);
    console.log(`[Cron] Очистка завершена: удалено ${result.deletedOrders} заказов`);
  } catch (error) {
    console.error('[Cron] Ошибка при автоматической очистке:', error);
  }
}, {
  scheduled: true,
  timezone: "Europe/Moscow"
});

console.log('[Server] Автоматическая очистка заказов настроена (каждый день в 3:00, удаляет заказы старше 7 дней)');

// Запусксервер
const start = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
