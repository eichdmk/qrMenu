/**
 * Тестовый скрипт для проверки системы автоматического выхода при истечении токена
 * 
 * Этот файл можно использовать для тестирования функциональности в браузере
 */

// Функция для тестирования истечения токена
function testTokenExpiration() {
  console.log('🧪 Тестирование системы истечения токена...');
  
  // Проверяем, что токен существует
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ Токен не найден. Сначала войдите в систему.');
    return;
  }
  
  console.log('✅ Токен найден:', token.substring(0, 20) + '...');
  
  // Симулируем истечение токена, удаляя его из localStorage
  console.log('🔄 Симулируем истечение токена...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Проверяем, что токен удален
  const tokenAfterRemoval = localStorage.getItem('token');
  if (!tokenAfterRemoval) {
    console.log('✅ Токен успешно удален из localStorage');
  }
  
  // Попробуем сделать запрос к API (должен вызвать 401 и автоматический logout)
  console.log('🌐 Делаем тестовый запрос к API...');
  
  fetch('http://0.0.0.0:3000/api/menu', {
    headers: {
      'Authorization': `Bearer ${token}` // Используем старый токен
    }
  })
  .then(response => {
    console.log('📡 Ответ сервера:', response.status);
    if (response.status === 401) {
      console.log('✅ Получен ожидаемый статус 401 - токен истек');
    }
  })
  .catch(error => {
    console.log('❌ Ошибка запроса:', error);
  });
}

// Функция для проверки защищенных маршрутов
function testProtectedRoutes() {
  console.log('🛡️ Тестирование защищенных маршрутов...');
  
  // Проверяем текущий URL
  const currentPath = window.location.pathname;
  console.log('📍 Текущий путь:', currentPath);
  
  if (currentPath.startsWith('/admin')) {
    console.log('🔒 Находимся в админ панели');
    
    // Проверяем наличие токена
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ Токен отсутствует - должен произойти автоматический logout');
    } else {
      console.log('✅ Токен присутствует');
    }
  }
}

// Экспортируем функции для использования в консоли браузера
window.testTokenExpiration = testTokenExpiration;
window.testProtectedRoutes = testProtectedRoutes;

console.log('🧪 Тестовые функции загружены:');
console.log('- testTokenExpiration() - тестирует систему истечения токена');
console.log('- testProtectedRoutes() - проверяет защищенные маршруты');

