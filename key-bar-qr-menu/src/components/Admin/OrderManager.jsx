import { useOrders } from "../../hooks/useOrders";
import { getStatusText, getStatusColor, formatPrice, formatDate, formatTime } from "../../utils/format";
import { toast } from "react-toastify";
import styles from "./OrderManager.module.css";

function OrderManager() {
  const { orders, loading, updateOrderStatus } = useOrders();

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      toast.success("Статус заказа обновлен");
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    }
  };

  if (loading) {
    return <p>Загрузка заказов...</p>;
  }

  return (
    <div className={styles.manager}>
      <h3>Управление заказами</h3>
      {orders.length > 0 ? (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
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
        </div>
      ) : (
        <p>Заказов пока нет.</p>
      )}
    </div>
  );
}

export default OrderManager;