export const formatPrice = (price) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  }).format(price);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusText = (status, type) => {
  const statusMap = {
    order: {
      pending: "Новый",
      preparing: "Готовится",
      ready: "Готов",
      completed: "Выполнен",
      cancelled: "Отменён",
    },
    reservation: {
      pending: "Ожидает",
      confirmed: "Подтверждено",
      cancelled: "Отменено",
    },
    table: {
      available: "Свободен",
      occupied: "Занят",
      reserved: "Забронирован",
    },
  };

  return statusMap[type]?.[status] || status;
};

export const getStatusColor = (status, type) => {
  const colorMap = {
    order: {
      pending: "#ffa500",
      preparing: "#1e90ff",
      ready: "#32cd32",
      completed: "#808080",
      cancelled: "#dc143c",
    },
    reservation: {
      pending: "#ffa500",
      confirmed: "#32cd32",
      cancelled: "#dc143c",
    },
    table: {
      available: "#32cd32",
      occupied: "#dc143c",
      reserved: "#ffa500",
    },
  };

  return colorMap[type]?.[status] || "#808080";
};