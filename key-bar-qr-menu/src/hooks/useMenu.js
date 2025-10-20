import { useState, useEffect } from "react";
import { menuAPI} from "../api/menu";
import {categoriesAPI } from '../api/categories'

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const [menuRes, categoriesRes] = await Promise.all([
        menuAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setMenuItems(menuRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createMenuItem = async (data) => {
    try {
      const response = await menuAPI.create(data);
      setMenuItems((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const updateMenuItem = async (id, data) => {
    try {
      const response = await menuAPI.update(id, data);
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? response.data : item))
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await menuAPI.delete(id);
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return {
    menuItems,
    categories,
    loading,
    error,
    refetch: fetchMenu,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
};