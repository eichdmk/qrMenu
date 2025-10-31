import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { formatPrice } from "../../utils/format";
import { ShoppingCartIcon } from "../Icons";
import styles from "./CartPreview.module.css";

function CartPreview() {
  const navigate = useNavigate();
  const { items, total } = useCart();

  if (items.length === 0) {
    return null;
  }

  const handleClick = () => {
    navigate("/cart");
  };

  return (
    <div className={styles.cartPreview} onClick={handleClick}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>
            <ShoppingCartIcon size={20} />
          </span>
          {items.length > 0 && (
            <span className={styles.badge}>{items.length}</span>
          )}
        </div>
        <div className={styles.info}>
          <div className={styles.label}>Корзина</div>
          <div className={styles.total}>{formatPrice(total)}</div>
        </div>
        <div className={styles.arrow}>→</div>
      </div>
    </div>
  );
}

export default CartPreview;

