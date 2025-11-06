import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);
  
  const addItem = useCallback((item) => {
    const toastKey = `${item.id}-${Date.now()}`;
    
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      
      if (!toastShownRef.current.has(toastKey)) {
        toastShownRef.current.add(toastKey);
        
        setTimeout(() => {
          toastShownRef.current.delete(toastKey);
        }, 3000);
        
        if (existingItem) {
          toast.success(`${item.name} добавлено в корзину (${existingItem.quantity + 1})`, {
            autoClose: 2000,
            position: "top-right",
            toastId: toastKey
          });
        } else {
          toast.success(`${item.name} добавлено в корзину`, {
            autoClose: 2000,
            position: "top-right",
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
  }, []);
  
  const removeItem = useCallback((itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  }, []);
  
  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);
  
  const clearCart = useCallback(() => {
    setItems([]);
    sessionStorage.removeItem(CART_STORAGE_KEY);
  }, []);
  
  const total = useMemo(() => 
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  
  const itemCount = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  
  const value = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  }), [items, addItem, removeItem, updateQuantity, clearCart, total, itemCount]);
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};