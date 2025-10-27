import { useMenu } from "../../hooks/useMenu";
import { reservationsAPI } from "../../api/reservations";
import { getStatusText, getStatusColor, formatDate, formatTime } from "../../utils/format";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import styles from "./ReservationManager.module.css";

function ReservationManager() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await reservationsAPI.getAll();
      setReservations(response.data);
    } catch (error) {
      toast.error("Ошибка загрузки бронирований");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await reservationsAPI.updateStatus(id, { status: newStatus });
      toast.success("Статус бронирования обновлён");
      fetchReservations()
    } catch (error) {
      toast.error(error.response?.data?.message || "Ошибка при обновлении статуса");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Удалить это бронирование? Это действие нельзя отменить.")) return;

    try {
      await reservationsAPI.delete(id);
      toast.success("Бронирование удалено");
      fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Ошибка при удалении бронирования");
    }
  };

  if (loading) {
    return <p>Загрузка бронирований...</p>;
  }

  return (
    <div className={styles.manager}>
      {reservations.length > 0 ? (
        <div className={styles.reservationsList}>
          {reservations.map((res) => (
            <div key={res.id} className={styles.reservationCard}>
              <div className={styles.reservationHeader}>
                <h4>Бронь #{res.id}</h4>
                <span
                  className={styles.status}
                  style={{ backgroundColor: getStatusColor(res.status, 'reservation') }}
                >
                  {getStatusText(res.status, 'reservation')}
                </span>
              </div>
              <div className={styles.reservationDetails}>
                <p><strong>Имя:</strong> {res.customer_name}</p>
                <p><strong>Телефон:</strong> {res.customer_phone}</p>
                <p><strong>Дата и время:</strong> {formatDate(res.start_at)} {formatTime(res.start_at)}</p>
                <p><strong>До:</strong> {formatDate(res.end_at)} {formatTime(res.end_at)}</p>
                <p><strong>Столик:</strong> №{res.table_name}</p>
                <p><strong>Статус:</strong> {res.status}</p>
              </div>
              <div className={styles.reservationActions}>
                <select
                  value={res.status}
                  onChange={(e) => handleStatusChange(res.id, e.target.value)}
                  className={styles.statusSelect}
                >
                  <option value="pending">Ожидает</option>
                  <option value="confirmed">Подтверждено</option>
                  <option value="cancelled">Отменено</option>
                </select>
                <button onClick={() => handleDelete(res.id)} className={styles.deleteButton}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Бронирований пока нет.</p>
      )}
    </div>
  );
}

export default ReservationManager;