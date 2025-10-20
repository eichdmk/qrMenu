import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/format";
import { getImageUrl } from "../api/constants";
import styles from "./CartPage.module.css";

function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  const handleRemoveItem = (itemId) => {
    removeItem(itemId);
  };

  if (items.length === 0) {
    return (
      <div className={styles.cartPage}>
        <div className={styles.container}>
          <div className={styles.emptyCart}>
            <div className={styles.emptyIcon}>🛒</div>
            <h2 className={styles.emptyTitle}>Корзина пуста</h2>
            <p className={styles.emptyText}>
              Добавьте блюда из меню, чтобы сделать заказ
            </p>
            <button 
              className={styles.menuButton}
              onClick={() => navigate('/menu')}
            >
              <span className={styles.buttonIcon}>🍽️</span>
              Перейти в меню
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>🛒</div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Корзина</h1>
              <p className={styles.headerSubtitle}>
                {items.length} {items.length === 1 ? 'товар' : 'товара'}
              </p>
            </div>
          </div>
          <button 
            className={styles.continueButton}
            onClick={() => navigate('/menu')}
          >
            <span className={styles.buttonIcon}>◀</span>
            Продолжить покупки
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.itemsSection}>
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
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemPricePerUnit}>
                      {formatPrice(item.price)} за шт.
                    </p>
                    {item.description && (
                      <p className={styles.itemDescription}>{item.description}</p>
                    )}
                  </div>

                  <div className={styles.itemControls}>
                    <div className={styles.quantityControls}>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className={styles.quantityButton}
                        disabled={item.quantity <= 1}
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
                    
                    <div className={styles.itemTotal}>
                      <span className={styles.itemTotalLabel}>Итого:</span>
                      <span className={styles.itemTotalPrice}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  <button 
                    className={styles.removeButton} 
                    onClick={() => handleRemoveItem(item.id)}
                    title="Удалить товар"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <button 
              className={styles.clearButton}
              onClick={clearCart}
            >
              <span className={styles.buttonIcon}>🧹</span>
              Очистить корзину
            </button>
          </div>

          <aside className={styles.summarySection}>
            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>
                <span className={styles.summaryIcon}>📊</span>
                Итого
              </h3>
              
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Товары ({items.length}):</span>
                <span className={styles.summaryValue}>{formatPrice(total)}</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Скидка:</span>
                <span className={styles.summaryValue}>0 ₽</span>
              </div>
              
              <div className={styles.summaryTotal}>
                <span className={styles.totalLabel}>К оплате:</span>
                <span className={styles.totalValue}>{formatPrice(total)}</span>
              </div>

              <div className={styles.checkoutButtons}>
                <button 
                  className={styles.checkoutButton}
                  onClick={() => navigate('/takeaway/checkout')}
                >
                  <span className={styles.buttonIcon}>🥡</span>
                  Оформить самовывоз
                </button>
                <button 
                  className={styles.reservationButton}
                  onClick={() => navigate('/reservation')}
                >
                  <span className={styles.buttonIcon}>📅</span>
                  Забронировать столик
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CartPage;

