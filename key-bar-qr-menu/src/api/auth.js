import api from './index';

// 🧩 AUTH
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  verify: () => api.get("/auth/verify"),
};