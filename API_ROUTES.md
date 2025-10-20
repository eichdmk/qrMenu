# 🛣️ API Routes - Key Bar Backend

## 📋 Обзор

Всего в проекте **7 основных роутов** с **29 эндпоинтами**.

---

## 1️⃣ AUTH Routes (`/api/auth`)

### POST `/api/auth/login`
- **Описание:** Вход администратора
- **Доступ:** Публичный
- **Body:** `{ username, password }`
- **Response:** `{ token, user: { id, username, role } }`

**Итого: 1 эндпоинт**

---

## 2️⃣ CATEGORIES Routes (`/api/categories`)

### GET `/api/categories`
- **Описание:** Получить все категории
- **Доступ:** Публичный
- **Response:** `[{ id, name }]`

### POST `/api/categories`
- **Описание:** Создать категорию
- **Доступ:** Админ (требует токен)
- **Body:** `{ name }`
- **Response:** `{ id, name }`

### PUT `/api/categories/:id`
- **Описание:** Обновить категорию
- **Доступ:** Админ
- **Body:** `{ name }`
- **Response:** `{ id, name }`

### DELETE `/api/categories/:id`
- **Описание:** Удалить категорию
- **Доступ:** Админ
- **Response:** `{ message, deletedCategory }`

**Итого: 4 эндпоинта**

---

## 3️⃣ MENU Routes (`/api/menu`)

### GET `/api/menu`
- **Описание:** Получить все блюда меню
- **Доступ:** Публичный
- **Response:** `[{ id, category_id, name, description, price, image_url, available }]`

### GET `/api/menu/:id`
- **Описание:** Получить блюдо по ID
- **Доступ:** Публичный
- **Response:** `{ id, category_id, name, description, price, image_url, available }`

### POST `/api/menu`
- **Описание:** Создать блюдо (с загрузкой изображения)
- **Доступ:** Админ
- **Body (FormData):** `{ category_id, name, description, price, available, image }`
- **Response:** `{ id, category_id, name, description, price, image_url, available }`

### PUT `/api/menu/:id`
- **Описание:** Обновить блюдо (с загрузкой изображения)
- **Доступ:** Админ
- **Body (FormData):** `{ category_id, name, description, price, available, image }`
- **Response:** `{ id, category_id, name, description, price, image_url, available }`

### DELETE `/api/menu/:id`
- **Описание:** Удалить блюдо
- **Доступ:** Админ
- **Response:** `{ message, deletedItem }`

**Итого: 5 эндпоинтов**

---

## 4️⃣ ORDERS Routes (`/api/orders`)

### GET `/api/orders`
- **Описание:** Получить все заказы с деталями
- **Доступ:** Админ
- **Response:** `[{ id, table_id, table_name, order_type, customer_name, customer_phone, status, total_amount, created_at, items: [...] }]`

### POST `/api/orders`
- **Описание:** Создать заказ
- **Доступ:** Публичный
- **Body:** 
```json
{
  "table_id": 1,
  "order_type": "dine_in" | "takeaway",
  "customer_name": "Иван",
  "customer_phone": "+7...",
  "items": [
    { "menu_item_id": 1, "quantity": 2, "unit_price": 500 }
  ]
}
```
- **Response:** `{ id, table_id, order_type, status, total_amount, created_at }`

### PUT `/api/orders/:id`
- **Описание:** Обновить статус заказа
- **Доступ:** Админ
- **Body:** `{ status: "pending" | "preparing" | "ready" | "completed" | "cancelled" }`
- **Response:** `{ id, status, ... }`

**Итого: 3 эндпоинта**

---

## 5️⃣ RESERVATIONS Routes (`/api/reservations`)

### GET `/api/reservations`
- **Описание:** Получить все бронирования
- **Доступ:** Админ
- **Response:** `[{ id, table_id, table_name, customer_name, customer_phone, start_at, end_at, status }]`

### GET `/api/reservations/:id`
- **Описание:** Получить бронирование по ID
- **Доступ:** Админ
- **Response:** `{ id, table_id, customer_name, customer_phone, start_at, end_at, status }`

### POST `/api/reservations`
- **Описание:** Создать бронирование
- **Доступ:** Публичный
- **Body:** `{ table_id, customer_name, customer_phone, start_at, end_at }`
- **Response:** `{ id, table_id, customer_name, customer_phone, start_at, end_at, status }`

### PUT `/api/reservations/:id`
- **Описание:** Обновить бронирование
- **Доступ:** Админ
- **Body:** `{ table_id, customer_name, customer_phone, start_at, end_at, status }`
- **Response:** `{ id, ... }`

