import { useCart } from "../../contexts/CartContext";
import { formatPrice } from "../../utils/format";
import styles from "./OrderSummary.module.css";

function OrderSummary({ onCheckout, checkoutText = "Оформить заказ", isProcessing = false }) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className={styles.summary}>
        <h3>Ваш заказ</h3>
        <p className={styles.empty}>Корзина пуста</p>
      </div>
    );
  }

  return (
    <div className={styles.summary}>
      <h3>Ваш заказ</h3>
      <div className={styles.items}>
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{item.name}</span>
              <div className={styles.quantityControls}>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className={styles.quantityButton}
                >
                  −
                </button>
                <span className={styles.itemQuantity}>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className={styles.quantityButton}
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.itemActions}>
              <span className={styles.itemPrice}>
                {formatPrice(item.price * item.quantity)}
              </span>
              <button 
                className={styles.removeButton} 
                onClick={() => removeItem(item.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.total}>
        <span>Итого:</span>
        <span className={styles.totalPrice}>{formatPrice(total)}</span>
      </div>
      <div className={styles.actions}>
        <button className={styles.clearButton} onClick={clearCart}>
          Очистить
        </button>
        <button 
          className={styles.checkoutButton} 
          onClick={onCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? "Обработка..." : checkoutText}
        </button>
      </div>
    </div>
  );
}

export default OrderSummary;