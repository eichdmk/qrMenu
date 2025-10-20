import api from './index';

// 📅 RESERVATIONS (бронирования)
export const reservationsAPI = {
  getAll: () => api.get("/reservations"),
  getById: (id) => api.get(`/reservations/${id}`),
  create: (data) => api.post("/reservations", data),
  update: (id, data) => api.put(`/reservations/${id}`, data),
  updateStatus: (id, data) => api.patch(`/reservations/${id}/status`, data),
  delete: (id) => api.delete(`/reservations/${id}`),
};