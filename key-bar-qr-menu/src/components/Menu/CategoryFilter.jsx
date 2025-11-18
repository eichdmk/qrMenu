import { useEffect, useRef } from "react";
import styles from "./CategoryFilter.module.css";

function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
  const filterWrapperRef = useRef(null);
  const activeButtonRef = useRef(null);

  // Прокручиваем горизонтальный скролл к активной кнопке
  useEffect(() => {
    if (activeButtonRef.current && filterWrapperRef.current) {
      const button = activeButtonRef.current;
      const wrapper = filterWrapperRef.current;
      
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const wrapperWidth = wrapper.offsetWidth;
      const scrollLeft = wrapper.scrollLeft;
      
      // Проверяем, видна ли кнопка
      const isVisible = buttonLeft >= scrollLeft && 
                       (buttonLeft + buttonWidth) <= (scrollLeft + wrapperWidth);
      
      if (!isVisible) {
        // Прокручиваем так, чтобы кнопка была по центру или видна
        const targetScroll = buttonLeft - (wrapperWidth / 2) + (buttonWidth / 2);
        wrapper.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }
  }, [activeCategory]);

  return (
    <div className={styles.filterContainer} id="category-filter">
      <div className={styles.filterWrapper} ref={filterWrapperRef}>
        <button
          ref={activeCategory === "all" ? activeButtonRef : null}
          className={`${styles.filterButton} ${activeCategory === "all" ? styles.active : ""}`}
          onClick={() => onCategoryChange("all")}
        >
          <span className={styles.buttonText}>Все блюда</span>
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            ref={activeCategory === category.id ? activeButtonRef : null}
            className={`${styles.filterButton} ${activeCategory === category.id ? styles.active : ""}`}
            onClick={() => onCategoryChange(category.id)}
          >
            <span className={styles.buttonText}>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryFilter;