import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsAPI } from "../api/payments";
import { formatPrice } from "../utils/format";
import styles from "./PaymentResultPage.module.css";

const STATUS_CONFIG = {
  succeeded: {
    title: "Оплата прошла успешно",
    description: "Мы получили ваш платеж. Заказ передан на обработку.",
    icon: "✅",
  },
  pending: {
    title: "Оплата обрабатывается",
    description: "Платеж ещё не подтверждён. Это может занять до нескольких минут.",
    icon: "⏳",
  },
  unpaid: {
    title: "Платеж не начат",
    description: "Мы не обнаружили попытку оплаты. Попробуйте оплатить заказ ещё раз.",
    icon: "ℹ️",
  },
  canceled: {
    title: "Оплата отменена",
    description: "Платёж был отменён. Вы можете попробовать оплатить заказ снова.",
    icon: "❌",
  },
  refunded: {
    title: "Оплата возвращена",
    description: "Для заказа оформлен возврат средств. Свяжитесь с нами при необходимости.",
    icon: "🔄",
  },
  error: {
    title: "Ошибка",
    description: "Не удалось получить информацию об оплате. Попробуйте обновить страницу.",
    icon: "⚠️",
  },
  unknown: {
    title: "Статус платежа неизвестен",
    description: "Мы не получили идентификатор платежа. Пожалуйста, вернитесь в меню.",
    icon: "❔",
  },
};

const STATUS_LABELS = {
  succeeded: "Оплачено",
  pending: "Ожидание подтверждения",
  unpaid: "Не оплачено",
  canceled: "Отменено",
  refunded: "Возврат",
  error: "Ошибка",
  unknown: "Неизвестно",
};

const deriveStatus = (data) => {
  if (!data) return "unknown";

  const rawStatus = (data.payment_status || "").toLowerCase();
  const entityStatus = (data.status || "").toLowerCase();
  const entityType = (data.entity_type || data.type || "order").toLowerCase();

  if (["succeeded", "canceled", "refunded"].includes(rawStatus)) {
    return rawStatus;
  }

  if (["pending", "waiting_for_capture", "waiting_for_payment"].includes(rawStatus)) {
    return "pending";
  }

  if (entityType === "reservation") {
    if (entityStatus === "confirmed") {
      return "succeeded";
    }
    if (["cancelled", "canceled"].includes(entityStatus)) {
      return "canceled";
    }
  }

  if (entityType === "order") {
    if (["preparing", "ready", "completed", "delivered"].includes(entityStatus)) {
      return "succeeded";
    }
    if (["cancelled", "canceled"].includes(entityStatus)) {
      return "canceled";
    }
  }

  if (rawStatus) {
    return STATUS_CONFIG[rawStatus] ? rawStatus : "pending";
  }

  if (entityStatus) {
    if (["cancelled", "canceled"].includes(entityStatus)) {
      return "canceled";
    }
  }

  return "pending";
};

function PaymentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [entityType, setEntityType] = useState("order");
  const [error, setError] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const pollRef = useRef(null);
  const cancelledRef = useRef(false);

  const queryPaymentId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("payment_id") || params.get("paymentId") || params.get("paymentId".toLowerCase());
  }, [location.search]);

  const statusConfig = STATUS_CONFIG[error ? "error" : status] || STATUS_CONFIG.pending;

  const loadStatus = useCallback(
    async (id, { silent = false } = {}) => {
      if (!id) return;

      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await paymentsAPI.getStatus(id);

        if (cancelledRef.current) return;

        const data = response.data || {};
        const type = data.entity_type || data.type || "order";
        const normalizedStatus = deriveStatus(data);

        setEntityType(type);
        setPaymentInfo({
          ...data,
          payment_status: normalizedStatus,
        });
        setStatus(normalizedStatus);
        setError(null);

        if (normalizedStatus !== "pending" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err) {
        if (cancelledRef.current) return;

        setError(err?.response?.data?.message || "Не удалось получить статус оплаты");
        setStatus("error");
        setPaymentInfo(null);
      } finally {
        if (!cancelledRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    let id = queryPaymentId;

    if (!id) {
      const storedOrderPayment = sessionStorage.getItem("kb_recent_payment_id");
      const storedReservationPayment = sessionStorage.getItem("kb_recent_reservation_payment_id");
      id = storedOrderPayment || storedReservationPayment || null;
    }

    setPaymentId(id);
  }, [queryPaymentId]);

  useEffect(() => {
    cancelledRef.current = false;

    if (!paymentId) {
      setStatus("unknown");
      setPaymentInfo(null);
      setLoading(false);
      return;
    }

    loadStatus(paymentId);

    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    pollRef.current = setInterval(() => {
      loadStatus(paymentId, { silent: true });
    }, 5000);

    return () => {
      cancelledRef.current = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [paymentId, loadStatus]);

  useEffect(() => {
    if (!paymentId) return;
    if (["succeeded", "canceled", "refunded"].includes(status)) {
      sessionStorage.removeItem("kb_recent_payment_id");
      sessionStorage.removeItem("kb_recent_reservation_payment_id");
    }
  }, [paymentId, status]);

  const handleRefresh = useCallback(() => {
    if (paymentId) {
      loadStatus(paymentId);
    }
  }, [loadStatus, paymentId]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>{statusConfig.icon}</div>
        <h1 className={styles.title}>{statusConfig.title}</h1>
        <p className={styles.description}>{statusConfig.description}</p>

        {loading && <div className={styles.loader}>Проверяем статус оплаты...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {paymentInfo && (
          <div className={styles.orderInfo}>
            <div className={styles.orderRow}>
              <span className={styles.label}>
                {entityType === "reservation" ? "Номер брони" : "Номер заказа"}
              </span>
              <span className={styles.value}>№{paymentInfo.id}</span>
            </div>
            <div className={styles.orderRow}>
              <span className={styles.label}>Тип</span>
              <span className={styles.value}>
                {entityType === "reservation" ? "Бронирование" : "Заказ"}
              </span>
            </div>
            <div className={styles.orderRow}>
              <span className={styles.label}>Сумма</span>
              <span className={styles.value}>{formatPrice(paymentInfo.total_amount)}</span>
            </div>
            {paymentInfo.payment_method && (
              <div className={styles.orderRow}>
                <span className={styles.label}>Способ оплаты</span>
                <span className={styles.value}>
                  {paymentInfo.payment_method === "card" ? "Онлайн (карта)" : "Наличными"}
                </span>
              </div>
            )}
            <div className={styles.orderRow}>
              <span className={styles.label}>Статус оплаты</span>
              <span className={styles.statusBadge}>
                {STATUS_LABELS[paymentInfo.payment_status] || paymentInfo.payment_status || "—"}
              </span>
            </div>
            {paymentInfo.payment_receipt_url && (
              <div className={styles.orderRow}>
                <span className={styles.label}>Чек</span>
                <a
                  className={styles.link}
                  href={paymentInfo.payment_receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Открыть
                </a>
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={() => navigate("/")}
          >
            Вернуться в меню
          </button>
          {paymentId && (
            <button
              className={styles.secondaryButton}
              onClick={handleRefresh}
              disabled={loading}
            >
              Обновить статус
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentResultPage;

