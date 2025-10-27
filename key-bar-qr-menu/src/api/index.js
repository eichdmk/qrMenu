import axios from "axios";
import { handleTokenExpiration, isTokenExpired } from "../utils/authUtils";

const API_URL = "http://0.0.0.0:3000/api";

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

// Endpoints, которые не должны вызывать редирект на login
const PUBLIC_ENDPOINTS = ['/menu', '/categories'];

// Проверяем, является ли endpoint публичным
function isPublicEndpoint(url) {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

// --- INTERCEPTOR для обработки ответов (например, ошибка 401) ---
api.interceptors.response.use(
  (response) => {
    // Любой код статуса, который находится в диапазоне 2xx, вызывает эту функцию
    return response;
  },
  (error) => {
    // Любые коды статуса, которые выходят за пределы диапазона 2xx, вызывают эту функцию
    if (isTokenExpired(error)) {
      const url = error.config?.url || '';
      
      // Не перенаправляем на /login если:
      // 1. Это публичный endpoint (menu, categories)
      // 2. Или это проверка токена (verify)
      if (!isPublicEndpoint(url) && !url.includes('/auth/verify')) {
        handleTokenExpiration();
      }
    }
    return Promise.reject(error);
  }
);

export default api;