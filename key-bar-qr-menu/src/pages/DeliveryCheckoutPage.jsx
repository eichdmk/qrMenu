import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../api/orders";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/format";
import { getImageUrl } from "../api/constants";
import { toast } from "react-toastify";
import { useScrollToTop } from "../hooks/useScrollToTop";
import styles from "./TakeawayCheckoutPage.module.css";

function DeliveryCheckoutPage() {
  const { items, clearCart, total } = useCart();
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [address, setAddress] = useState({
    street: "",
    house: "",
    entrance: "",
    floor: ""
  });
  const [comment, setComment] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [addressLine, setAddressLine] = useState("");
  const [addressLineSuggestions, setAddressLineSuggestions] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressInputRef = useRef(null);
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [isStreetLoading, setIsStreetLoading] = useState(false);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const streetInputRef = useRef(null);
  const [houseSuggestions, setHouseSuggestions] = useState([]);
  const [isHouseLoading, setIsHouseLoading] = useState(false);
  const [showHouseDropdown, setShowHouseDropdown] = useState(false);
  const houseInputRef = useRef(null);

  const DADATA_API_KEY = import.meta.env.VITE_DADATA_API_KEY;

  const DELIVERY_FEE = 200; 

  useScrollToTop();

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (name === 'street') {
      setShowStreetDropdown(true);
    }
    if (name === 'house') {
      setShowHouseDropdown(true);
    }
  };

  const handleAddressLineChange = (e) => {
    const value = e.target.value;
    setAddressLine(value);
    setShowAddressDropdown(true);
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  useEffect(() => {
    if (!DADATA_API_KEY) return;
    const query = (address.street || '').trim();
    if (query.length < 3) {
      setStreetSuggestions([]);
      return;
    }
    setIsStreetLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${DADATA_API_KEY}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            query,
            count: 10,
            from_bound: { value: 'street' },
            to_bound: { value: 'street' },
            locations: [{ kladr_id: '2000000000000' }],
            locations_boost: [{ city: 'Грозный' }]
          })
        });
        const data = await res.json();
        const items = (data?.suggestions || []).map(s => ({
          street: s.data?.street_with_type || s.value,
          city: s.data?.city_with_type || s.data?.settlement_with_type || ''
        }));
        setStreetSuggestions(items.slice(0, 8));
      } catch (_) {
      } finally {
        setIsStreetLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [address.street, DADATA_API_KEY]);

  const handleSelectStreet = (item) => {
    setAddress(prev => ({ ...prev, street: item.street }));
    setStreetSuggestions([]);
    setShowStreetDropdown(false);
    setTimeout(() => {
      houseInputRef.current?.querySelector('input[name="house"]').focus();
    }, 0);
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (streetInputRef.current && !streetInputRef.current.contains(e.target)) {
        setShowStreetDropdown(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!DADATA_API_KEY) return;
    const query = (addressLine || '').trim();
    if (query.length < 3) {
      setAddressLineSuggestions([]);
      return;
    }
    setIsAddressLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${DADATA_API_KEY}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            query,
            count: 10,
            from_bound: { value: 'house' },
            to_bound: { value: 'house' },
            locations: [{ kladr_id: '2000000000000' }],
            locations_boost: [{ city: 'Грозный' }]
          })
        });
        const data = await res.json();
        const items = (data?.suggestions || []).map(s => ({
          value: s.value,
          street: s.data?.street_with_type || '',
          house: s.data?.house || ''
        }));
        setAddressLineSuggestions(items);
      } catch (_) {
      } finally {
        setIsAddressLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [addressLine, DADATA_API_KEY]);

  const handleSelectAddressLine = (item) => {
    setAddressLine(item.value);
    setAddress(prev => ({ ...prev, street: item.street, house: item.house }));
    setAddressLineSuggestions([]);
    setShowAddressDropdown(false);
    setTimeout(() => {
      const next = document.querySelector('input[name="entrance"]');
      next?.focus();
    }, 0);
  };

  useEffect(() => {
    if (!DADATA_API_KEY) return;
    const street = (address.street || '').trim();
    const houseQuery = (address.house || '').trim();
    if (!street || houseQuery.length < 1) {
      setHouseSuggestions([]);
      return;
    }
    setIsHouseLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${DADATA_API_KEY}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            query: `${street} ${houseQuery}`,
            count: 10,
            from_bound: { value: 'house' },
            to_bound: { value: 'house' },
            locations: [{ kladr_id: '2000000000000' }],
            locations_boost: [{ city: 'Грозный' }]
          })
        });
        const data = await res.json();
        const items = (data?.suggestions || []).map(s => ({
          house: s.data?.house || s.value,
          full: s.value
        }));
        setHouseSuggestions(items.slice(0, 10));
      } catch (_) {
      } finally {
        setIsHouseLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [address.street, address.house, DADATA_API_KEY]);

  const handleSelectHouse = (item) => {
    setAddress(prev => ({ ...prev, house: item.house }));
    setHouseSuggestions([]);
    setShowHouseDropdown(false);
    setTimeout(() => {
      const next = document.querySelector('input[name="entrance"]');
      next?.focus();
    }, 0);
  };

  const validate = () => {
    if (items.length === 0) {
      toast.error("Ваша корзина пуста!");
      return false;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error("Пожалуйста, укажите имя и телефон");
      return false;
    }
    if (!(address.street && address.house) && !addressLine) {
      toast.error("Укажите адрес (улица и дом)");
      return false;
    }
    return true;
  };

  const buildAddressString = () => {
    const parts = [];
    if (address.street && address.house) {
      parts.push(`${address.street}, д. ${address.house}`);
    } else if (addressLine) {
      parts.push(addressLine);
    }
    if (address.entrance) parts.push(`подъезд ${address.entrance}`);
    if (address.floor) parts.push(`этаж ${address.floor}`);
    return parts.join(", ");
  };

  const handleCheckout = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const composedComment = [
        `Доставка: ${buildAddressString()}`,
        comment ? `Комментарий: ${comment}` : null
      ].filter(Boolean).join(" | ");

      const orderData = {
        orderType: "delivery",
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        comment: composedComment,
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          item_comment: item.item_comment || null
        }))
      };

      const response = await createOrder(orderData);
      setOrderId(response.order_id || response.id);
      setOrderPlaced(true);
      clearCart();
      sessionStorage.clear();
      toast.success("Заказ на доставку оформлен!");
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
            Ваш заказ на доставку принят. Мы свяжемся с вами для уточнения деталей.
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
            onClick={() => navigate('/')}>
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
              <h1 className={styles.headerTitle}>Оформление доставки</h1>
              <p className={styles.headerSubtitle}>Заполните адрес и контакты</p>
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
                      onError={(e) => { e.target.src = "/placeholder-food.jpg"; }}
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
              <span className={styles.totalLabel}>Товары:</span>
              <span className={styles.totalValue}>{formatPrice(total)}</span>
            </div>
            <div className={styles.total}>
              <span className={styles.totalLabel}>Доставка:</span>
              <span className={styles.totalValue}>{formatPrice(DELIVERY_FEE)}</span>
            </div>
            <div className={styles.total}>
              <span className={styles.totalLabel}>Итого к оплате:</span>
              <span className={styles.totalValue}>{formatPrice(total + DELIVERY_FEE)}</span>
            </div>
          </div>

          <div className={styles.customerForm}>
            <h3 className={styles.formTitle}>
              Контакты и адрес
            </h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}><span className={styles.labelIcon}></span>Имя *</label>
              <input type="text" name="name" value={customerInfo.name} onChange={handleCustomerInfoChange} placeholder="Введите ваше имя" className={styles.formInput} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}><span className={styles.labelIcon}></span>Телефон *</label>
              <input type="tel" name="phone" value={customerInfo.phone} onChange={handleCustomerInfoChange} placeholder="+7 (999) 123-45-67" className={styles.formInput} required />
            </div>

            <div className={styles.formGroup} ref={addressInputRef} style={{ position: 'relative' }}>
              <label className={styles.formLabel}><span className={styles.labelIcon}></span>Адрес (улица и дом) *</label>
              <input type="text" name="addressLine" value={addressLine} onChange={handleAddressLineChange} placeholder="Например: г. Грозный, проспект Путина, 1" className={styles.formInput} required autoComplete="off" onFocus={() => addressLine && setShowAddressDropdown(true)} />
              {DADATA_API_KEY && showAddressDropdown && (addressLineSuggestions.length > 0 || isAddressLoading) && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 10, marginTop: 6, maxHeight: 240, overflowY: 'auto' }}>
                  {isAddressLoading && (
                    <div style={{ padding: '10px 12px', color: '#666' }}>Загрузка...</div>
                  )}
                  {addressLineSuggestions.map((s, idx) => (
                    <button key={idx} type="button" onClick={() => handleSelectAddressLine(s)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, color: "black" }}>{s.value}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Подъезд</label>
              <input placeholder="Необязательно" type="text" name="entrance" value={address.entrance} onChange={handleAddressChange} className={styles.formInput} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Этаж</label>
              <input placeholder="Необязательно" type="text" name="floor" value={address.floor} onChange={handleAddressChange} className={styles.formInput} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}><span className={styles.labelIcon}></span>Комментарий к заказу</label>
              <textarea name="comment" value={comment} onChange={handleCommentChange} placeholder="Например: Позвоните за 5 минут до приезда..." className={styles.formTextarea} rows={3} maxLength={500} />
              <div className={styles.charCount}>{comment.length}/500</div>
            </div>

            <button className={styles.submitButton} onClick={handleCheckout} disabled={isSubmitting}>
              {isSubmitting ? (<><span className={styles.spinner}></span>Обработка...</>) : (<><span className={styles.buttonIcon}></span>Оформить доставку</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeliveryCheckoutPage;


