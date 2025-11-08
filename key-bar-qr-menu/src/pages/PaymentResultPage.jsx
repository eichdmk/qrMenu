import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ordersAPI } from "../api/orders";
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

function PaymentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [orderInfo, setOrderInfo] = useState(null);
  const [error, setError] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const queryPaymentId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("payment_id") || params.get("paymentId") || params.get("paymentId".toLowerCase());
  }, [location.search]);

  const statusConfig = STATUS_CONFIG[error ? "error" : status] || STATUS_CONFIG.pending;

  useEffect(() => {
    let id = queryPaymentId;

    if (!id) {
      const storedId = sessionStorage.getItem("kb_recent_payment_id");
      if (storedId) {
        id = storedId;
      }
    }

    setPaymentId(id);

    if (!id) {
      setStatus("unknown");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let pollId;

    const loadStatus = async (isPolling = false) => {
      setLoading(true);
      try {
        const response = await ordersAPI.getByPaymentId(id);
        if (cancelled) return;
        setOrderInfo(response.data);
        const newStatus = response.data.payment_status || "pending";
        setStatus(newStatus);
        setError(null);
        if (newStatus !== "pending" && pollId) {
          clearInterval(pollId);
          pollId = null;
        }
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || "Не удалось получить статус оплаты");
        setStatus("error");
        if (pollId && !isPolling) {
          clearInterval(pollId);
          pollId = null;
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStatus();

    pollId = setInterval(() => {
      loadStatus(true);
    }, 5000);

    return () => {
      cancelled = true;
      if (pollId) {
        clearInterval(pollId);
      }
    };
  }, [queryPaymentId]);

  useEffect(() => {
    if (paymentId) {
      sessionStorage.removeItem("kb_recent_payment_id");
    }
  }, [paymentId, status]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>{statusConfig.icon}</div>
        <h1 className={styles.title}>{statusConfig.title}</h1>
        <p className={styles.description}>{statusConfig.description}</p>

        {loading && <div className={styles.loader}>Проверяем статус оплаты...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {orderInfo && (
          <div className={styles.orderInfo}>
            <div className={styles.orderRow}>
              <span className={styles.label}>Номер заказа</span>
              <span className={styles.value}>№{orderInfo.id}</span>
            </div>
            <div className={styles.orderRow}>
              <span className={styles.label}>Сумма</span>
              <span className={styles.value}>{formatPrice(orderInfo.total_amount)}</span>
            </div>
            <div className={styles.orderRow}>
              <span className={styles.label}>Статус оплаты</span>
              <span className={styles.statusBadge}>{orderInfo.payment_status}</span>
            </div>
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
              onClick={() => window.location.reload()}
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

