import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { menuAPI } from "../api/menu";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/format";
import { getImageUrl } from "../api/constants";
import { toast } from "react-toastify";
import styles from "./MenuItemPage.module.css";

function MenuItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await menuAPI.getById(id);
        setItem(response.data);
      } catch (error) {
        toast.error("Не удалось загрузить информацию о блюде");
        navigate("/menu");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

  const handleAddToOrder = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(item);
    }
    toast.success(`${quantity}x ${item.name} добавлено в заказ`);
    navigate(-1); // Возвращаемся на предыдущую страницу
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return null; // Redirect already handled
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        ← Назад
      </button>

      <div className={styles.content}>
        <div className={styles.imageSection}>
          <img 
            src={getImageUrl(item.image_url)} 
            alt={item.name}
            onError={(e) => { e.target.src = "/placeholder-food.jpg"; }}
          />
        </div>

        <div className={styles.infoSection}>
          <h1>{item.name}</h1>
          <p className={styles.description}>{item.description}</p>

          {item.ingredients && (
            <div className={styles.ingredients}>
              <h3>Состав:</h3>
              <p>{item.ingredients}</p>
            </div>
          )}

          <div className={styles.priceSection}>
            <span className={styles.price}>{formatPrice(item.price)}</span>
          </div>

          <div className={styles.quantitySection}>
            <label>Количество:</label>
            <div className={styles.quantityControls}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <button 
            className={styles.addButton} 
            onClick={handleAddToOrder}
            disabled={!item.available}
          >
            {item.available ? `Добавить ${quantity} в заказ` : "Недоступно"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuItemPage;