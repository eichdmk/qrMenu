import { useMenuPaginated } from "../hooks/useMenuPaginated";
import MenuItemCard from "../components/Menu/MenuItemCard";
import CategoryFilter from "../components/Menu/CategoryFilter";
import CartPreview from "../components/Cart/CartPreview";
import { useScrollToTop, useScrollToElementOnChange } from "../hooks/useScrollToTop";
import { Link } from "react-router-dom";
import { CalendarIcon, TableIcon } from "../components/Icons";
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
  
  // Скроллим к фильтру категорий при смене категории
  useScrollToElementOnChange(activeCategory, "#category-filter");

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
            Наше меню
          </h2>
          <p className={styles.sectionSubtitle}>
            Выберите категорию и наслаждайтесь вкусными блюдами
          </p>
        </div>

        {/* Reservation CTA - Premium Hero */}
        <div className={styles.reservationBanner}>
          <div className={styles.reservationOverlay}></div>
          <div className={styles.reservationContent}>
            <div className={styles.reservationText}>
              <div className={styles.kicker}>Резерв столиков</div>
              <h3 className={styles.reservationTitle}>
                <span className={styles.reservationIcon}><CalendarIcon size={22} /></span>
                Ваш вечер — за нашим столом
              </h3>
              <p className={styles.reservationSubtitle}>Выберите удобное время, укажите контакты — мы подготовим идеальное место.</p>
            </div>
            <div className={styles.reservationActions}>
              <Link to="/reservation" className={styles.reservationButton}>
                <span className={styles.buttonIcon}><TableIcon size={18} /></span>
                Забронировать столик
              </Link>
              <Link to="/reservation" className={styles.reservationLink}>Подробнее</Link>
            </div>
          </div>
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

