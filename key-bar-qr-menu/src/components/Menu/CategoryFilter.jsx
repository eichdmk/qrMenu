import styles from "./CategoryFilter.module.css";

function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
  const categoryIcons = {
    "all": "🍽️",
    "Закуски": "🥗",
    "Основные блюда": "🍖",
    "Напитки": "🥤",
    "Десерты": "🍰"
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterWrapper}>
        <button
          className={`${styles.filterButton} ${activeCategory === "all" ? styles.active : ""}`}
          onClick={() => onCategoryChange("all")}
        >
          <span className={styles.buttonIcon}>{categoryIcons["all"]}</span>
          <span className={styles.buttonText}>Все блюда</span>
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`${styles.filterButton} ${activeCategory === category.id ? styles.active : ""}`}
            onClick={() => onCategoryChange(category.id)}
          >
            <span className={styles.buttonIcon}>{categoryIcons[category.name] || "🍽️"}</span>
            <span className={styles.buttonText}>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryFilter;