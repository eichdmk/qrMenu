import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMenuPaginated } from "../hooks/useMenuPaginated";
import { createOrder } from "../api/orders";
import { tablesAPI } from "../api/tables";
import { toast } from "react-toastify";
import MenuItemCard from "../components/Menu/MenuItemCard";
import CategoryFilter from "../components/Menu/CategoryFilter";
import QRCart from "../components/Cart/QRCart";
import { formatPrice } from "../utils/format";
import { useScrollToTop } from "../hooks/useScrollToTop";
import styles from "./QRTablePage.module.css";

function QRTablePage() {
  const { token } = useParams();
  const { 
    menuItems, 
    categories, 
    loading: menuLoading, 
    loadingMore,
    activeCategory,
    setActiveCategory,
    observerTarget
  } = useMenuPaginated(20);
  const [table, setTable] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const loading = tableLoading || menuLoading;

  // Скроллим наверх при загрузке страницы
  useScrollToTop();

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const response = await tablesAPI.getByToken(token);
        setTable(response.data);
      } catch (error) {
        toast.error("Неверный QR-код столика");
      } finally {
        setTableLoading(false);
      }
    };

    fetchTable();
  }, [token]);

  const handleCheckout = async (items, comment = "") => {
    if (!table) return;

    try {
      const orderData = {
        tableId: table.id,
        orderType: 'dine_in',
        comment: comment, // Добавляем комментарий к заказу
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      console.log('Sending order data:', orderData);
      await createOrder(orderData);
      setOrderPlaced(true);
      toast.success("Заказ принят!");
    } catch (error) {
      console.error('Order error:', error);
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
    <div className={styles.menuPage}>
      <div className={styles.container} id="menu">
        {/* Header */}
        <div className={styles.header}>
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
        </div>

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

        <div className={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              className={styles.menuItemWrapper}
              style={{ animationDelay: `${Math.min(index, 10) * 0.1}s` }}
            >
              <MenuItemCard item={item} />
            </div>
          ))}
          
          {/* Sentinel element for infinite scroll */}
          <div ref={observerTarget} style={{ height: '20px' }}></div>
          
          {loadingMore && (
            <div className={styles.loadingMore}>
              <div className={styles.spinner}></div>
              <p>Загрузка...</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Cart */}
      <QRCart
        onCheckout={handleCheckout}
        checkoutText="Отправить заказ на кухню"
      />
    </div>
  );
}

export default QRTablePage;