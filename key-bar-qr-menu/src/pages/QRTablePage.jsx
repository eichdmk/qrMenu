import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMenuPaginated } from "../hooks/useMenuPaginated";
import { createOrder } from "../api/orders";
import { tablesAPI } from "../api/tables";
import { toast } from "react-toastify";
import { useCart } from "../contexts/CartContext";
import MenuItemCard from "../components/Menu/MenuItemCard";
import CategoryFilter from "../components/Menu/CategoryFilter";
import QRCart from "../components/Cart/QRCart";
import { formatPrice } from "../utils/format";
import { useScrollToTop, useScrollToTopOnChange } from "../hooks/useScrollToTop";
import styles from "./QRTablePage.module.css";

function QRTablePage() {
  const { token } = useParams();
  const { clearCart } = useCart();
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
  const [orderId, setOrderId] = useState(null);

  const loading = tableLoading || menuLoading;

  // Скроллим наверх при загрузке страницы
  useScrollToTop();
  
  // Скроллим наверх при смене категории
  useScrollToTopOnChange(activeCategory);

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
      const response = await createOrder(orderData);
      setOrderId(response.order_id || response.id);
      setOrderPlaced(true);
      // Очищаем корзину и sessionStorage после оформления заказа
      clearCart();
      sessionStorage.clear();
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
          <h2>Столик не найден</h2>
          <p>Проверьте правильность QR-кода или обратитесь к официанту</p>
          <button className={styles.retryButton}>
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
          <div className={styles.successIcon}>✓</div>
          <div className={styles.headerSection}>
            <h2 className={styles.successTitle}>Заказ принят!</h2>
            {orderId && (
              <div className={styles.orderNumber}>
                <span className={styles.orderNumberLabel}>№</span>
                <span className={styles.orderNumberValue}>{orderId}</span>
              </div>
            )}
          </div>
          <p className={styles.successText}>Официант скоро подойдет к вашему столику</p>
          <div className={styles.tableInfo}>
            <div className={styles.infoIcon}>🪑</div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Столик</span>
              <span className={styles.infoValue}>№{table.name}</span>
            </div>
          </div>
          <button
            className={styles.newOrderButton}
            onClick={() => {
              setOrderPlaced(false);
              setOrderId(null);
            }}
          >
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

              <div className={styles.tableDetails}>
                <h1 className={styles.tableTitle}>
                  <span className={styles.tableNumber}>{table.name}</span>
                </h1>
                <p className={styles.tableSubtitle}>
                  Сделайте заказ прямо со своего смартфона
                </p>
              </div>
            </div>
            <div className={styles.qrInfo}>
              <span className={styles.qrText}>QR Меню</span>
            </div>
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
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