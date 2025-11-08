-- Add new payment-related fields and extend order type options
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32) NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_id VARCHAR(128),
  ADD COLUMN IF NOT EXISTS payment_confirmation_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Allow new payment status and method values
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check,
  DROP CONSTRAINT IF EXISTS orders_payment_status_check,
  DROP CONSTRAINT IF EXISTS orders_type_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cash','card')),
  ADD CONSTRAINT orders_payment_status_check CHECK (
    payment_status IN ('unpaid','pending','succeeded','canceled','refunded')
  ),
  ADD CONSTRAINT orders_type_check CHECK (order_type IN ('dine_in','takeaway','delivery'));

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

