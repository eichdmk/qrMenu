import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../api/orders";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/format";
import { getImageUrl } from "../api/constants";
import { toast } from "react-toastify";
import { useScrollToTop } from "../hooks/useScrollToTop";
import { CashIcon, CardIcon } from "../components/Icons";
import styles from "./TakeawayCheckoutPage.module.css";

function TakeawayCheckoutPage() {
  const { items, clearCart, total, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useScrollToTop();

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const paymentReturnUrl = useMemo(
    () => `${window.location.origin}/payment/result`,
    []
  );

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
        comment: comment,
        paymentMethod,
        paymentReturnUrl,
        paymentMetadata: {
          channel: "takeaway",
          customerPhone: customerInfo.phone,
        },
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          item_comment: item.item_comment || null
        }))
      };

      const response = await createOrder(orderData);

      if (paymentMethod === "card") {
        const confirmationUrl = response?.payment?.confirmation_url;
        const paymentId = response?.payment?.id;

        if (paymentId) {
          sessionStorage.setItem("kb_recent_payment_id", paymentId);
        }

        if (confirmationUrl) {
          toast.info("Перенаправляем на оплату YooKassa...");
          window.location.href = confirmationUrl;
          return;
        }
        toast.error("Не удалось получить ссылку для оплаты. Попробуйте снова.");
        return;
      }

      setOrderId(response.order_id || response.id);
      setOrderPlaced(true);
      clearCart();
      sessionStorage.clear();
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
          <div className={styles.successIcon}>✓</div>
          <div className={styles.headerSection}>
            <h1 className={styles.successTitle}>Заказ оформлен!</h1>
            {orderId && (
              <div className={styles.orderNumber}>
                <span className={styles.orderNumberLabel}>№</span>
                <span className={styles.orderNumberValue}>{orderId}</span>
              </div>
            )}
          </div>
          <p className={styles.successText}>
            Ваш заказ на самовывоз принят. Мы сообщим, когда он будет готов.
          </p>
          <div className={styles.orderInfo}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>👤</div>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Имя</span>
                <span className={styles.infoValue}>{customerInfo.name}</span>
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📞</div>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Телефон</span>
                <span className={styles.infoValue}>{customerInfo.phone}</span>
              </div>
            </div>
          </div>
          <button 
            className={styles.homeButton} 
            onClick={() => navigate("/")}
          >
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
            onClick={() => navigate('/')}
          >
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
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Оформление заказа</h1>
              <p className={styles.headerSubtitle}>Укажите ваши данные для самовывоза</p>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.orderSummary}>
            <h3 className={styles.summaryTitle}>
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
              Ваши данные
            </h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
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
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Комментарий к заказу (необязательно)
              </label>
              <textarea
                name="comment"
                value={comment}
                onChange={handleCommentChange}
                placeholder="Например: Позвоните за 10 минут до готовности..."
                className={styles.formTextarea}
                rows={3}
                maxLength={500}
              />
              <div className={styles.charCount}>
                {comment.length}/500
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Способ оплаты *</label>
              <div className={styles.paymentOptions}>
                <button
                  type="button"
                  className={`${styles.paymentOption} ${paymentMethod === "cash" ? styles.paymentOptionActive : ""}`}
                  onClick={() => setPaymentMethod("cash")}
                  disabled={isSubmitting}
                >
                  <span className={styles.paymentOptionIcon}>
                    <CashIcon size={30} />
                  </span>
                  <span className={styles.paymentOptionText}>
                    <span className={styles.paymentOptionTitle}>Наличными</span>
                    <span className={styles.paymentOptionHint}>Оплата при получении</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`${styles.paymentOption} ${paymentMethod === "card" ? styles.paymentOptionActive : ""}`}
                  onClick={() => setPaymentMethod("card")}
                  disabled={isSubmitting}
                >
                  <span className={styles.paymentOptionIcon}>
                    <CardIcon size={30} />
                  </span>
                  <span className={styles.paymentOptionText}>
                    <span className={styles.paymentOptionTitle}>Картой онлайн</span>
                    <span className={styles.paymentOptionHint}>Оплата через YooKassa</span>
                  </span>
                </button>
              </div>
            </div>

            <p className={styles.consentNote}>
              Нажимая «Оформить заказ», вы подтверждаете, что ознакомлены и
              соглашаетесь с <a href="/privacy">Политикой конфиденциальности</a>
              {" "}
              и <a href="/terms">Условиями использования</a> Key Bar.
            </p>

            <button 
              className={styles.submitButton}
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  Обработка...
                </>
              ) : (
                <>
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

