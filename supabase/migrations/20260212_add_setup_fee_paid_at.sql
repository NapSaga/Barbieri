-- Add setup_fee_paid_at timestamp for analytics and refund tracking
ALTER TABLE businesses ADD COLUMN setup_fee_paid_at timestamptz;
