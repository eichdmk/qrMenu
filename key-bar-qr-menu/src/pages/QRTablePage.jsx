import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { useOrders } from "../hooks/useOrders";
import { tablesAPI } from "../api/tables";
import { toast } from "react-toastify";
import MenuItemCard from "../components/Menu/MenuItemCard";
import CategoryFilter from "../components/Menu/CategoryFilter";
import OrderSummary from "../components/Cart/OrderSummary";
import { formatPrice } from "../utils/format";
import styles from "./QRTablePage.module.css";

function QRTablePage() {
  const { token } = useParams();
  const { menuItems, categories } = useMenu();
  const { createOrder } = useOrders();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const response = await tablesAPI.getByToken(token);
        setTable(response.data);
      } catch (error) {
        toast.error("Неверный QR-код столика");
      } finally {
        setLoading(false);
      }
    };

    fetchTable();
  }, [token]);

  useEffect(() => {
    // Прокручиваем в самый верх страницы при смене категории
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  const handleCheckout = async (items) => {
    if (!table) return;

    try {
      const orderData = {
        tableId: table.id,
        orderType: 'dine_in',
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      await createOrder(orderData);
      setOrderPlaced(true);
      toast.success("Заказ принят!");
    } catch (error) {
      toast.error("Ошибка при оформлении заказа");
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <h3>Загрузка меню...</h3>
          <p>Подготавливаем для вас лучшие блюда</p>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>❌</div>
          <h2>Столик не найден</h2>
          <p>Проверьте правильность QR-кода или обратитесь к официанту</p>
          <button className={styles.retryButton}>
            <span className={styles.buttonIcon}>🔄</span>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className={styles.success}>
        <div className={styles.successContent}>
          <div className={styles.successIcon}>✅</div>
          <h2>Заказ принят!</h2>
          <p>Официант скоро подойдет к вашему столику</p>
          <div className={styles.tableInfo}>
            <span className={styles.tableIcon}>🪑</span>
            <span>Столик №{table.name}</span>
          </div>
          <button 
            className={styles.newOrderButton}
            onClick={() => setOrderPlaced(false)}
          >
            <span className={styles.buttonIcon}>🍽️</span>
            Сделать новый заказ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.tableInfo}>
            <div className={styles.tableIconWrapper}>
              <span className={styles.tableIcon}>🪑</span>
            </div>
            <div className={styles.tableDetails}>
              <h1 className={styles.tableTitle}>
                <span className={styles.tableNumber}>№{table.name}</span>
              </h1>
              <p className={styles.tableSubtitle}>
                Сделайте заказ прямо со своего смартфона
              </p>
            </div>
          </div>
          <div className={styles.qrInfo}>
            <span className={styles.qrIcon}>📱</span>
            <span className={styles.qrText}>QR Меню</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        <main className={styles.menuSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🍽️</span>
              Наше меню
            </h2>
            <p className={styles.sectionSubtitle}>
              Выберите понравившиеся блюда и добавьте в корзину
            </p>
          </div>

          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          
          {menuItems.filter(item => 
            activeCategory === "all" || item.category_id === activeCategory
          ).length > 0 ? (
            <div className={styles.menuGrid}>
              {menuItems
                .filter(item => activeCategory === "all" || item.category_id === activeCategory)
                .map((item, index) => (
                  <div 
                    key={item.id} 
                    className={styles.menuItemWrapper}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <MenuItemCard item={item} />
                  </div>
                ))}
            </div>
          ) : (
            <div className={styles.emptyMenu}>
              <div className={styles.emptyIcon}>🍽️</div>
              <h3>Нет блюд в этой категории</h3>
              <p>Выберите другую категорию</p>
            </div>
          )}
        </main>

        <aside className={styles.orderSection}>
          <OrderSummary 
            onCheckout={handleCheckout}
            checkoutText="Отправить заказ на кухню"
          />
        </aside>
      </div>
    </div>
  );
}

export default QRTablePage;