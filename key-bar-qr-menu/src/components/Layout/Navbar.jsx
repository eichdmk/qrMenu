import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import styles from "./Navbar.module.css";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          <img
            src="/logo key.png"
            alt="Key Bar"
            className={styles.logoImg}
          />
        </Link>

        <button 
          className={`${styles.menuToggle} ${isMenuOpen ? styles.active : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`${styles.navLinks} ${isMenuOpen ? styles.active : ""}`}>
          <li>
            <Link to="/" onClick={() => setIsMenuOpen(false)} className={styles.navLink}>
              <span>Меню</span>
            </Link>
          </li>
          <li>
            <Link to="/reservation" onClick={() => setIsMenuOpen(false)} className={styles.navLink}>
              <span>Бронирование</span>
            </Link>
          </li>
          {/* <li>
            <Link to="/takeaway" onClick={() => setIsMenuOpen(false)} className={styles.navLink}>
              <span>С собой</span>
            </Link>
          </li> */}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;