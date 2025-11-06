import { useState, useEffect, useCallback, useMemo } from "react";
import { menuAPI} from "../api/menu";
import {categoriesAPI } from '../api/categories'

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const [menuRes, categoriesRes] = await Promise.all([
        menuAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setMenuItems(menuRes.data);
      setCategories(categoriesRes.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMenuItem = useCallback(async (data) => {
    try {
      const response = await menuAPI.create(data);
      setMenuItems((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateMenuItem = useCallback(async (id, data) => {
    try {
      const response = await menuAPI.update(id, data);
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? response.data : item))
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteMenuItem = useCallback(async (id) => {
    try {
      await menuAPI.delete(id);
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const categoriesMap = useMemo(() => {
    const map = new Map();
    categories.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  return {
    menuItems,
    categories,
    categoriesMap,
    loading,
    error,
    refetch: fetchMenu,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
};