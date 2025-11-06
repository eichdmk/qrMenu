import { useState } from "react";
import { useMenu } from "../../hooks/useMenu";
import { uploadAPI } from "../../api/upload";
import { formatPrice } from "../../utils/format";
import { getImageUrl } from "../../api/constants";
import { toast } from "react-toastify";
import styles from "./MenuManager.module.css";

function MenuManager() {
  const { menuItems, categories, createMenuItem, updateMenuItem, deleteMenuItem } = useMenu();
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    image_url: "",
    available: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.category_id ? String(item.category_id) : "",
      image_url: item.image_url,
      available: item.available,
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      image_url: "",
      available: true,
    });
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let data = {
        ...formData,
        category_id: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
      };
      
      delete data.categoryId;

      if (imageFile) {
        const uploadResult = await uploadAPI.uploadImage(imageFile);
        data.image_url = uploadResult.image_url;
      }

      if (editingItem) {
        await updateMenuItem(editingItem.id, data);
        toast.success("Блюдо обновлено");
      } else {
        await createMenuItem(data);
        toast.success("Блюдо добавлено");
      }

      handleCancel();
    } catch (error) {
      toast.error("Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Удалить это блюдо?")) return;

    try {
      await deleteMenuItem(id);
      toast.success("Блюдо удалено");
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Ошибка при удалении";
      toast.error(errorMessage);
    }
  };

  return (
    <div className={styles.manager}>
      <div className={styles.formSection}>
        <h3>{editingItem ? "Редактировать блюдо" : "Добавить блюдо"}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Название</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Цена</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Категория</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Изображение</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
            {formData.image_url && (
              <img src={getImageUrl(formData.image_url)} alt="Preview" className={styles.imagePreview} />
            )}
          </div>

          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              />
              Доступно для заказа
            </label>
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
        <h3>Список блюд</h3>
        <div className={styles.itemsList}>
          {menuItems.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <img src={getImageUrl(item.image_url)} alt={item.name} />
              <div className={styles.itemInfo}>
                <h4>{item.name}</h4>
                <p>{item.description}</p>
                <span className={styles.price}>{formatPrice(item.price)}</span>
                {!item.available && <span className={styles.unavailable}>Недоступно</span>}
              </div>
              <div className={styles.itemActions}>
                <button onClick={() => handleEdit(item)} className={styles.editButton}>
                  ✏️
                </button>
                <button onClick={() => handleDelete(item.id)} className={styles.deleteButton}>
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

export default MenuManager;