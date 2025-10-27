import { useAuth } from "../../contexts/AuthContext";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import ReservationManager from "../../components/Admin/ReservationManager";
import ProtectedRoute from "../../components/ProtectedRoute";
import styles from "../AdminPage.module.css";

function ReservationsAdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute adminOnly>
      <div className={styles.adminPage}>
        <AdminSidebar activeTab="reservations" />
        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Управление бронированиями</h1>
          </div>
          <ReservationManager />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default ReservationsAdminPage;
