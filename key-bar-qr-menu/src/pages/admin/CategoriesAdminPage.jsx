import { useAuth } from "../../contexts/AuthContext";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import CategoryManager from "../../components/Admin/CategoryManager";
import ProtectedRoute from "../../components/ProtectedRoute";
import styles from "../AdminPage.module.css";

function CategoriesAdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute adminOnly>
      <div className={styles.adminPage}>
        <AdminSidebar activeTab="categories" />
        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Управление категориями</h1>
          </div>
          <CategoryManager />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default CategoriesAdminPage;