### PATCH `/api/reservations/:id/status`
- **Описание:** Обновить статус бронирования
- **Доступ:** Админ
- **Body:** `{ status: "pending" | "confirmed" | "cancelled" | "completed" }`
- **Response:** `{ id, status, ... }`

### DELETE `/api/reservations/:id`
- **Описание:** Удалить бронирование
- **Доступ:** Админ
- **Response:** `{ message, deletedReservation }`

**Итого: 6 эндпоинтов**

---

## 6️⃣ TABLES Routes (`/api/tables`)

### GET `/api/tables`
- **Описание:** Получить все столики
- **Доступ:** Админ
- **Response:** `[{ id, name, seats, qr_token, is_occupied }]`

### GET `/api/tables/availability`
- **Описание:** Получить столики с информацией о доступности
- **Доступ:** Публичный
- **Response:** `[{ id, name, seats, is_available, availability_reason, active_orders_count, active_reservations_count }]`

### GET `/api/tables/id/:id`
- **Описание:** Получить столик по ID
- **Доступ:** Админ
- **Response:** `{ id, name, seats, qr_token, is_occupied }`

### GET `/api/tables/:token`
- **Описание:** Получить столик по QR-токену
- **Доступ:** Публичный (для QR-кодов)
- **Response:** `{ id, name, seats, qr_token }`

### POST `/api/tables`
- **Описание:** Создать столик
- **Доступ:** Админ
- **Body:** `{ name, seats }`
- **Response:** `{ id, name, seats, qr_token, is_occupied }`

### PUT `/api/tables/:id`
- **Описание:** Обновить столик
- **Доступ:** Админ
- **Body:** `{ name, seats }`
- **Response:** `{ id, name, seats, qr_token, is_occupied }`

### PATCH `/api/tables/:id/status`
- **Описание:** Обновить статус занятости столика
- **Доступ:** Админ
- **Body:** `{ is_occupied: true | false }`
- **Response:** `{ id, is_occupied, ... }`

### DELETE `/api/tables/:id`
- **Описание:** Удалить столик
- **Доступ:** Админ
- **Response:** `{ message, deletedTable }`

**Итого: 8 эндпоинтов**

---

## 7️⃣ UPLOAD Routes (`/api/upload`)

### POST `/api/upload`
- **Описание:** Загрузить изображение
- **Доступ:** Админ
- **Body (FormData):** `{ image: File }`
- **Response:** `{ image_url: "/uploads/filename.jpg" }`

### DELETE `/api/upload/:filename`
- **Описание:** Удалить изображение
- **Доступ:** Админ
- **Response:** `{ message: "Изображение удалено" }`

**Итого: 2 эндпоинта**

---

## 📊 Статистика

### По модулям:
- 🔐 **Auth:** 1 эндпоинт
- 🏷️ **Categories:** 4 эндпоинта
- 🍽️ **Menu:** 5 эндпоинтов
- 📦 **Orders:** 3 эндпоинта
- 📅 **Reservations:** 6 эндпоинтов
- 🪑 **Tables:** 8 эндпоинтов
- 📤 **Upload:** 2 эндпоинта

### По доступу:
- 🔓 **Публичные:** 10 эндпоинтов
- 🔐 **Админ:** 19 эндпоинтов

### По методам:
- **GET:** 13 эндпоинтов
- **POST:** 7 эндпоинтов
- **PUT:** 4 эндпоинта
- **PATCH:** 3 эндпоинта
- **DELETE:** 5 эндпоинтов

---

## 🔐 Авторизация

### Публичные эндпоинты:
- `POST /api/auth/login` - вход
- `GET /api/categories` - список категорий
- `GET /api/menu` - список блюд
- `GET /api/menu/:id` - блюдо по ID
- `POST /api/orders` - создать заказ
- `POST /api/reservations` - создать бронь
- `GET /api/tables/availability` - доступность столиков
- `GET /api/tables/:token` - столик по QR-токену

### Защищенные (требуют токен + роль админ):
- Все остальные эндпоинты

### Middleware:
- `authenticateToken` - проверка JWT токена
- `isAdmin` - проверка роли администратора

---

## 📝 Примечания

### Загрузка изображений:
- Используется **multer** для обработки multipart/form-data
- Изображения сохраняются в `/backend/uploads/`
- Статические файлы доступны по `/uploads/:filename`

### Валидация:
- Проверка существования столика при бронировании
- Проверка доступности столика
- Проверка активных заказов перед удалением
- Проверка связанных данных перед удалением

### Безопасность:
- JWT токены для авторизации
- Роли пользователей (admin)
- Хеширование паролей (bcryptjs)
- Валидация входных данных

---

## 🎯 Итого

**Всего в проекте: 29 эндпоинтов в 7 модулях**

Полный REST API для управления рестораном с QR-меню! 🎉

