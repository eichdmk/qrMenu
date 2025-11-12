import { reservationsAPI } from "../../api/reservations";
import {
  getStatusText,
  getStatusColor,
  formatDate,
  formatTime,
  formatPrice,
} from "../../utils/format";
import { toast } from "react-toastify";
import { useState, useEffect, useMemo } from "react";
import styles from "./ReservationManager.module.css";

const PAYMENT_METHOD_LABELS = {
  cash: "Наличными",
  card: "Онлайн (карта)",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Не оплачено",
  pending: "Ожидает оплаты",
  succeeded: "Оплачено",
  canceled: "Отменено",
  refunded: "Возврат",
};

const PAYMENT_STATUS_VARIANTS = {
  unpaid: styles.paymentBadgeUnpaid,
  pending: styles.paymentBadgePending,
  succeeded: styles.paymentBadgeSucceeded,
  canceled: styles.paymentBadgeCanceled,
  refunded: styles.paymentBadgeRefunded,
};

function ReservationManager() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const notifyPendingCount = (list) => {
    const pendingCount = list.filter((item) => item.status === "pending").length;
    window.dispatchEvent(new CustomEvent("reservations:pending-count", { detail: pendingCount }));
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : [];
      setReservations(data);
      notifyPendingCount(data);
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
      fetchReservations();
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

  const filteredReservations = useMemo(() => {
    if (!showOnlyPending) return reservations;
    return reservations.filter((item) => item.status === "pending");
  }, [reservations, showOnlyPending]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Загружаем бронирования...</p>
      </div>
    );
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Брони</h2>
        <div className={styles.headerControls}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showOnlyPending}
              onChange={(e) => setShowOnlyPending(e.target.checked)}
            />
            Только ожидающие подтверждения
          </label>
          <button className={styles.refreshButton} onClick={fetchReservations}>
            Обновить
          </button>
        </div>
      </div>

      {filteredReservations.length > 0 ? (
        <div className={styles.reservationsList}>
          {filteredReservations.map((res) => {
            const hasPreorder = Array.isArray(res.items) && res.items.length > 0;
            const paymentMethodLabel =
              PAYMENT_METHOD_LABELS[res.payment_method] || res.payment_method || "Не указан";
            const paymentStatusLabel =
              PAYMENT_STATUS_LABELS[res.payment_status] || res.payment_status || "—";
            const paymentBadgeClass =
              PAYMENT_STATUS_VARIANTS[res.payment_status] || styles.paymentBadgeUnpaid;

            return (
              <div key={res.id} className={styles.reservationCard}>
                <div className={styles.reservationHeader}>
                  <div className={styles.headerBlock}>
                    <h4>Бронь #{res.id}</h4>
                    <span className={styles.subtleText}>
                      Создана {formatDate(res.created_at)} {formatTime(res.created_at)}
                    </span>
                  </div>
                  <span
                    className={styles.status}
                    style={{ backgroundColor: getStatusColor(res.status, "reservation") }}
                  >
                    {getStatusText(res.status, "reservation")}
                  </span>
                </div>

                <div className={styles.reservationDetails}>
                  <div className={styles.detailGroup}>
                    <span className={styles.label}>Гость</span>
                    <span className={styles.value}>{res.customer_name}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <span className={styles.label}>Телефон</span>
                    <a href={`tel:${res.customer_phone}`} className={styles.phoneLink}>
                      {res.customer_phone}
                    </a>
                  </div>
                  <div className={styles.detailGroup}>
                    <span className={styles.label}>Начало</span>
                    <span className={styles.value}>
                      {formatDate(res.start_at)} {formatTime(res.start_at)}
                    </span>
                  </div>
                  <div className={styles.detailGroup}>
                    <span className={styles.label}>Окончание</span>
                    <span className={styles.value}>
                      {formatDate(res.end_at)} {formatTime(res.end_at)}
                    </span>
                  </div>
                  <div className={styles.detailGroup}>
                    <span className={styles.label}>Столик</span>
                    <span className={styles.value}>№{res.table_name ?? res.table_id}</span>
                  </div>
                  {res.note && (
                    <div className={`${styles.detailGroup} ${styles.noteGroup}`}>
                      <span className={styles.label}>Примечание</span>
                      <span className={styles.value}>{res.note}</span>
                    </div>
                  )}
                </div>

                <div className={styles.paymentInfo}>
                  <div className={styles.paymentMeta}>
                    <span className={styles.label}>Оплата</span>
                    <span className={styles.paymentMethod}>{paymentMethodLabel}</span>
                    <span className={`${styles.paymentBadge} ${paymentBadgeClass}`}>
                      {paymentStatusLabel}
                    </span>
                  </div>
                  <div className={styles.paymentTotal}>
                    <span className={styles.label}>Сумма предзаказа</span>
                    <span className={styles.paymentValue}>{formatPrice(res.total_amount || 0)}</span>
                  </div>
                  {res.payment_confirmation_url && res.payment_status === "pending" && (
                    <a
                      href={res.payment_confirmation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.confirmationLink}
                    >
                      Ссылка на оплату
                    </a>
                  )}
                </div>

                {hasPreorder ? (
                  <div className={styles.preorderSection}>
                    <div className={styles.preorderHeaderRow}>
                      <span className={styles.preorderTitle}>Предзаказ</span>
                      <span className={styles.preorderCount}>
                        {res.items.reduce((sum, item) => sum + item.quantity, 0)} позиций
                      </span>
                    </div>
                    <div className={styles.preorderList}>
                      {res.items.map((item) => (
                        <div key={item.id} className={styles.preorderItem}>
                          <div className={styles.preorderItemInfo}>
                            <span className={styles.preorderItemName}>{item.menu_item_name}</span>
                            {item.comment && (
                              <span className={styles.preorderItemComment}>
                                Комментарий: {item.comment}
                              </span>
                            )}
                          </div>
                          <div className={styles.preorderItemMeta}>
                            <span className={styles.preorderQuantity}>×{item.quantity}</span>
                            <span className={styles.preorderPrice}>
                              {formatPrice((item.unit_price || 0) * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.noPreorder}>
                    Предзаказ не указан. Гость сделает заказ на месте.
                  </div>
                )}

                <div className={styles.reservationActions}>
                  <div className={styles.actionsLeft}>
                    <span className={styles.actionLabel}>Изменить статус</span>
                    <select
                      value={res.status}
                      onChange={(e) => handleStatusChange(res.id, e.target.value)}
                      className={styles.statusSelect}
                    >
                      <option value="pending">Ожидает</option>
                      <option value="confirmed">Подтверждено</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </div>
                  <div className={styles.actionsRight}>
                    <button onClick={() => handleDelete(res.id)} className={styles.deleteButton}>
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>Бронирований пока нет.</p>
        </div>
      )}
    </div>
  );
}

export default ReservationManager;