import api from './index';

// TABLES (столики)
export const tablesAPI = {
  getAll: () => api.get("/tables"),
  getWithAvailability: () => api.get("/tables/availability"),
  getAvailabilityForDateTime: (date, time) => api.get(`/tables/availability/date-time?date=${date}&time=${time}`),
  getById: (id) => api.get(`/tables/id/${id}`),
  getByToken: (token) => api.get(`/tables/${token}`),
  create: (data) => api.post("/tables", data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  updateStatus: (id, data) => api.patch(`/tables/${id}/status`, data),
  delete: (id) => api.delete(`/tables/${id}`),
};