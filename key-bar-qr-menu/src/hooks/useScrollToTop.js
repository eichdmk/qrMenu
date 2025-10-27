import { useEffect } from 'react';

/**
 * Хук для автоматического скролла наверх при загрузке страницы
 * @param {boolean} enabled - Включить ли скролл наверх (по умолчанию true)
 * @param {string} behavior - Поведение скролла: 'smooth' или 'instant' (по умолчанию 'smooth')
 */
export const useScrollToTop = (enabled = true, behavior = 'smooth') => {
  useEffect(() => {
    if (enabled) {
      window.scrollTo({ top: 0, behavior });
    }
  }, [enabled, behavior]);
};

/**
 * Хук для скролла наверх при изменении определенного значения
 * @param {any} dependency - Зависимость, при изменении которой происходит скролл
 * @param {string} behavior - Поведение скролла: 'smooth' или 'instant' (по умолчанию 'smooth')
 */
export const useScrollToTopOnChange = (dependency, behavior = 'smooth') => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior });
  }, [dependency, behavior]);
};
