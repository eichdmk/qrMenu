import { useOrdersSSE } from "../../hooks/useOrdersSSE";
import { getStatusText, getStatusColor, formatPrice, formatDate, formatTime } from "../../utils/format";
import { toast } from "react-toastify";
import { useEffect, useRef, useCallback } from "react";
import styles from "./OrderManager.module.css";

function OrderManager() {
  const { orders, loading, updateOrderStatus, isConnected, hasMore, loadMore } = useOrdersSSE();
  const observerRef = useRef(null);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!window.notificationAudioContext) {
          const audioContext = new AudioContext();
          window.notificationAudioContext = audioContext;
          
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 0;
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          oscillator.start();
          oscillator.stop();
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initAudio();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      toast.success("Статус заказа обновлен");
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    }
  };

  const lastOrderElementRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore]);

  if (loading) {
    return <p>Загрузка заказов...</p>;
  }

  return (
    <div className={styles.manager}>
      {/* Индикатор подключения к SSE */}
      <div style={{ 
        marginBottom: '10px', 
        padding: '8px 12px', 
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isConnected ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#28a745' : '#dc3545',
          animation: isConnected ? 'pulse 2s infinite' : 'none'
        }}></span>
        <span style={{ fontSize: '14px', color: '#333' }}>
          {isConnected ? '✓ Подключено к уведомлениям в реальном времени' : '✗ Отключено от уведомлений'}
        </span>
      </div>
      
      {orders.length > 0 ? (
        <div className={styles.ordersList}>
          {orders.map((order, index) => (
            <div 
              key={order.id} 
              className={styles.orderCard}
              ref={index === orders.length - 1 ? lastOrderElementRef : null}
            >
              <div className={styles.orderHeader}>
                <h4>Заказ #{order.id}</h4>
                <span 
                  className={styles.status} 
                  style={{ backgroundColor: getStatusColor(order.status, 'order') }}
                >
                  {getStatusText(order.status, 'order')}
                </span>
              </div>
              <div className={styles.orderDetails}>
                <p><strong>Столик:</strong> {order.table_name ? `№${order.table_name}` : `Самовывоз`}</p>
                <p><strong>Тип заказа:</strong> {order.order_type === 'takeaway' ? 'Самовывоз' : 'В зале'}</p>
                <p><strong>Клиент:</strong> {order.customer_name || 'Не указано'}</p>
                <p><strong>Телефон:</strong> {order.customer_phone || 'Не указано'}</p>
                <p><strong>Сумма:</strong> {formatPrice(order.total_amount)}</p>
                <p><strong>Дата:</strong> {formatDate(order.created_at)} {formatTime(order.created_at)}</p>
                
                {/* Комментарий к заказу */}
                {order.comment && (
                  <div className={styles.orderComment}>
                    <strong>Комментарий к заказу:</strong>
                    <div className={styles.commentText}>{order.comment}</div>
                  </div>
                )}
                
                {/* Детали заказа */}
                <div className={styles.orderItems}>
                  <h5>Позиции заказа:</h5>
                  {order.items && order.items.length > 0 ? (
                    <ul className={styles.itemsList}>
                      {order.items.map((item, index) => (
                        <li key={index} className={styles.orderItem}>
                          <span className={styles.itemName}>{item.menu_item_name}</span>
                          <span className={styles.itemQuantity}>x{item.quantity}</span>
                          <span className={styles.itemPrice}>{formatPrice(item.unit_price * item.quantity)}</span>
                          {item.item_comment && (
                            <div className={styles.itemComment}>Комментарий: {item.item_comment}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Позиции заказа не найдены</p>
                  )}
                </div>
              </div>
              <div className={styles.orderActions}>
                <select 
                  value={order.status} 
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className={styles.statusSelect}
                >
                  <option value="pending">Новый</option>
                  <option value="preparing">Готовится</option>
                  <option value="ready">Готов</option>
                  <option value="completed">Выполнен</option>
                  <option value="cancelled">Отменён</option>
                </select>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className={styles.loadingMore}>
              <p>Загрузка...</p>
            </div>
          )}
        </div>
      ) : (
        <p>Заказов пока нет.</p>
      )}
    </div>
  );
}

export default OrderManager;