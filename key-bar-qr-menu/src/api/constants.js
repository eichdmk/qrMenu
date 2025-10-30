// Константы для API
export const API_BASE_URL = "http://89.111.169.156:3000/api";
export const STATIC_BASE_URL = "http://89.111.169.156:3000";

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder-food.jpg";
  return `${STATIC_BASE_URL}${imagePath}`;
};
