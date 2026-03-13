-- Add payment tracking columns to studios (used by super admin subscription management)
ALTER TABLE studios ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ;

-- Add alert_type to member_alerts for distinguishing room_member vs online_tracking alerts
ALTER TABLE member_alerts ADD COLUMN IF NOT EXISTS alert_type TEXT DEFAULT 'room_member';
