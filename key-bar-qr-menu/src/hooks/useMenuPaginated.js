import { useState, useEffect, useCallback, useRef } from "react";
import { menuAPI } from "../api/menu";
import { categoriesAPI } from "../api/categories";

export const useMenuPaginated = (itemsPerPage = 20) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState("all");
  
  const observerTarget = useRef(null);
  const abortControllerRef = useRef(null);
  const fetchMenuItemsRef = useRef(null);

  // Загружаем категории один раз
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll();
        setCategories(response.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Загружаем меню с учетом категории
  const fetchMenuItems = useCallback(async (page = 1, category = "all", reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Отменяем предыдущий запрос
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const params = {
        page,
        limit: itemsPerPage,
      };

      if (category !== "all") {
        params.category_id = category;
      }

      const response = await menuAPI.getPaginated(params);
      const { items, hasMore: hasMoreData } = response.data;

      if (reset) {
        setMenuItems(items);
      } else {
        setMenuItems((prev) => [...prev, ...items]);
      }

      setHasMore(hasMoreData);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [itemsPerPage]);

  // Сохраняем актуальную версию fetchMenuItems
  useEffect(() => {
    fetchMenuItemsRef.current = fetchMenuItems;
  }, [fetchMenuItems]);

  // Начальная загрузка - загружаем заново когда меняется категория
  useEffect(() => {
    fetchMenuItems(1, activeCategory, true);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]); // Только activeCategory, чтобы избежать лишних перезагрузок

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && fetchMenuItemsRef.current) {
          fetchMenuItemsRef.current(currentPage + 1, activeCategory, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, currentPage, activeCategory]);

  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
    setCurrentPage(1);
    setHasMore(true); // Сбрасываем флаг при смене категории
  }, []);

  return {
    menuItems,
    categories,
    loading,
    loadingMore,
    error,
    hasMore,
    activeCategory,
    setActiveCategory: handleCategoryChange,
    observerTarget,
    refetch: () => fetchMenuItems(1, activeCategory, true),
  };
};

