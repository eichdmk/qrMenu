import api from "./index";

export const paymentsAPI = {
  getStatus: (paymentId) => api.get(`/payments/yookassa/payment/${paymentId}`),
};


