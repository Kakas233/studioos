-- Fix support_tickets table: migration 001 created it with minimal columns,
-- migration 003's CREATE TABLE IF NOT EXISTS was a no-op.
-- Add all missing columns that the support chat API expects.

-- Add missing columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'account_name') THEN
    ALTER TABLE support_tickets ADD COLUMN account_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'account_email') THEN
    ALTER TABLE support_tickets ADD COLUMN account_email TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'category') THEN
    ALTER TABLE support_tickets ADD COLUMN category TEXT DEFAULT 'general';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'assigned_agent') THEN
    ALTER TABLE support_tickets ADD COLUMN assigned_agent TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'escalated_at') THEN
    ALTER TABLE support_tickets ADD COLUMN escalated_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'escalation_reason') THEN
    ALTER TABLE support_tickets ADD COLUMN escalation_reason TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'resolved_at') THEN
    ALTER TABLE support_tickets ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'created_date') THEN
    ALTER TABLE support_tickets ADD COLUMN created_date TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'updated_date') THEN
    ALTER TABLE support_tickets ADD COLUMN updated_date TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Make studio_id nullable (chat API passes empty string for edge cases)
ALTER TABLE support_tickets ALTER COLUMN studio_id DROP NOT NULL;
ALTER TABLE support_tickets ALTER COLUMN account_id DROP NOT NULL;

-- Add index on account_id if missing
CREATE INDEX IF NOT EXISTS idx_support_tickets_account_id ON support_tickets(account_id);
