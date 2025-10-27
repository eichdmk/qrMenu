import api from './index';

// 🧾 ORDERS (заказы)
export const ordersAPI = {
  getAll: (limit = 12, offset = 0) => api.get("/orders", { params: { limit, offset } }),
  create: (data) => api.post("/orders", data),
  updateStatus: (id, data) => api.put(`/orders/${id}`, data),
};

// Standalone функция для создания заказа без загрузки списка заказов
export const createOrder = async (data) => {
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
  return response.data;
};