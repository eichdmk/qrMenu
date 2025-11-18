import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMenuPaginated } from "../hooks/useMenuPaginated";
import { createOrder } from "../api/orders";
import { useCart } from "../contexts/CartContext";
import MenuItemCard from "../components/Menu/MenuItemCard";
import CategoryFilter from "../components/Menu/CategoryFilter";
import CartPreview from "../components/Cart/CartPreview";
import { toast } from "react-toastify";
import { useScrollToTop, useScrollToElementOnChange } from "../hooks/useScrollToTop";
import styles from "./TakeawayPage.module.css";

function TakeawayPage() {
  const { 
    menuItems, 
    categories, 
    loadingMore,
    activeCategory,
    setActiveCategory,
    observerTarget
  } = useMenuPaginated(20);
  const { items, clearCart } = useCart();
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Скроллим наверх при загрузке страницы
  useScrollToTop();
  
  // Скроллим к началу меню при смене категории (с offset, чтобы было видно фильтр и первое блюдо)
  useScrollToElementOnChange(activeCategory, "#menu-grid", "smooth", 200);

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Ваша корзина пуста!");
      return;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error("Пожалуйста, укажите имя и телефон");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        orderType: "takeaway",
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      await createOrder(orderData);
      setOrderPlaced(true);
      clearCart();
      toast.success("Заказ на самовывоз оформлен!");
    } catch (error) {
      toast.error("Ошибка при оформлении заказа");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successContent}>
          <div className={styles.successIcon}>✅</div>
          <h1 className={styles.successTitle}>Заказ оформлен!</h1>
          <p className={styles.successText}>
            Ваш заказ на самовывоз принят. Мы сообщим, когда он будет готов.
          </p>
          <div className={styles.orderInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>👤 Имя:</span>
              <span className={styles.infoValue}>{customerInfo.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>📞 Телефон:</span>
              <span className={styles.infoValue}>{customerInfo.phone}</span>
            </div>
          </div>
          <button 
            className={styles.homeButton} 
            onClick={() => navigate("/")}
          >
            <span className={styles.buttonIcon}>🏠</span>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.takeawayPage}>
      <div className={styles.container} id="menu">
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>🥡</div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Заказ с собой</h1>
              <p className={styles.headerSubtitle}>
                Выберите блюда из меню, затем перейдите в корзину для оформления заказа
              </p>
            </div>
          </div>
        </header>

        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <div className={styles.menuGrid} id="menu-grid">
          {menuItems.map((item, index) => (
            <div 
              key={item.id}
              className={styles.menuItemWrapper}
              style={{ animationDelay: `${Math.min(index, 10) * 0.1}s` }}
            >
              <MenuItemCard item={item} />
            </div>
          ))}
          
          <div ref={observerTarget} style={{ height: '20px' }}></div>
          
          {loadingMore && (
            <div className={styles.loadingMore}>
              <div className={styles.spinner}></div>
              <p>Загрузка...</p>
            </div>
          )}
        </div>
      </div>

      <CartPreview />
    </div>
  );
}

export default TakeawayPage;
