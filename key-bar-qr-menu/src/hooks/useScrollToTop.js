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

/**
 * Хук для скролла к определенному элементу при изменении зависимости
 * @param {any} dependency - Зависимость, при изменении которой происходит скролл
 * @param {string|React.RefObject} selector - Селектор элемента (например, "#menu") или ref объект
 * @param {string} behavior - Поведение скролла: 'smooth' или 'instant' (по умолчанию 'smooth')
 * @param {number} offset - Смещение в пикселях вверх от элемента (по умолчанию 0)
 */
export const useScrollToElementOnChange = (dependency, selector, behavior = 'smooth', offset = 0) => {
  useEffect(() => {
    // Используем requestAnimationFrame для точного расчета позиции после обновления DOM
    const scrollToElement = () => {
      let element = null;
      
      if (typeof selector === 'string') {
        // Если селектор - строка, ищем элемент по id или селектору
        const idSelector = selector.startsWith('#') ? selector : `#${selector}`;
        element = document.querySelector(idSelector);
      } else if (selector && selector.current) {
        // Если селектор - ref объект
        element = selector.current;
      }
      
      if (element) {
        if (offset > 0) {
          // Если есть offset, используем window.scrollTo с расчетом позиции
          const rect = element.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          const offsetPosition = elementTop - offset;
          window.scrollTo({ top: Math.max(0, offsetPosition), behavior });
        } else {
          // Без offset используем стандартный scrollIntoView
          element.scrollIntoView({ behavior, block: 'start' });
        }
      }
    };
    
    // Двойной requestAnimationFrame для гарантии, что DOM обновлен
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Небольшая задержка для завершения рендера данных
        setTimeout(scrollToElement, 150);
      });
    });
  }, [dependency, selector, behavior, offset]);
};
