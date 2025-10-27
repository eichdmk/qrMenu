import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import styles from "./Navbar.module.css";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>☕</span>
          <div className={styles.logoText}>
            <span className={styles.brandName}>Key Bar</span>
          </div>
        </Link>

        <button className={styles.menuToggle} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`${styles.navLinks} ${isMenuOpen ? styles.active : ""}`}>
          <li>
            <Link to="/" onClick={() => setIsMenuOpen(false)} className={styles.navLink}>
              <span>Главная</span>
            </Link>
          </li>
          <li>
            <Link to="/menu" onClick={() => setIsMenuOpen(false)} className={styles.navLink}>
              <span>Меню</span>
            </Link>
          </li>
          <li>
            <Link to="/reservation" onClick={() => setIsMenuOpen(false)} className={styles.navLink}>
              <span>Бронирование</span>
            </Link>
          </li>
          <li>
            <Link to="/takeaway" onClick={() => setIsMenuOpen(false)} className={styles.navLink}>
              <span>С собой</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;