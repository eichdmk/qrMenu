import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../hooks/useOrders";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/format";
import { getImageUrl } from "../api/constants";
import { toast } from "react-toastify";
import styles from "./TakeawayCheckoutPage.module.css";

function TakeawayCheckoutPage() {
  const { createOrder } = useOrders();
  const { items, clearCart, total, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (items.length === 0) {
    return (
      <div className={styles.emptyPage}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2 className={styles.emptyTitle}>Корзина пуста</h2>
          <p className={styles.emptyText}>Добавьте блюда из меню</p>
          <button 
            className={styles.menuButton}
            onClick={() => navigate('/takeaway')}
          >
            <span className={styles.buttonIcon}>🍽️</span>
            Вернуться в меню
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>🥡</div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Оформление заказа</h1>
              <p className={styles.headerSubtitle}>Укажите ваши данные для самовывоза</p>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.orderSummary}>
            <h3 className={styles.summaryTitle}>
              <span className={styles.summaryIcon}>📋</span>
              Ваш заказ
            </h3>
            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    <img 
                      src={getImageUrl(item.image_url)} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = "/placeholder-food.jpg";
                      }}
                    />
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>
                      {formatPrice(item.price)} × {item.quantity}
                    </span>
                  </div>
                  <span className={styles.itemTotal}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.total}>
              <span className={styles.totalLabel}>Итого:</span>
              <span className={styles.totalValue}>{formatPrice(total)}</span>
            </div>
          </div>

          <div className={styles.customerForm}>
            <h3 className={styles.formTitle}>
              <span className={styles.formIcon}>📝</span>
              Ваши данные
            </h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span className={styles.labelIcon}>👤</span>
                Имя *
              </label>
              <input
                type="text"
                name="name"
                value={customerInfo.name}
                onChange={handleCustomerInfoChange}
                placeholder="Введите ваше имя"
                className={styles.formInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span className={styles.labelIcon}>📞</span>
                Телефон *
              </label>
              <input
                type="tel"
                name="phone"
                value={customerInfo.phone}
                onChange={handleCustomerInfoChange}
                placeholder="+7 (999) 123-45-67"
                className={styles.formInput}
                required
              />
            </div>

            <button 
              className={styles.submitButton}
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}>⏳</span>
                  Обработка...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>✅</span>
                  Оформить заказ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TakeawayCheckoutPage;

