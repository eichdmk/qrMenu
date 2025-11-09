import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { MenuIcon, FolderIcon, TableIcon, ClipboardIcon, CalendarIcon, AdminIcon } from "../Icons/AdminIcons";
import { reservationsAPI } from "../../api/reservations";
import styles from "./AdminSidebar.module.css";

function AdminSidebar({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingReservations, setPendingReservations] = useState(0);

  const tabs = [
    { id: "menu", label: "Меню", icon: MenuIcon, path: "/admin/menu" },
    { id: "categories", label: "Категории", icon: FolderIcon, path: "/admin/categories" },
    { id: "tables", label: "Столики", icon: TableIcon, path: "/admin/tables" },
    { id: "orders", label: "Заказы", icon: ClipboardIcon, path: "/admin/orders" },
    { id: "reservations", label: "Бронирования", icon: CalendarIcon, path: "/admin/reservations" },
  ];

  const fetchPendingReservations = useCallback(async () => {
    try {
      const response = await reservationsAPI.getAll();
      const list = Array.isArray(response.data) ? response.data : [];
      const pending = list.filter((item) => item.status === "pending").length;
      setPendingReservations(pending);
    } catch (error) {
      // пропускаем ошибку, уведомление не критично для бокового меню
    }
  }, []);

  useEffect(() => {
    fetchPendingReservations();

    const handleExternalUpdate = (event) => {
      if (typeof event?.detail === "number") {
        setPendingReservations(event.detail);
      } else {
        fetchPendingReservations();
      }
    };

    window.addEventListener("reservations:pending-count", handleExternalUpdate);

    const interval = setInterval(fetchPendingReservations, 60000);

    return () => {
      window.removeEventListener("reservations:pending-count", handleExternalUpdate);
      clearInterval(interval);
    };
  }, [fetchPendingReservations]);

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <AdminIcon size={24} />
        <h2>Админ панель</h2>
      </div>
      <nav className={styles.nav}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${styles.navButton} ${location.pathname === tab.path ? styles.active : ""}`}
              onClick={() => handleTabClick(tab.path)}
            >
              <span className={styles.icon}>
                <IconComponent size={20} />
              </span>
              <span className={styles.label}>
                {tab.label}
                {tab.id === "reservations" && pendingReservations > 0 && (
                  <span className={styles.badge}>{pendingReservations}</span>
                )}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default AdminSidebar;