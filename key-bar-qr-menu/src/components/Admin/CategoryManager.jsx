import { useState } from "react";
import { useMenu } from "../../hooks/useMenu";
import { categoriesAPI } from "../../api/categories";
import { toast } from "react-toastify";
import styles from "./CategoryManager.module.css";

function CategoryManager() {
  const { categories, refetch: refetchMenu } = useMenu();
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setFormData({ name: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData);
        toast.success("Категория обновлена");
      } else {
        await categoriesAPI.create(formData);
        toast.success("Категория добавлена");
      }
      refetchMenu();
      handleCancel();
    } catch (error) {
      toast.error("Ошибка при сохранении категории");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Удалить эту категорию? Все блюда в ней останутся без категории.")) return;

    try {
      await categoriesAPI.delete(id);
      toast.success("Категория удалена");
      refetchMenu();
    } catch (error) {
      toast.error("Ошибка при удалении категории");
    }
  };

  return (
    <div className={styles.manager}>
      <div className={styles.formSection}>
        <h3>{editingCategory ? "Редактировать категорию" : "Добавить категорию"}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Название категории</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
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
        <h3>Список категорий</h3>
        <div className={styles.itemsList}>
          {categories.map((category) => (
            <div key={category.id} className={styles.itemCard}>
              <h4>{category.name}</h4>
              <div className={styles.itemActions}>
                <button onClick={() => handleEdit(category)} className={styles.editButton}>
                  ✏️
                </button>
                <button onClick={() => handleDelete(category.id)} className={styles.deleteButton}>
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

export default CategoryManager;