import { useState, useEffect } from "react";
import { tablesAPI } from "../../api/tables";
import { toast } from "react-toastify";
import { getStatusText, getStatusColor } from "../../utils/format";
import styles from "./TableManager.module.css";

function TableManager() {
  const [tables, setTables] = useState([]);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ name: "", seats: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await tablesAPI.getAll();
      setTables(response.data);
    } catch (error) {
      toast.error("Ошибка загрузки столиков");
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({ name: table.name, seats: table.seats });
  };

  const handleCancel = () => {
    setEditingTable(null);
    setFormData({ name: "", seats: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTable) {
        await tablesAPI.update(editingTable.id, formData);
        toast.success("Столик обновлен");
      } else {
        await tablesAPI.create(formData);
        toast.success("Столик добавлен");
      }
      fetchTables();
      handleCancel();
    } catch (error) {
      toast.error("Ошибка при сохранении столика");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Удалить этот столик? Это действие нельзя отменить.")) return;

    try {
      await tablesAPI.delete(id);
      toast.success("Столик удален");
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.message || "Ошибка при удалении столика");
    }
  };

  const handleStatusChange = async (id, isOccupied) => {
    try {
      await tablesAPI.updateStatus(id, { is_occupied: isOccupied });
      toast.success("Статус столика обновлен");
      fetchTables();
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    }
  };

  return (
    <div className={styles.manager}>
      <div className={styles.formSection}>
        <h3>{editingTable ? "Редактировать столик" : "Добавить столик"}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Название столика</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Количество мест</label>
            <input
              type="number"
              value={formData.seats}
              onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
              min="1"
              max="20"
              required
            />
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" disabled={loading} className={styles.saveButton}>
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.listSection}>
        <h3>Список столиков</h3>
        <div className={styles.itemsList}>
          {tables.map((table) => (
            <div key={table.id} className={styles.itemCard}>
              <div className={styles.tableInfo}>
                <h4>№{table.name}</h4>
                <p>Мест: {table.seats}</p>
                <p>QR-токен: {table.token}</p>
                <span 
                  className={styles.status} 
                  style={{ backgroundColor: getStatusColor(table.is_occupied ? 'occupied' : 'available', 'table') }}
                >
                  {getStatusText(table.is_occupied ? 'occupied' : 'available', 'table')}
                </span>
              </div>
              <div className={styles.itemActions}>
                <select 
                  value={table.is_occupied ? 'occupied' : 'available'} 
                  onChange={(e) => handleStatusChange(table.id, e.target.value === 'occupied')}
                  className={styles.statusSelect}
                >
                  <option value="available">Свободен</option>
                  <option value="occupied">Занят</option>
                </select>
                <button onClick={() => handleEdit(table)} className={styles.editButton}>
                  ✏️
                </button>
                <button onClick={() => handleDelete(table.id)} className={styles.deleteButton}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TableManager;