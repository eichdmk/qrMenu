import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/auth";
import { setGlobalForceLogout } from "../utils/authUtils";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Функция для принудительного выхода при истечении токена
  const forceLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Перенаправляем на страницу входа
    // Используем window.location.href для полного обновления страницы,
    // что гарантирует очистку всех состояний React
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      if (token && userData) {
        try {
          // Проверяем токен на сервере только если он существует
          const response = await authAPI.verify();
          // Если токен валидный, устанавливаем пользователя из ответа сервера
          setUser(response.data.user);
        } catch (error) {
          // Если токен истек или невалидный, очищаем хранилище
          // НЕ перенаправляем на /login, так как пользователь может быть обычным клиентом
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      
      setLoading(false);
      
      // Регистрируем функцию принудительного выхода для глобального использования
      setGlobalForceLogout(forceLogout);
    };

    checkAuth();
  }, [forceLogout]);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Ошибка входа",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    forceLogout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};