BEGIN;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32) NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_id VARCHAR(128),
  ADD COLUMN IF NOT EXISTS payment_confirmation_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_payment_method_check,
  DROP CONSTRAINT IF EXISTS reservations_payment_status_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_payment_method_check CHECK (payment_method IN ('cash','card')),
  ADD CONSTRAINT reservations_payment_status_check CHECK (
    payment_status IN ('unpaid','pending','succeeded','canceled','refunded')
  ),
  ADD CONSTRAINT reservations_total_amount_check CHECK (total_amount >= 0);

CREATE TABLE IF NOT EXISTS reservation_items (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation_id ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_menu_item_id ON reservation_items(menu_item_id);

COMMIT;

