import { useMenuPaginated } from "../hooks/useMenuPaginated";
import MenuItemCard from "../components/Menu/MenuItemCard";
import CategoryFilter from "../components/Menu/CategoryFilter";
import CartPreview from "../components/Cart/CartPreview";
import { useScrollToTop } from "../hooks/useScrollToTop";
import styles from "./MenuPage.module.css";

function MenuPage() {
  const { 
    menuItems, 
    categories, 
    loading, 
    loadingMore, 
    activeCategory,
    setActiveCategory,
    observerTarget
  } = useMenuPaginated(20);

  // Скроллим наверх при загрузке страницы
  useScrollToTop();

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
          {menuItems.map((item, index) => (
            <div 
              key={item.id} 
              className={styles.menuItemWrapper}
              style={{ animationDelay: `${Math.min(index, 10) * 0.1}s` }}
            >
              <MenuItemCard item={item} />
            </div>
          ))}
          
          {/* Sentinel element for infinite scroll */}
          <div ref={observerTarget} style={{ height: '20px' }}></div>
          
          {loadingMore && (
            <div className={styles.loadingMore}>
              <div className={styles.spinner}></div>
              <p>Загрузка...</p>
            </div>
          )}
        </div>
      </div>

      <CartPreview />
    </div>
  );
}

export default MenuPage;

