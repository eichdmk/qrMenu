import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./LoginPage.module.css";

// SVG-иконки
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 9.9a3 3 0 1 0 4.2 4.2" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Если пользователь уже авторизован, перенаправляем на админ-панель
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData);

    if (result.success) {
      navigate("/admin");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Показываем загрузку, пока проверяется авторизация
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h1>🔐 Вход в систему</h1>
            <p>Проверка авторизации...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <h1>🔐 Вход в систему</h1>
          <p>Войдите в свой аккаунт Key Bar</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Логин</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Ваш логин"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Пароль</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className={styles.passwordInput}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;