import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  TableIcon,
  HomeIcon,
  ClockIcon,
  UserIcon,
  CheckIcon,
  ShoppingCartIcon,
  CashIcon,
  CardIcon,
} from "../components/Icons";
import { reservationsAPI } from "../api/reservations";
import { menuAPI } from "../api/menu";
import { categoriesAPI } from "../api/categories";
import { tablesAPI } from "../api/tables";
import { formatPrice } from "../utils/format";
import { toast } from "react-toastify";
import { useScrollToTop } from "../hooks/useScrollToTop";
import styles from "./ReservationPage.module.css";

const PAYMENT_METHOD_LABELS = {
  cash: "Наличными при посещении",
  card: "Онлайн (карта)",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Не оплачено",
  pending: "Ожидает оплаты",
  succeeded: "Оплачено",
  canceled: "Отменено",
  refunded: "Возврат",
};

const formatLocalISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const timezoneOffset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, "0");
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, "0");
  const offsetSign = timezoneOffset >= 0 ? "+" : "-";

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
};

function ReservationPage() {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isPreorderOpen, setIsPreorderOpen] = useState(false);
  const [reservationResult, setReservationResult] = useState(null);
  const [formData, setFormData] = useState({
    table_id: "",
    customer_name: "",
    customer_phone: "",
    date: "",
    time: "",
    guests: 1,
  });
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const navigate = useNavigate();

  const timeSlots = useMemo(
    () =>
      Array.from({ length: (23 - 10) * 4 + 1 }, (_, index) => {
    const minutesFromStart = index * 15;
    const hour = 10 + Math.floor(minutesFromStart / 60);
    const minute = minutesFromStart % 60;
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    return `${hh}:${mm}`;
      }),
    []
  );

  useScrollToTop();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await tablesAPI.getWithAvailability();
        setTables(response.data);
      } catch (err) {
        toast.error("Не удалось загрузить столики");
      }
    };
    fetchTables();
  }, []);

  useEffect(() => {
    const fetchMenu = async () => {
      setMenuLoading(true);
      try {
        const [menuResponse, categoriesResponse] = await Promise.all([
          menuAPI.getAll(),
          categoriesAPI.getAll(),
        ]);

        const availableMenu = (menuResponse.data ?? []).filter((item) => item.available);
        const categoriesWithItems = (categoriesResponse.data ?? []).filter((category) =>
          availableMenu.some((item) => item.category_id === category.id)
        );

        setMenuItems(availableMenu);
        setCategories(categoriesWithItems);
        setSelectedCategoryId((prev) => {
          if (prev && categoriesWithItems.some((category) => category.id === prev)) {
            return prev;
          }
          return categoriesWithItems[0]?.id ?? null;
        });
      } catch (err) {
        console.error("Не удалось загрузить меню для предзаказа:", err);
        toast.error("Не удалось загрузить список блюд для предзаказа");
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenu();
  }, []);

  useEffect(() => {
    const updateTablesAvailability = async () => {
      if (formData.date && formData.time) {
        try {
          const response = await tablesAPI.getAvailabilityForDateTime(formData.date, formData.time);
          setTables(response.data);
        } catch (err) {
          console.error("Не удалось обновить доступность столиков:", err);
        }
      }
    };

    updateTablesAvailability();
  }, [formData.date, formData.time]);

  const menuPriceMap = useMemo(() => {
    const map = new Map();
    menuItems.forEach((item) => {
      map.set(item.id, Number(item.price) || 0);
    });
    return map;
  }, [menuItems]);

  const preorderItems = useMemo(
    () =>
      Object.entries(selectedItems)
        .filter(([, data]) => data.quantity > 0)
        .map(([id, data]) => ({
          menu_item_id: Number(id),
          quantity: data.quantity,
        })),
    [selectedItems]
  );

  const selectedItemsDetails = useMemo(
    () =>
      preorderItems.map((item) => {
        const menuItem = menuItems.find((entry) => entry.id === item.menu_item_id);
        return {
          ...item,
          menu_item_name: menuItem?.name ?? "Блюдо",
          description: menuItem?.description ?? "",
          price: Number(menuItem?.price ?? 0),
        };
      }),
    [preorderItems, menuItems]
  );

  const totalAmount = useMemo(
    () =>
      preorderItems.reduce(
        (sum, item) => sum + (menuPriceMap.get(item.menu_item_id) || 0) * item.quantity,
        0
      ),
    [preorderItems, menuPriceMap]
  );

  const totalQuantity = useMemo(
    () => preorderItems.reduce((sum, item) => sum + item.quantity, 0),
    [preorderItems]
  );

  const filteredMenuItems = useMemo(() => {
    if (!selectedCategoryId) {
      return menuItems;
    }

    return menuItems.filter((item) => item.category_id === selectedCategoryId);
  }, [menuItems, selectedCategoryId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitSuccess(false);
  };

  const handleItemQuantityChange = (itemId, delta) => {
    setSelectedItems((prev) => {
      const currentQuantity = prev[itemId]?.quantity ?? 0;
      const nextQuantity = Math.max(0, currentQuantity + delta);

      if (nextQuantity === 0) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [itemId]: {
          quantity: nextQuantity,
        },
      };
    });
  };

  const handleClearPreorder = () => {
    setSelectedItems({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { table_id, customer_name, customer_phone, date, time } = formData;

    if (!table_id || !customer_name || !customer_phone || !date || !time) {
      toast.error("Заполните все обязательные поля");
      setLoading(false);
      return;
    }

    if (paymentMethod === "card" && preorderItems.length === 0) {
      toast.error("Для онлайн-оплаты добавьте блюда в предзаказ");
      setLoading(false);
      return;
    }

    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);

    try {
      const response = await reservationsAPI.create({
        table_id: Number(table_id),
        customer_name,
        customer_phone,
        start_at: formatLocalISO(startDate),
        end_at: formatLocalISO(endDate),
        payment_method: paymentMethod,
        items: preorderItems,
      });

      const { reservation, payment } = response.data ?? {};

      if (paymentMethod === "card") {
        if (payment?.id) {
          sessionStorage.setItem("kb_recent_reservation_payment_id", payment.id);
        }

        if (payment?.confirmation_url) {
          toast.info("Перенаправляем на оплату...");
          window.location.href = payment.confirmation_url;
          return;
        }

        toast.info("Бронь создана. Завершите оплату позже в личном кабинете или по ссылке из письма.");
      } else {
        toast.success("Столик успешно забронирован!");
      }

      if (reservation) {
        setReservationResult(reservation);
      } else {
        setReservationResult(null);
      }

      setSubmitSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось создать бронь");
    } finally {
      setLoading(false);
    }
  };

  const reservationTableName =
    reservationResult?.table_name ??
    tables.find((table) => table.id === Number(formData.table_id))?.name ??
    formData.table_id;

  const paymentMethodLabel =
    reservationResult?.payment_method &&
    PAYMENT_METHOD_LABELS[reservationResult.payment_method];
  const paymentStatusLabel =
    reservationResult?.payment_status &&
    (PAYMENT_STATUS_LABELS[reservationResult.payment_status] ?? reservationResult.payment_status);

  if (submitSuccess && reservationResult) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successContent}>
          <div className={styles.successIcon}>
            <CheckIcon size={20} />
          </div>
          <h1 className={styles.successTitle}>Бронирование подтверждено!</h1>
          <div className={styles.successInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>
                <CalendarIcon size={16} /> Дата:
              </span>
              <span className={styles.infoValue}>
                {reservationResult.start_at?.slice(0, 10) ?? formData.date}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>
                <ClockIcon size={16} /> Время:
              </span>
              <span className={styles.infoValue}>{formData.time}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>
                <TableIcon size={16} /> Столик:
              </span>
              <span className={styles.infoValue}>№{reservationTableName}</span>
            </div>
            {reservationResult.items?.length > 0 && (
              <div className={styles.successPreorder}>
                <h3>Предзаказ:</h3>
                <div className={styles.successPreorderList}>
                  {reservationResult.items.map((item) => (
                    <div key={item.id} className={styles.successPreorderItem}>
                      <span className={styles.successPreorderName}>{item.menu_item_name}</span>
                      <span className={styles.successPreorderMeta}>
                        ×{item.quantity} · {formatPrice(item.unit_price)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={styles.successPreorderTotal}>
                  Итого: {formatPrice(reservationResult.total_amount || totalAmount)}
                </div>
              </div>
            )}
            <div className={styles.successPaymentInfo}>
              {paymentMethodLabel && (
                <div className={styles.successPaymentLine}>
                  Способ оплаты: {paymentMethodLabel}
                </div>
              )}
              {paymentStatusLabel && (
                <div className={styles.successPaymentLine}>
                  Статус оплаты: {paymentStatusLabel}
                </div>
              )}
            </div>
          </div>
          <button className={styles.homeButton} onClick={() => navigate("/")}>
            <span className={styles.buttonIcon}>
              <HomeIcon size={18} />
            </span>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reservationPage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Бронирование столика</h1>
              <p className={styles.headerSubtitle}>
                Выберите удобное время, предзакажите любимые блюда и приходите к готовому столу
              </p>
            </div>
          </div>
        </header>

        <div className={styles.mainContent}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <span className={styles.sectionIcon}>
                  <CalendarIcon size={16} />
                </span>
                Дата и время
              </h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="date">Дата *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="time">Время *</label>
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className={styles.formInput}
                  >
                    <option value="">-- Выберите время --</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <span className={styles.sectionIcon}>
                  <TableIcon size={16} />
                </span>
                Выбор столика
              </h3>
              <div className={styles.formGroup}>
                <label htmlFor="table_id">Столик *</label>
                <select
                  id="table_id"
                  name="table_id"
                  value={formData.table_id}
                  onChange={handleChange}
                  required
                  className={styles.formInput}
                >
                  <option value="">-- Выберите столик --</option>
                  {tables.map((table) => (
                    <option
                      key={table.id}
                      value={table.id}
                      disabled={!table.is_available}
                    >
                      №{table.name} ({table.seats} мест) — {table.availability_reason}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.preorderHeader}>
                <h3 className={styles.formSectionTitle}>
                  <span className={styles.sectionIcon}>
                    <ShoppingCartIcon size={16} />
                  </span>
                  Предзаказать блюда (опционально)
                </h3>
                <button
                  type="button"
                  className={styles.togglePreorderButton}
                  onClick={() => setIsPreorderOpen((prev) => !prev)}
                >
                  {isPreorderOpen ? "Скрыть" : "Добавить"}
                </button>
              </div>

              {isPreorderOpen && (
                <>
                  {menuLoading ? (
                    <div className={styles.preorderLoading}>Загружаем меню...</div>
                  ) : categories.length === 0 ? (
                    <p className={styles.noMenuMessage}>
                      Сейчас предзаказ недоступен. Вы всегда можете выбрать блюда в ресторане.
                    </p>
                  ) : (
                    <>
                      <div className={styles.categoryTabs}>
                        {categories.map((category) => (
                          <button
                            type="button"
                            key={category.id}
                            className={`${styles.categoryTab} ${
                              selectedCategoryId === category.id ? styles.categoryTabActive : ""
                            }`}
                            onClick={() => setSelectedCategoryId(category.id)}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>

                      <div className={styles.menuGrid}>
                        {filteredMenuItems.map((item) => {
                          const quantity = selectedItems[item.id]?.quantity ?? 0;
                          return (
                            <div key={item.id} className={styles.menuItemCard}>
                              <div className={styles.menuItemInfo}>
                                <div className={styles.menuItemName}>{item.name}</div>
                                {item.description && (
                                  <p className={styles.menuItemDescription}>{item.description}</p>
                                )}
                              </div>
                              <div className={styles.menuItemFooter}>
                                <span className={styles.menuItemPrice}>{formatPrice(item.price)}</span>
                                <div className={styles.quantityControl}>
                                  <button
                                    type="button"
                                    className={styles.quantityButton}
                                    onClick={() => handleItemQuantityChange(item.id, -1)}
                                    aria-label={`Уменьшить количество ${item.name}`}
                                  >
                                    −
                                  </button>
                                  <span className={styles.quantityValue}>{quantity}</span>
                                  <button
                                    type="button"
                                    className={styles.quantityButton}
                                    onClick={() => handleItemQuantityChange(item.id, 1)}
                                    aria-label={`Увеличить количество ${item.name}`}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className={styles.preorderSummary}>
                        <div className={styles.preorderSummaryInfo}>
                          <span>Выбрано блюд: {totalQuantity}</span>
                          <span>Сумма предзаказа: {formatPrice(totalAmount)}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.clearButton}
                          onClick={handleClearPreorder}
                          disabled={totalQuantity === 0}
                        >
                          Очистить
                        </button>
                      </div>

                      {selectedItemsDetails.length > 0 && (
                        <div className={styles.selectedItemsList}>
                          {selectedItemsDetails.map((item) => (
                            <div key={item.menu_item_id} className={styles.selectedItem}>
                              <span className={styles.selectedItemName}>{item.menu_item_name}</span>
                              <span className={styles.selectedItemMeta}>×{item.quantity}</span>
                              <span className={styles.selectedItemPrice}>
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <span className={styles.sectionIcon}>
                  <CheckIcon size={16} />
                </span>
                Способ оплаты
              </h3>
              <div className={styles.paymentOptions}>
                <label
                  className={`${styles.paymentOption} ${
                    paymentMethod === "cash" ? styles.paymentOptionActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                  />
                  <span className={styles.paymentOptionIcon}>
                    <CashIcon size={18} />
                  </span>
                  <div className={styles.paymentOptionContent}>
                    <span className={styles.paymentOptionTitle}>Наличными при посещении</span>
                    <span className={styles.paymentOptionDescription}>
                      Оплатите заказ при посадке или после ужина.
                    </span>
                  </div>
                </label>
                <label
                  className={`${styles.paymentOption} ${
                    paymentMethod === "card" ? styles.paymentOptionActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <span className={styles.paymentOptionIcon}>
                    <CardIcon size={18} />
                  </span>
                  <div className={styles.paymentOptionContent}>
                    <span className={styles.paymentOptionTitle}>Онлайн-оплата картой</span>
                    <span className={styles.paymentOptionDescription}>
                      Оплатите заранее и приходите к сервированному столу.
                    </span>
                  </div>
                </label>
              </div>
              {paymentMethod === "card" && (
                <p className={styles.paymentNotice}>
                  Для онлайн-оплаты добавьте хотя бы одно блюдо в предзаказ. После оформления мы
                  перенаправим вас на защищенную страницу YooKassa.
                </p>
              )}
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <span className={styles.sectionIcon}>
                  <UserIcon size={16} />
                </span>
                Контактные данные
              </h3>
              <div className={styles.formGroup}>
                <label htmlFor="customer_name">Ваше имя *</label>
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Иван Иванов"
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="customer_phone">Телефон *</label>
                <input
                  type="tel"
                  id="customer_phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  placeholder="+7 (999) 123-45-67"
                  required
                  className={styles.formInput}
                />
              </div>

              <p className={styles.consentNote}>
                Отправляя форму, вы подтверждаете согласие с
                <a href="/privacy"> Политикой конфиденциальности</a> и
                <a href="/offer"> Публичной офертой</a> Key Bar.
              </p>
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner}>
                    <ClockIcon size={18} />
                  </span>
                  Бронируем...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>
                    <CheckIcon size={18} />
                  </span>
                  Забронировать
                </>
              )}
            </button>
          </form>

          <aside className={styles.tablesSection}>
            <div className={styles.availabilityInfo}>
              <h3 className={styles.availabilityTitle}>
                <span className={styles.titleIcon}>
                  <TableIcon size={16} />
                </span>
                Статус столиков
              </h3>
              <div className={styles.tablesGrid}>
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`${styles.tableCard} ${
                      table.is_available ? styles.available : styles.unavailable
                    }`}
                  >
                    <div className={styles.tableName}>№{table.name}</div>
                    <div className={styles.tableSeats}>{table.seats} мест</div>
                    <div className={styles.tableStatus}>
                      <span
                        className={`${styles.statusBadge} ${
                          table.is_available ? styles.availableBadge : styles.unavailableBadge
                        }`}
                      >
                        {table.availability_reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ReservationPage;