import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { reservationsAPI } from "../api/reservations";
import { toast } from "react-toastify";
import { useScrollToTop } from "../hooks/useScrollToTop";
import styles from "./ReservationPage.module.css";
import { tablesAPI } from "../api/tables";

function ReservationPage() {
  const [tables, setTables] = useState([]);
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

  // Скроллим наверх при загрузке страницы
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

  // Обновляем доступность столиков при изменении даты или времени
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { table_id, customer_name, customer_phone, date, time, guests } = formData;

    if (!table_id || !customer_name || !customer_phone || !date || !time) {
      toast.error("Заполните все обязательные поля");
      setLoading(false);
      return;
    }

    const start_at = new Date(`${date}T${time}:00`);
    const end_at = new Date(start_at);
    end_at.setHours(end_at.getHours() + 2);

    try {
      await reservationsAPI.create({
        table_id: Number(table_id),
        customer_name,
        customer_phone,
        start_at: start_at.toISOString(),
        end_at: end_at.toISOString(),
      });

      setSubmitSuccess(true);
      toast.success("Столик успешно забронирован!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось создать бронь");
    } finally {
      setLoading(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successContent}>
          <div className={styles.successIcon}>✅</div>
          <h1 className={styles.successTitle}>Бронирование подтверждено!</h1>
          <div className={styles.successInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>📅 Дата:</span>
              <span className={styles.infoValue}>{formData.date}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>🕐 Время:</span>
              <span className={styles.infoValue}>{formData.time}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>🪑 Столик:</span>
              <span className={styles.infoValue}>
                №{tables.find(t => t.id === Number(formData.table_id))?.name}
              </span>
            </div>
          </div>
          <button className={styles.homeButton} onClick={() => navigate("/")}>
            <span className={styles.buttonIcon}>🏠</span>
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
            <div className={styles.headerIcon}>📅</div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Бронирование столика</h1>
              <p className={styles.headerSubtitle}>
                Выберите удобное время и забронируйте стол
              </p>
            </div>
          </div>
        </header>

        <div className={styles.mainContent}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <span className={styles.sectionIcon}>📅</span>
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
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    min="10:00"
                    max="23:00"
                    required
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* <div className={styles.formGroup}>
                <label htmlFor="guests">Количество гостей</label>
                <input
                  type="number"
                  id="guests"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className={styles.formInput}
                />
              </div> */}
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <span className={styles.sectionIcon}>🪑</span>
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
                      №{table.name} ({table.seats} мест) - {table.availability_reason}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <span className={styles.sectionIcon}>👤</span>
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
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}>⏳</span>
                  Бронируем...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>✅</span>
                  Забронировать
                </>
              )}
            </button>
          </form>

          <aside className={styles.tablesSection}>
            <div className={styles.availabilityInfo}>
              <h3 className={styles.availabilityTitle}>
                <span className={styles.titleIcon}>🪑</span>
                Статус столиков
              </h3>
              <div className={styles.tablesGrid}>
                {tables.map((table) => (
                  <div 
                    key={table.id} 
                    className={`${styles.tableCard} ${table.is_available ? styles.available : styles.unavailable}`}
                  >
                    <div className={styles.tableName}>№{table.name}</div>
                    <div className={styles.tableSeats}>{table.seats} мест</div>
                    <div className={styles.tableStatus}>
                      <span className={`${styles.statusBadge} ${table.is_available ? styles.availableBadge : styles.unavailableBadge}`}>
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