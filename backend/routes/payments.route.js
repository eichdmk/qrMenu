import { getPaymentStatusById, handleYooKassaWebhook } from '../controllers/payments.controller.js';

export default async function paymentsRoutes(fastify) {
  fastify.post(
    '/yookassa/webhook',
    {
      config: {
        rawBody: true,
      },
    },
    handleYooKassaWebhook
  );

  fastify.get('/yookassa/payment/:paymentId', getPaymentStatusById);
}

