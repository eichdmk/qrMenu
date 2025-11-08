import { handleYooKassaWebhook } from '../controllers/payments.controller.js';

export default async function paymentsRoutes(fastify) {
  fastify.post('/yookassa/webhook', handleYooKassaWebhook);
}

