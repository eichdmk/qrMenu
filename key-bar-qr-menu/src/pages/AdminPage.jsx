import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AdminSidebar from "../components/Admin/AdminSidebar";
import MenuManager from "../components/Admin/MenuManager";
import CategoryManager from "../components/Admin/CategoryManager";
import TableManager from "../components/Admin/TableManager";
import OrderManager from "../components/Admin/OrderManager";
import ReservationManager from "../components/Admin/ReservationManager";
import ProtectedRoute from "../components/ProtectedRoute";
import styles from "./AdminPage.module.css";

function AdminPage() {
  const [activeTab, setActiveTab] = useState("menu");
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case "menu":
        return <MenuManager />;
      case "categories":
        return <CategoryManager />;
      case "tables":
        return <TableManager />;
      case "orders":
        return <OrderManager />;
      case "reservations":
        return <ReservationManager />;
      default:
        return <MenuManager />;
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <div className={styles.adminPage}>
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Панель администратора</h1>
            <p>Добро пожаловать, {user?.username}!</p>
          </div>
          {renderContent()}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default AdminPage;