import { useAuth } from "../../contexts/AuthContext";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import OrderManager from "../../components/Admin/OrderManager";
import ProtectedRoute from "../../components/ProtectedRoute";
import styles from "../AdminPage.module.css";

function OrdersAdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute adminOnly>
      <div className={styles.adminPage}>
        <AdminSidebar activeTab="orders" />
        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Управление заказами</h1>
          </div>
          <OrderManager />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default OrdersAdminPage;
