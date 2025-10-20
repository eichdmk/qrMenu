import api from './index';

// 🧾 ORDERS (заказы)
export const ordersAPI = {
  getAll: () => api.get("/orders"),
  create: (data) => api.post("/orders", data),
  updateStatus: (id, data) => api.put(`/orders/${id}`, data),
};