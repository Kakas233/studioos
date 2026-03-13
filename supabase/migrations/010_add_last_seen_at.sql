-- Add last_seen_at to accounts for tracking online users
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_seen_page TEXT;

CREATE INDEX IF NOT EXISTS accounts_last_seen_at ON accounts(last_seen_at) WHERE last_seen_at IS NOT NULL;
