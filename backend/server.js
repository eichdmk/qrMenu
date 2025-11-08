import Fastify from 'fastify';
import dotenv from 'dotenv';
import fs from 'fs';
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
import paymentsRoutes from './routes/payments.route.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certsDir = path.resolve(__dirname, '../infra/certs');
const httpsKeyPath = path.join(certsDir, 'localhost+2-key.pem');
const httpsCertPath = path.join(certsDir, 'localhost+2.pem');

const fastifyOptions = { logger: false };

if (fs.existsSync(httpsKeyPath) && fs.existsSync(httpsCertPath)) {
  fastifyOptions.https = {
    key: fs.readFileSync(httpsKeyPath),
    cert: fs.readFileSync(httpsCertPath),
  };
  console.log('[Server] HTTPS режим включён (локальные сертификаты mkcert)');
} else {
  console.warn('[Server] HTTPS сертификаты не найдены, сервер стартует в HTTP режиме');
}

const fastify = Fastify(fastifyOptions);

await fastify.register(import('@fastify/cors'), {
  origin: true
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
await fastify.register(paymentsRoutes, { prefix: '/api/payments' });

// Главная страница
fastify.get('/', async (request, reply) => {
  return { message: 'QR-Меню сервер работает!' };
});

// Обработчик 404
fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({ message: 'Эндпоинт не найден' });
});

// Создаем админа по умолчанию
try {
  await createDefaultAdmin();
} catch (err) {
  console.warn('[Startup] Пропускаем создание администратора:', err?.message || err);
}

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
