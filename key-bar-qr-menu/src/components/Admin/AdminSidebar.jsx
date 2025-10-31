import { useNavigate, useLocation } from "react-router-dom";
import { MenuIcon, FolderIcon, TableIcon, ClipboardIcon, CalendarIcon, AdminIcon } from "../Icons/AdminIcons";
import styles from "./AdminSidebar.module.css";

function AdminSidebar({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: "menu", label: "Меню", icon: MenuIcon, path: "/admin/menu" },
    { id: "categories", label: "Категории", icon: FolderIcon, path: "/admin/categories" },
    { id: "tables", label: "Столики", icon: TableIcon, path: "/admin/tables" },
    { id: "orders", label: "Заказы", icon: ClipboardIcon, path: "/admin/orders" },
    { id: "reservations", label: "Бронирования", icon: CalendarIcon, path: "/admin/reservations" },
  ];

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
              <span className={styles.label}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default AdminSidebar;