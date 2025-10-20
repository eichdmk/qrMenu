import styles from "./AdminSidebar.module.css";

function AdminSidebar({ activeTab, onTabChange }) {
  const tabs = [
    { id: "menu", label: "Меню", icon: "🍽️" },
    { id: "categories", label: "Категории", icon: "📁" },
    { id: "tables", label: "Столики", icon: "🪑" },
    { id: "orders", label: "Заказы", icon: "📋" },
    { id: "reservations", label: "Бронирования", icon: "📅" },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2>🍽️ Админ панель</h2>
      </div>
      <nav className={styles.nav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.navButton} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className={styles.icon}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;