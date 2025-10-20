import { useState, useEffect } from "react";
import { ordersAPI } from "../api/orders";

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      setOrders(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (data) => {
    try {
      // Преобразуем данные корзины в формат, ожидаемый API
      const orderData = {
        table_id: data.tableId,
        reservation_id: data.reservationId || null,
        order_type: data.orderType || 'dine_in',
        customer_name: data.customerName || null,
        customer_phone: data.customerPhone || null,
        comment: data.comment || null,
        items: data.items.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          item_comment: item.item_comment || null
        }))
      };
      
      const response = await ordersAPI.create(orderData);
      setOrders((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const response = await ordersAPI.updateStatus(id, { status });
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? response.data : order))
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    createOrder,
    updateOrderStatus,
  };
};