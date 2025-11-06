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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && isAuthenticated) {

      forceLogout();
    }
  }, [isAuthenticated, forceLogout]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;