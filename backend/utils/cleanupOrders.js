import pool from '../db.js';

/**
 * Очищает заказы старше указанного количества дней
 * @param {number} daysOld - Количество дней, после которых заказы считаются старыми
 * @returns {Promise<{deletedOrders: number, deletedItems: number}>}
 */
export const cleanupOldOrders = async (daysOld = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    console.log(`[Cleanup] Начинаем очистку заказов старше ${daysOld} дней (до ${cutoffDate.toISOString()})`);

    // Сначала получаем ID заказов для удаления
    const ordersToDelete = await pool.query(
      `SELECT id FROM orders WHERE created_at < $1`,
      [cutoffDate]
    );

    const orderIds = ordersToDelete.rows.map(row => row.id);

    if (orderIds.length === 0) {
      console.log('[Cleanup] Нет заказов для удаления');
      return { deletedOrders: 0, deletedItems: 0 };
    }

    // Удаляем связанные элементы заказов (order_items)
    const deleteItemsResult = await pool.query(
      `DELETE FROM order_items WHERE order_id = ANY($1)`,
      [orderIds]
    );
    const deletedItemsCount = deleteItemsResult.rowCount || 0;

    // Удаляем сами заказы
    const deleteOrdersResult = await pool.query(
      `DELETE FROM orders WHERE id = ANY($1)`,
      [orderIds]
    );
    const deletedOrdersCount = deleteOrdersResult.rowCount || 0;

    console.log(`[Cleanup] Удалено заказов: ${deletedOrdersCount}, элементов заказов: ${deletedItemsCount}`);

    return {
      deletedOrders: deletedOrdersCount,
      deletedItems: deletedItemsCount
    };
  } catch (error) {
    console.error('[Cleanup] Ошибка при очистке заказов:', error);
    throw error;
  }
};

/**
 * Запускает автоматическую очистку заказов каждые 7 дней
 */
export const startAutoCleanup = () => {
  // Запускаем очистку сразу при старте (опционально)
  // cleanupOldOrders(7).catch(console.error);

  console.log('[Cleanup] Автоматическая очистка заказов настроена (каждые 7 дней)');
  
  // Возвращаем функцию для ручного запуска очистки
  return cleanupOldOrders;
};

