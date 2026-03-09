-- Migration: Additional tables for API routes
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- ============================================
-- 1. Sessions table (super admin sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_account_id ON sessions(account_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can access sessions (used by API routes with admin client)
CREATE POLICY "Service role full access on sessions"
  ON sessions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 2. Email verifications table (2FA codes)
-- ============================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  studio_id TEXT NOT NULL DEFAULT '',
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);

-- RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_verifications"
  ON email_verifications FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 3. Support tickets table (AI support chat)
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  account_name TEXT,
  account_email TEXT,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_agent TEXT DEFAULT 'luke',
  messages JSONB DEFAULT '[]'::jsonb,
  is_escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  rating INTEGER,
  rating_feedback TEXT,
  resolved_at TIMESTAMPTZ,
  created_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_support_tickets_studio_id ON support_tickets(studio_id);
CREATE INDEX idx_support_tickets_account_id ON support_tickets(account_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can see their own tickets
CREATE POLICY "Users can view own support tickets"
  ON support_tickets FOR SELECT
  USING (account_id = auth.uid()::uuid);

-- Users can create tickets
CREATE POLICY "Users can create support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (account_id = auth.uid()::uuid);

-- Service role full access (for API routes)
CREATE POLICY "Service role full access on support_tickets"
  ON support_tickets FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 4. Telegram links table
-- ============================================
CREATE TABLE IF NOT EXISTS telegram_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  chat_id TEXT,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_telegram_links_account_id ON telegram_links(account_id);
CREATE INDEX idx_telegram_links_token ON telegram_links(token);
CREATE INDEX idx_telegram_links_chat_id ON telegram_links(chat_id);
CREATE INDEX idx_telegram_links_studio_id ON telegram_links(studio_id);

-- RLS
ALTER TABLE telegram_links ENABLE ROW LEVEL SECURITY;

-- Users can see their own telegram links
CREATE POLICY "Users can view own telegram links"
  ON telegram_links FOR SELECT
  USING (account_id = auth.uid()::uuid);

-- Service role full access
CREATE POLICY "Service role full access on telegram_links"
  ON telegram_links FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 5. Add missing columns to accounts table
-- ============================================
DO $$
BEGIN
  -- password_hash for super admin login
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'password_hash') THEN
    ALTER TABLE accounts ADD COLUMN password_hash TEXT;
  END IF;

  -- is_super_admin flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'is_super_admin') THEN
    ALTER TABLE accounts ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
  END IF;

  -- onboarding_completed
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE accounts ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;

  -- onboarding_steps
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'onboarding_steps') THEN
    ALTER TABLE accounts ADD COLUMN onboarding_steps JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- weekly_goal_enabled
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'weekly_goal_enabled') THEN
    ALTER TABLE accounts ADD COLUMN weekly_goal_enabled BOOLEAN DEFAULT false;
  END IF;

  -- weekly_goal_hours
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'weekly_goal_hours') THEN
    ALTER TABLE accounts ADD COLUMN weekly_goal_hours INTEGER DEFAULT 40;
  END IF;

  -- works_alone (solo model flag)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'works_alone') THEN
    ALTER TABLE accounts ADD COLUMN works_alone BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- 6. Updated_at triggers for new tables
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_telegram_links_updated_at ON telegram_links;
CREATE TRIGGER update_telegram_links_updated_at
  BEFORE UPDATE ON telegram_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
