import { useState, useEffect } from "react";
import { useMenu } from "../hooks/useMenu";
import MenuItemCard from "../components/Menu/MenuItemCard";
import CategoryFilter from "../components/Menu/CategoryFilter";
import CartPreview from "../components/Cart/CartPreview";
import styles from "./MenuPage.module.css";

function MenuPage() {
  const { menuItems, categories, loading } = useMenu();
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    // Прокручиваем в самый верх страницы при смене категории
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  const filteredItems =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category_id === activeCategory);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Загрузка меню...</p>
      </div>
    );
  }

  return (
    <div className={styles.menuPage}>
      <div className={styles.container} id="menu">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📋</span>
            Наше меню
          </h2>
          <p className={styles.sectionSubtitle}>
            Выберите категорию и наслаждайтесь вкусными блюдами
          </p>
        </div>

        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <div className={styles.menuGrid}>
          {filteredItems.map((item, index) => (
            <div 
              key={item.id} 
              className={styles.menuItemWrapper}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <MenuItemCard item={item} />
            </div>
          ))}
        </div>
      </div>

      <CartPreview />
    </div>
  );
}

export default MenuPage;

