import styles from "./Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Левая часть */}
          <div className={styles.section}>
            <div className={styles.brandSection}>
              <div className={styles.brandLogo}>
                <img
                  src="/logo key.png"
                  alt="Key Bar"
                  className={styles.brandLogoImg}
                />
              </div>
              <p>Лучшее место для отдыха и вкусной еды в атмосфере лофта</p>
              <div className={styles.social}>
                <a href="https://wa.me/79994006000" aria-label="WhatsApp" className={styles.socialLink}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={styles.socialIcon}
                  >
                    <path d="M20.52 3.48A11.88 11.88 0 0 0 12 0a11.93 11.93 0 0 0-10.28 17.94L0 24l6.25-1.64A11.93 11.93 0 0 0 12 24a11.87 11.87 0 0 0 8.52-20.52zM12 22a9.94 9.94 0 0 1-5.09-1.4l-.36-.21-3.72.98 1-3.63-.24-.37A9.94 9.94 0 1 1 12 22zm5.46-7.57c-.3-.15-1.78-.88-2.06-.98s-.48-.15-.69.15-.79.98-.97 1.17-.36.22-.66.07a8.16 8.16 0 0 1-2.39-1.47 9.01 9.01 0 0 1-1.66-2.05c-.17-.3 0-.46.13-.6.13-.13.3-.36.45-.53.15-.17.2-.3.3-.5s.05-.37-.03-.52-.69-1.68-.94-2.3c-.25-.6-.5-.5-.69-.5H7.4c-.22 0-.57.08-.87.37-.3.3-1.13 1.1-1.13 2.67s1.15 3.1 1.31 3.32c.16.22 2.26 3.45 5.48 4.83.77.33 1.37.52 1.83.66.77.24 1.46.21 2.01.13.61-.09 1.78-.73 2.03-1.44.25-.71.25-1.32.17-1.44s-.27-.22-.57-.37z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/key_bar_95/" aria-label="Instagram" className={styles.socialLink}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={styles.socialIcon}
                  >
                    <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.5-.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                  </svg>
                </a>
                <a href="https://t.me/79994006000" aria-label="Telegram" className={styles.socialLink}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={styles.socialIcon}
                  >
                    <path d="M9.04 14.71 8.85 18.2c.36 0 .52-.15.71-.34l1.7-1.62 3.53 2.58c.65.36 1.1.17 1.26-.6l2.29-10.74.01-.01c.2-.93-.34-1.3-.95-1.07l-13.5 5.2c-.92.36-.9.87-.16 1.11l3.46 1.08 8.02-5.07c.38-.26.73-.12.45.16l-6.52 5.95z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Контакты */}
          <div className={styles.section}>
            <h4>Контакты</h4>
            <p>📞 +7‒999‒400‒60‒00</p>
            <p>📍 г. Грозный, ул. Дьякова, 21</p>
          </div>

          {/* Время работы */}
          <div className={styles.section}>
            <h4>Часы работы</h4>
            <p>Ежедневно 10:00 - 23:00</p>
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
