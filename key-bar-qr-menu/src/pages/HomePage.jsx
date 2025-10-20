import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";

function HomePage() {
  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              <span className={styles.gradientText}>Добро пожаловать</span>
              <br />
              в <span className={styles.brandName}>Key Bar</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Откройте для себя мир изысканных вкусов и незабываемых впечатлений в атмосфере настоящего лофта
            </p>
            <div className={styles.heroButtons}>
              <Link to="/menu" className={styles.primaryButton}>
                <span className={styles.buttonIcon}>🍽️</span>
                Посмотреть меню
              </Link>
              <Link to="/reservation" className={styles.secondaryButton}>
                <span className={styles.buttonIcon}>📅</span>
                Забронировать столик
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.floatingElements}>
              <div className={styles.floatingElement}>☕</div>
              <div className={styles.floatingElement}>🥐</div>
              <div className={styles.floatingElement}>🍰</div>
              <div className={styles.floatingElement}>🔥</div>
            </div>
            <div className={styles.loftElements}>
              <div className={styles.brickPattern}></div>
              <div className={styles.woodTexture}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>✨</span>
              Почему выбирают нас
            </h2>
            <p className={styles.sectionSubtitle}>
              Мы создали уникальное пространство для вашего комфорта
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏭</div>
              <h3>Лофт атмосфера</h3>
              <p>Индустриальный дизайн с уютной атмосферой создает неповторимую обстановку</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>👨‍🍳</div>
              <h3>Авторская кухня</h3>
              <p>Наши шеф-повара готовят блюда из свежих продуктов по авторским рецептам</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>☕</div>
              <h3>Лучший кофе</h3>
              <p>Профессиональные бариста готовят кофе из зерен премиум класса</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📱</div>
              <h3>QR-меню</h3>
              <p>Современная система заказов через QR-код прямо с вашего столика</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎵</div>
              <h3>Живая музыка</h3>
              <p>По выходным у нас выступают местные музыканты и DJ</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📅</div>
              <h3>Онлайн бронь</h3>
              <p>Забронируйте столик онлайн в удобное для вас время</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className={styles.aboutSection}>
        <div className={styles.container}>
          <div className={styles.aboutContent}>
            <div className={styles.aboutText}>
              <h2 className={styles.aboutTitle}>
                <span className={styles.aboutIcon}>🏗️</span>
                О нашем кафе
              </h2>
              <p>
                Key Bar – это не просто кафе, это пространство, где индустриальный 
                стиль лофт сочетается с домашним уютом. Мы создали место, где можно 
                насладиться отличным кофе, вкусной едой и приятной атмосферой.
              </p>
              <p>
                Наша команда профессионалов работает над тем, чтобы каждый гость 
                чувствовал себя как дома. Мы используем только свежие продукты и 
                готовим все блюда с любовью.
              </p>
              <div className={styles.aboutStats}>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>5+</div>
                  <div className={styles.statLabel}>Лет работы</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>50+</div>
                  <div className={styles.statLabel}>Блюд в меню</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>1000+</div>
                  <div className={styles.statLabel}>Довольных гостей</div>
                </div>
              </div>
            </div>
            <div className={styles.aboutImage}>
              <div className={styles.imageDecoration}>
                <div className={styles.decorElement}>☕</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Готовы сделать заказ?</h2>
            <p className={styles.ctaSubtitle}>
              Посмотрите наше меню или забронируйте столик прямо сейчас
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/menu" className={styles.ctaPrimary}>
                <span className={styles.buttonIcon}>🍽️</span>
                Открыть меню
              </Link>
              <Link to="/takeaway" className={styles.ctaSecondary}>
                <span className={styles.buttonIcon}>🥡</span>
                Заказать с собой
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
