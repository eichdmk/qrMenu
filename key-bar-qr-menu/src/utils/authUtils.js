/**
 * Утилиты для работы с аутентификацией
 */

// Глобальная переменная для хранения функции принудительного выхода
let globalForceLogout = null;

/**
 * Устанавливает функцию принудительного выхода
 * @param {Function} forceLogoutFn - Функция для принудительного выхода
 */
export const setGlobalForceLogout = (forceLogoutFn) => {
  globalForceLogout = forceLogoutFn;
};

/**
 * Вызывает принудительный выход при истечении токена
 */
export const handleTokenExpiration = () => {
  if (globalForceLogout) {
    globalForceLogout();
  } else {
    // Fallback: если функция не установлена, используем прямой редирект
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

/**
 * Проверяет, истек ли токен на основе ответа сервера
 * @param {Object} error - Объект ошибки от axios
 * @returns {boolean} - true если токен истек
 */
export const isTokenExpired = (error) => {
  return error.response?.status === 401;
};

