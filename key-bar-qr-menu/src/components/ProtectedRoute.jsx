import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './ProtectedRoute.module.css';

/**
 * Компонент-обертка для защиты маршрутов.
 * Перенаправляет неавторизованных пользователей на страницу входа.
 *
 * @param {object} props - Свойства компонента.
 * @param {React.ReactNode} props.children - Компоненты, которые нужно отобразить, если пользователь авторизован.
 * @param {boolean} [props.adminOnly=false] - Если true, маршрут доступен только администраторам.
 */
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading, forceLogout } = useAuth();

  // Проверяем токен при каждом рендере компонента
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && isAuthenticated) {
      // Если токен отсутствует, но пользователь считается авторизованным,
      // принудительно выходим из системы
      forceLogout();
    }
  }, [isAuthenticated, forceLogout]);

  // 1. Показываем индикатор загрузки, пока проверяется статус авторизации
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  // 2. Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    // `replace` заменяет текущую запись в истории, чтобы пользователь не мог вернуться назад
    return <Navigate to="/login" replace />;
  }

  // 3. Если маршрут только для админов, а пользователь не админ, перенаправляем на главную
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 4. Если все проверки пройдены, отображаем дочерние компоненты
  return children;
}

export default ProtectedRoute;