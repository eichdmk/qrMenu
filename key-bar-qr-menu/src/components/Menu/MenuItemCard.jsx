import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { formatPrice } from "../../utils/format";
import { getImageUrl } from "../../api/constants";
import styles from "./MenuItemCard.module.css";

const MenuItemCard = memo(({ item }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const handleCardClick = useCallback(() => {
    navigate(`/${item.id}`);
  }, [navigate, item.id]);

  const handleAddClick = useCallback((e) => {
    e.stopPropagation();
    addItem(item);
  }, [addItem, item]);

  return (
    <div className={`${styles.card} ${!item.available ? styles.unavailable : ''}`} onClick={handleCardClick}>
      <div className={styles.imageWrapper}>
        <img 
          src={getImageUrl(item.image_url)} 
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            e.target.src = "/placeholder-food.jpg";
          }}
        />
        {!item.available && (
          <div className={styles.unavailableOverlay}>
            <span>Недоступно</span>
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{item.name}</h3>
          <div className={styles.priceTag}>
            <span className={styles.price}>{formatPrice(item.price)}</span>
          </div>
        </div>
        
        <p className={styles.description}>{item.description}</p>
        
        <div className={styles.footer}>
          <button 
            className={`${styles.addButton} ${!item.available ? styles.disabled : ''}`}
            onClick={handleAddClick}
            disabled={!item.available}
          >
 
            <span className={styles.buttonText}>
              {item.available ? "Добавить в корзину" : "Недоступно"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});

MenuItemCard.displayName = 'MenuItemCard';

export default MenuItemCard;