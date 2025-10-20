import axios from "axios";

const API_URL = "http://localhost:3000/api";

// Создаем экземпляр Axios с базовыми настройками
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- INTERCEPTOR для добавления токена в каждый запрос ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Обработка ошибки запроса
    return Promise.reject(error);
  }
);

// --- INTERCEPTOR для обработки ответов (например, ошибка 401) ---
api.interceptors.response.use(
  (response) => {
    // Любой код статуса, который находится в диапазоне 2xx, вызывает эту функцию
    return response;
  },
  (error) => {
    // Любые коды статуса, которые выходят за пределы диапазона 2xx, вызывают эту функцию
    if (error.response?.status === 401) {
      // Если токен просрочен или невалиден, удаляем его и перенаправляем на страницу входа
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;