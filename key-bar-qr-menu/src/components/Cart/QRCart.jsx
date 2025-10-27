import { useState } from "react";
import { useCart } from "../../contexts/CartContext";
import { formatPrice } from "../../utils/format";
import styles from "./QRCart.module.css";

function QRCart({ onCheckout, checkoutText = "Отправить заказ", isProcessing = false }) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);
  const [comment, setComment] = useState("");

  if (items.length === 0) {
    return null; // Не показываем, если корзина пуста
  }

  const handleCheckout = () => {
    onCheckout(items, comment);
  };

  const handleClearCart = () => {
    clearCart();
    setComment(""); // Очищаем комментарий при очистке корзины
  };

  return (
    <div className={`${styles.qrCart} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.compactView} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>🛒</span>
          <span className={styles.badge}>{items.length}</span>
        </div>
        <div className={styles.info}>
          <div className={styles.label}>Заказ</div>
          <div className={styles.total}>{formatPrice(total)}</div>
        </div>
        <div className={`${styles.arrow} ${isExpanded ? styles.rotated : ''}`}>
          {isExpanded ? '↑' : '↓'}
        </div>
      </div>

      {/* Развернутый вид */}
      {isExpanded && (
        <div className={styles.expandedView}>
          <div className={styles.header}>
            <h3>Ваш заказ</h3>
            <button 
              className={styles.closeButton}
              onClick={() => setIsExpanded(false)}
            >
              ✕
            </button>
          </div>

          <div className={styles.items}>
            {items.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <div className={styles.quantityControls}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity - 1);
                      }}
                      className={styles.quantityButton}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className={styles.itemQuantity}>{item.quantity}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity + 1);
                      }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.totalPrice}>
            <span>Итого: </span>
            <span className={styles.totalPrice}>{formatPrice(total)}</span>
          </div>

          <div className={styles.commentSection}>
            <label className={styles.commentLabel}>
              <span className={styles.commentIcon}>💬</span>
              Комментарий к заказу (необязательно)
            </label>
            <textarea
              className={styles.commentInput}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Например: Без лука, острое, на вынос..."
              rows={3}
              maxLength={500}
            />
            <div className={styles.commentCounter}>
              {comment.length}/500
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.clearButton} onClick={handleClearCart}>
              Очистить
            </button>
            <button 
              className={styles.checkoutButton} 
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? "Обработка..." : checkoutText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QRCart;
