# 🎨 Design System - Key Bar Лофт Кафе

## 🎯 Концепция

Минималистичный лофт-стиль с теплой коричнево-оранжевой палитрой, создающий атмосферу уютного кафе с индустриальными элементами.

## 🌈 Цветовая палитра

### Основные цвета
```css
--primary: #8b4513         /* Коричневый - основной */
--primary-dark: #654321    /* Темно-коричневый */
--primary-light: #a0522d   /* Светло-коричневый */
--secondary: #cd853f       /* Перу (Peru) */
--accent: #d2691e          /* Шоколадный */
--accent-light: #ff8c00    /* Темно-оранжевый */
```

### Фоны
```css
--bg-main: #faf8f5         /* Основной фон (бежевый) */
--bg-secondary: #f5f3ef    /* Вторичный фон */
--bg-card: #ffffff         /* Карточки (белый) */
--bg-dark: #2c1810         /* Темный фон */
```

### Текст
```css
--text-primary: #2c1810    /* Основной текст */
--text-secondary: #5d4e37  /* Вторичный текст */
--text-muted: #8b7355      /* Приглушенный */
--text-light: #a89784      /* Светлый */
--text-white: #ffffff      /* Белый */
```

## 📏 Типографика

### Размеры заголовков
- h1: 2.5rem (40px)
- h2: 2rem (32px)
- h3: 1.5rem (24px)
- h4: 1.25rem (20px)
- h5: 1.125rem (18px)
- h6: 1rem (16px)

### Шрифты
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;
```

### Веса шрифтов
- Обычный: 400
- Средний: 500
- Полужирный: 600
- Жирный: 700
- Экстражирный: 800

## 🔲 Компоненты

### Кнопки
**Основная:**
- Фон: `#cd853f`
- Текст: белый
- Hover: `#d2691e`
- Тень: `0 4px 12px rgba(205, 133, 63, 0.3)`

**Вторичная:**
- Фон: белый
- Текст: `#8b4513`
- Граница: `2px solid #cd853f`
- Hover: инвертированные цвета

### Карточки
- Фон: белый
- Граница: `1px solid var(--border-light)`
- Радиус: `var(--radius-lg)` (16px)
- Тень: `var(--shadow)`
- Hover: поднятие на 4px

### Формы
- Граница: `1px solid var(--border-color)`
- Радиус: `var(--radius)` (8px)
- Padding: `12px 16px`
- Focus: граница `var(--accent)` + тень

## 📐 Отступы

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing: 16px
--spacing-md: 24px
--spacing-lg: 32px
--spacing-xl: 48px
--spacing-2xl: 64px
```

## 🌊 Тени

```css
--shadow-sm: 0 1px 2px rgba(44, 24, 16, 0.06)
--shadow: 0 2px 4px rgba(44, 24, 16, 0.08)
--shadow-md: 0 4px 8px rgba(44, 24, 16, 0.1)
--shadow-lg: 0 8px 16px rgba(44, 24, 16, 0.12)
--shadow-xl: 0 12px 24px rgba(44, 24, 16, 0.15)
```

## 🔄 Переходы

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition: 250ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1)
```

## 📱 Breakpoints

```css
Desktop: > 1024px
Tablet: 768px - 1024px
Mobile: 480px - 768px
Small: < 480px
```

## ✨ Анимации

### Используемые анимации
- **fadeIn** - плавное появление
- **slideIn** - появление сбоку
- **bounce** - подпрыгивание (умеренное)
- **pulse** - пульсация
- **spin** - вращение

### Применение
```css
.animate { animation: fadeIn 0.4s ease-out; }
```

## 🎨 Градиенты

```css
--gradient-primary: linear-gradient(135deg, #8b4513, #654321)
--gradient-secondary: linear-gradient(135deg, #cd853f, #d2691e)
--gradient-accent: linear-gradient(135deg, #d2691e, #ff8c00)
--gradient-success: linear-gradient(135deg, #2d8659, #3da66d)
--gradient-danger: linear-gradient(135deg, #b91c1c, #dc2626)
```

## 🧩 Специальные компоненты

### CartPreview
- **Позиция:** fixed, bottom: 24px, right: 24px
- **Z-index:** 1000
- **Фон:** gradient коричневый
- **Тень:** выраженная для заметности

### Footer
- **Фон:** #2c1810 (непрозрачный)
- **Отступ снизу:** 100px (для CartPreview)
- **На мобильных:** margin-bottom: 120px

## ⚡ Принципы дизайна

### Минимализм
- Чистые цвета без сложных наложений
- Простые переходы и анимации
- Умеренные тени
- Четкая типографика

### Опрятность
- Единая цветовая схема
- Консистентные отступы
- Читаемый текст
- Адаптивные размеры

### Производительность
- Системные шрифты
- Простые CSS переходы
- Минимум анимаций
- Оптимизированные селекторы

## 🎯 Рекомендации

### DO ✅
- Использовать CSS переменные
- Придерживаться цветовой палитры
- Использовать стандартные отступы
- Поддерживать адаптивность

### DON'T ❌
- Не добавлять случайные цвета
- Не использовать inline styles
- Не создавать сложные анимации
- Не забывать про мобильные устройства

