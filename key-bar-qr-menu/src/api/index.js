import axios from "axios";
import { handleTokenExpiration, isTokenExpired } from "../utils/authUtils";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const PUBLIC_ENDPOINTS = ['/menu', '/categories'];

function isPublicEndpoint(url) {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (isTokenExpired(error)) {
      const url = error.config?.url || '';
      if (!isPublicEndpoint(url) && !url.includes('/auth/verify')) {
        handleTokenExpiration();
      }
    }
    return Promise.reject(error);
  }
);

export default api;