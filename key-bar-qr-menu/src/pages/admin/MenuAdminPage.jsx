import { useAuth } from "../../contexts/AuthContext";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import MenuManager from "../../components/Admin/MenuManager";
import ProtectedRoute from "../../components/ProtectedRoute";
import styles from "../AdminPage.module.css";

function MenuAdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute adminOnly>
      <div className={styles.adminPage}>
        <AdminSidebar activeTab="menu" />
        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Управление меню</h1>
          </div>
          <MenuManager />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default MenuAdminPage;
