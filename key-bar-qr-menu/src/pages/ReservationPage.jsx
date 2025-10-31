import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, TableIcon } from "../components/Icons";
import { HomeIcon, ClockIcon, UserIcon, CheckIcon } from "../components/Icons";
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

  // Предопределенные слоты времени: каждые 15 минут с 10:00 до 23:00
  const timeSlots = Array.from({ length: (23 - 10) * 4 + 1 }, (_, index) => {
    const minutesFromStart = index * 15; // 15-минутные шаги
    const hour = 10 + Math.floor(minutesFromStart / 60);
    const minute = minutesFromStart % 60;
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    return `${hh}:${mm}`;
  });

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

    // Создаём дату в локальном часовом поясе с явным указанием смещения
    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);
    
    // Форматируем с явным указанием локального часового пояса
    const formatLocalISO = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      // Получаем смещение часового пояса в формате ±HH:MM
      const timezoneOffset = -date.getTimezoneOffset(); // Инвертируем, так как getTimezoneOffset возвращает обратное смещение
      const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
      const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
      const offsetSign = timezoneOffset >= 0 ? '+' : '-';
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
    };

    try {
      await reservationsAPI.create({
        table_id: Number(table_id),
        customer_name,
        customer_phone,
        start_at: formatLocalISO(startDate),
        end_at: formatLocalISO(endDate),
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
          <div className={styles.successIcon}><CheckIcon size={20} /></div>
          <h1 className={styles.successTitle}>Бронирование подтверждено!</h1>
          <div className={styles.successInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}><CalendarIcon size={16} /> Дата:</span>
              <span className={styles.infoValue}>{formData.date}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}><ClockIcon size={16} /> Время:</span>
              <span className={styles.infoValue}>{formData.time}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}><TableIcon size={16} /> Столик:</span>
              <span className={styles.infoValue}>
                №{tables.find(t => t.id === Number(formData.table_id))?.name}
              </span>
            </div>
          </div>
          <button className={styles.homeButton} onClick={() => navigate("/")}> 
            <span className={styles.buttonIcon}><HomeIcon size={18} /></span>
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
                Выберите удобное время и забронируйте стол
              </p>
            </div>
          </div>
        </header>

        <div className={styles.mainContent}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <span className={styles.sectionIcon}><CalendarIcon size={16} /></span>
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
                <span className={styles.sectionIcon}><TableIcon size={16} /></span>
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
                <span className={styles.sectionIcon}><UserIcon size={16} /></span>
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
                  <span className={styles.spinner}><ClockIcon size={18} /></span>
                  Бронируем...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}><CheckIcon size={18} /></span>
                  Забронировать
                </>
              )}
            </button>
          </form>

          <aside className={styles.tablesSection}>
            <div className={styles.availabilityInfo}>
              <h3 className={styles.availabilityTitle}>
                <span className={styles.titleIcon}><TableIcon size={16} /></span>
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