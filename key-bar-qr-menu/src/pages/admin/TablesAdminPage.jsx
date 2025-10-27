import { useAuth } from "../../contexts/AuthContext";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import TableManager from "../../components/Admin/TableManager";
import ProtectedRoute from "../../components/ProtectedRoute";
import styles from "../AdminPage.module.css";

function TablesAdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute adminOnly>
      <div className={styles.adminPage}>
        <AdminSidebar activeTab="tables" />
        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Управление столиками</h1>
          </div>
          <TableManager />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default TablesAdminPage;
