// Константы для API
export const API_BASE_URL = "http://localhost:3000/api";
export const STATIC_BASE_URL = "http://localhost:3000";

// Функция для получения полного URL изображения
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder-food.jpg";
  return `${STATIC_BASE_URL}${imagePath}`;
};
