import styles from "./Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.brandSection}>
              <div className={styles.brandLogo}>
                <span className={styles.logoIcon}>☕</span>
                <div className={styles.brandText}>
                  <h3>Key Bar</h3>
                  <span className={styles.brandSubtitle}>Лофт Кафе</span>
                </div>
              </div>
              <p>Лучшее место для отдыха и вкусной еды в атмосфере лофта</p>
              <div className={styles.social}>
                <a href="#" aria-label="Facebook" className={styles.socialLink}>
                  <span className={styles.socialIcon}>📘</span>
                </a>
                <a href="#" aria-label="Instagram" className={styles.socialLink}>
                  <span className={styles.socialIcon}>📷</span>
                </a>
                <a href="#" aria-label="Telegram" className={styles.socialLink}>
                  <span className={styles.socialIcon}>✈️</span>
                </a>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <h4>Контакты</h4>
            <p>📞 +7 (999) 123-45-67</p>
            <p>✉️ info@keybar.ru</p>
            <p>📍 г. Москва, ул. Примерная, 123</p>
          </div>
          <div className={styles.section}>
            <h4>Часы работы</h4>
            <p>Пн-Чт: 12:00 - 23:00</p>
            <p>Пт-Сб: 12:00 - 02:00</p>
            <p>Вс: 12:00 - 22:00</p>
          </div>
        </div>
        <div className={styles.copyright}>
          <p>&copy; 2025 Key Bar. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;