import api from './index';

// 🍽️ MENU (меню блюд)
export const menuAPI = {
  getAll: () => api.get("/menu"),
  getPaginated: (params) => api.get("/menu/paginated", { params }),
  getById: (id) => api.get(`/menu/${id}`),
  create: (data) => api.post("/menu", data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
};