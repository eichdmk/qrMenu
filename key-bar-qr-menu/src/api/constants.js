// Константы для API
const resolveApiBaseUrl = () => {
  const envUrl =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
    (typeof process !== "undefined" && process.env && process.env.VITE_API_URL) ||
    "https://localhost:3000/api";

  return envUrl.replace(/\/$/, "");
};

export const API_BASE_URL = resolveApiBaseUrl();

const resolveStaticBaseUrl = () => {
  try {
    const apiUrl = new URL(API_BASE_URL);
    const pathname = apiUrl.pathname.replace(/\/?api\/?$/, "");
    return `${apiUrl.origin}${pathname}`.replace(/\/$/, "");
  } catch (error) {
    return "https://localhost:3000";
  }
};

export const STATIC_BASE_URL = resolveStaticBaseUrl();

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder-food.jpg";
  return `${STATIC_BASE_URL}${imagePath}`;
};
