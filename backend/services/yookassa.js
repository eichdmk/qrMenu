import YooKassa from 'yookassa';

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

let client = null;

function getCheckout() {
  if (!shopId || !secretKey) {
    return null;
  }

  if (!client) {
    client = new YooKassa({
      shopId,
      secretKey,
    });
  }
  return client;
}

export const isYooKassaConfigured = () => Boolean(getCheckout());

export const createYooKassaPayment = async ({
  amount,
  orderId,
  description,
  returnUrl,
  metadata = {},
  capture = true,
}) => {
  const checkout = getCheckout();
  if (!checkout) {
    throw new Error('YooKassa is not configured');
  }

  const safeAmount = Number.parseFloat(amount);
  if (Number.isNaN(safeAmount) || safeAmount <= 0) {
    throw new Error('Invalid amount for YooKassa payment');
  }

  const payment = await checkout.createPayment({
    amount: {
      value: safeAmount.toFixed(2),
      currency: 'RUB',
    },
    capture,
    confirmation: {
      type: 'redirect',
      return_url: returnUrl,
    },
    description,
    metadata: {
      order_id: orderId,
      ...metadata,
    },
  });

  return payment;
};

export const getYooKassaPayment = async (paymentId) => {
  const checkout = getCheckout();
  if (!checkout) {
    throw new Error('YooKassa is not configured');
  }

  if (!paymentId) {
    throw new Error('Payment ID is required');
  }

  return checkout.getPayment(paymentId);
};

