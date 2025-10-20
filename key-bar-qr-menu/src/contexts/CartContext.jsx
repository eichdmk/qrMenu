import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

const CartContext = createContext();

const CART_STORAGE_KEY = "keybar_cart";

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

// Функция для загрузки корзины из sessionStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error("Ошибка загрузки корзины из sessionStorage:", error);
  }
  return [];
};

// Функция для сохранения корзины в sessionStorage
const saveCartToStorage = (items) => {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Ошибка сохранения корзины в sessionStorage:", error);
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCartFromStorage);
  const toastShownRef = useRef(new Set());
  
  // Автоматическое сохранение корзины при изменении
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);
  
  const addItem = (item) => {
    const toastKey = `${item.id}-${Date.now()}`;
    
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      
      // Показываем toast только если его еще не показывали
      if (!toastShownRef.current.has(toastKey)) {
        toastShownRef.current.add(toastKey);
        
        // Очищаем старые ключи через 3 секунды
        setTimeout(() => {
          toastShownRef.current.delete(toastKey);
        }, 3000);
        
        if (existingItem) {
          toast.success(`${item.name} добавлено в корзину (${existingItem.quantity + 1})`, {
            autoClose: 2000,
            position: "bottom-right",
            toastId: toastKey
          });
        } else {
          toast.success(`${item.name} добавлено в корзину`, {
            autoClose: 2000,
            position: "bottom-right",
            toastId: toastKey
          });
        }
      }
      
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };
  
  const removeItem = (itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };
  
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };
  
  const clearCart = () => {
    setItems([]);
    sessionStorage.removeItem(CART_STORAGE_KEY);
  };
  
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};