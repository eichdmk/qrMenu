BEGIN;

-- Расширения
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid

-- Пользователи админ-панели
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'admin', 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Категории меню
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT categories_name_key UNIQUE (name)
);

-- Позиции меню
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Обновление поля updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'menu_items_set_updated_at'
  ) THEN
    CREATE TRIGGER menu_items_set_updated_at
      BEFORE UPDATE ON menu_items
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

-- Столики в зале
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    seats SMALLINT NOT NULL DEFAULT 2 CHECK (seats > 0),
    is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tables_name_key UNIQUE (name),
    CONSTRAINT tables_token_key UNIQUE (token),
    CONSTRAINT tables_name_not_blank CHECK (btrim(name) <> '')
);

-- Бронирования
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reservations_time_check CHECK (start_at < end_at),
    CONSTRAINT reservations_status_check CHECK (status IN ('pending','confirmed','cancelled','completed'))
);

-- Заказы
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
    order_type VARCHAR(32) NOT NULL DEFAULT 'dine_in',
    customer_name VARCHAR(120),
    customer_phone VARCHAR(32),
    comment TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT orders_status_check CHECK (status IN ('pending','preparing','ready','completed','cancelled')),
    CONSTRAINT orders_type_check CHECK (order_type IN ('dine_in','takeaway')),
    CONSTRAINT orders_total_amount_check CHECK (total_amount >= 0)
);

-- Позиции заказов
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    item_comment TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key ON categories(name);
CREATE UNIQUE INDEX IF NOT EXISTS tables_name_key ON tables(name);
CREATE UNIQUE INDEX IF NOT EXISTS tables_token_key ON tables(token);

-- Опорные индексы
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_tables_token ON tables(token);
CREATE INDEX IF NOT EXISTS idx_reservations_table_time ON reservations(table_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_reservation_id ON orders(reservation_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Функция проверки доступности столика
CREATE OR REPLACE FUNCTION is_table_available(p_table_id INTEGER, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INT;
BEGIN
    -- Столик должен существовать и быть свободным
    IF NOT EXISTS (
        SELECT 1 FROM tables
        WHERE id = p_table_id AND is_occupied = FALSE
    ) THEN
        RETURN FALSE;
    END IF;

    -- Проверяем активные заказы
    IF EXISTS (
        SELECT 1 FROM orders
        WHERE table_id = p_table_id
          AND status NOT IN ('completed', 'cancelled')
    ) THEN
        RETURN FALSE;
    END IF;

    -- Проверяем конфликтующие бронирования
    SELECT COUNT(*) INTO conflict_count
    FROM reservations
    WHERE table_id = p_table_id
      AND status IN ('pending', 'confirmed')
      AND NOT (end_at <= p_start OR start_at >= p_end);

    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Первичные данные (idempotent)
INSERT INTO categories (name)
VALUES ('Закуски'), ('Основные блюда'), ('Десерты'), ('Напитки')
ON CONFLICT (name) DO NOTHING;

INSERT INTO tables (name, seats)
VALUES ('1', 4), ('2', 4), ('3', 2), ('4', 2)
ON CONFLICT (name) DO NOTHING;

COMMIT;
