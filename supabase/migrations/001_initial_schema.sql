-- =============================================
-- StudioOS Database Schema — Full Migration
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- =============================================
-- 1. EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 2. CUSTOM ENUMS
-- =============================================
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'operator', 'model', 'accountant');
CREATE TYPE shift_status AS ENUM ('scheduled', 'in_progress', 'completed', 'no_show', 'cancelled', 'pending_approval');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'elite');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'cancelled', 'past_due', 'suspended', 'grace_period');
CREATE TYPE fetch_job_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE exchange_rate_mode AS ENUM ('manual', 'auto');
CREATE TYPE channel_type AS ENUM ('general', 'models_only', 'operators_only', 'custom');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE audit_event_type AS ENUM ('create', 'update', 'delete');

-- =============================================
-- 3. TABLES
-- =============================================

-- ──────────────────────────────────────────────
-- STUDIOS — top-level tenant
-- ──────────────────────────────────────────────
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'UTC',
  primary_currency TEXT NOT NULL DEFAULT 'USD',
  secondary_currency TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  subscription_status subscription_status NOT NULL DEFAULT 'trialing',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  model_limit INTEGER NOT NULL DEFAULT 1,
  current_model_count INTEGER NOT NULL DEFAULT 0,
  grace_period_ends_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- ACCOUNTS — app-level user linked to auth.users
-- ──────────────────────────────────────────────
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  role user_role NOT NULL DEFAULT 'model',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  works_alone BOOLEAN NOT NULL DEFAULT FALSE,
  cut_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  operator_cut_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  weekly_goal_hours NUMERIC(5,2),
  weekly_goal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payout_method TEXT NOT NULL DEFAULT 'cash',
  onboarding_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed_steps TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX accounts_auth_user_studio ON accounts(auth_user_id, studio_id);
CREATE INDEX accounts_studio_id ON accounts(studio_id);
CREATE INDEX accounts_email ON accounts(email);

-- ──────────────────────────────────────────────
-- ROOMS
-- ──────────────────────────────────────────────
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX rooms_studio_id ON rooms(studio_id);

-- ──────────────────────────────────────────────
-- CAM ACCOUNTS — platform profiles for models
-- ──────────────────────────────────────────────
CREATE TABLE cam_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX cam_accounts_studio_id ON cam_accounts(studio_id);
CREATE INDEX cam_accounts_model_id ON cam_accounts(model_id);
CREATE UNIQUE INDEX cam_accounts_platform_username ON cam_accounts(platform, username);

-- ──────────────────────────────────────────────
-- SHIFTS
-- ──────────────────────────────────────────────
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES accounts(id),
  room_id UUID REFERENCES rooms(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status shift_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shifts_time_check CHECK (end_time > start_time)
);

CREATE INDEX shifts_studio_id ON shifts(studio_id);
CREATE INDEX shifts_model_id ON shifts(model_id);
CREATE INDEX shifts_start_time ON shifts(start_time);

-- ──────────────────────────────────────────────
-- SHIFT REQUESTS
-- ──────────────────────────────────────────────
CREATE TABLE shift_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  preferred_room_id UUID REFERENCES rooms(id),
  status request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX shift_requests_studio_id ON shift_requests(studio_id);

-- ──────────────────────────────────────────────
-- SHIFT CHANGE REQUESTS
-- ──────────────────────────────────────────────
CREATE TABLE shift_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  requested_by_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  old_data JSONB NOT NULL DEFAULT '{}',
  new_data JSONB NOT NULL DEFAULT '{}',
  status request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX shift_change_requests_studio_id ON shift_change_requests(studio_id);

-- ──────────────────────────────────────────────
-- ASSIGNMENTS (operator ↔ model)
-- ──────────────────────────────────────────────
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX assignments_studio_id ON assignments(studio_id);
CREATE UNIQUE INDEX assignments_operator_model ON assignments(operator_id, model_id);

-- ──────────────────────────────────────────────
-- EARNINGS — per-model, per-day financial records
-- All _huf fields renamed to _secondary (fix #7)
-- ──────────────────────────────────────────────
CREATE TABLE earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  cam_account_id UUID REFERENCES cam_accounts(id),
  shift_id UUID REFERENCES shifts(id),
  shift_date DATE NOT NULL,
  total_gross_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  studio_cut_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  model_pay_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  operator_pay_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_gross_secondary NUMERIC(12,2) NOT NULL DEFAULT 0,
  model_pay_secondary NUMERIC(12,2) NOT NULL DEFAULT 0,
  operator_pay_secondary NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Per-platform USD breakdowns
  myfreecams_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  chaturbate_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  stripchat_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  bongacams_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  cam4_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  camsoda_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  flirt4free_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  livejasmin_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  onlyfans_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_estimated BOOLEAN NOT NULL DEFAULT FALSE,
  operator_id UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX earnings_studio_id ON earnings(studio_id);
CREATE INDEX earnings_model_date ON earnings(model_id, shift_date);
CREATE INDEX earnings_studio_date ON earnings(studio_id, shift_date);

-- ──────────────────────────────────────────────
-- PAYOUTS
-- ──────────────────────────────────────────────
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_secondary NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payout_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX payouts_studio_id ON payouts(studio_id);
CREATE INDEX payouts_model_id ON payouts(model_id);

-- ──────────────────────────────────────────────
-- GLOBAL SETTINGS — one per studio
-- ──────────────────────────────────────────────
CREATE TABLE global_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL UNIQUE REFERENCES studios(id) ON DELETE CASCADE,
  secondary_currency TEXT NOT NULL DEFAULT 'EUR',
  exchange_rate NUMERIC(12,4) NOT NULL DEFAULT 1.0,
  exchange_rate_mode exchange_rate_mode NOT NULL DEFAULT 'manual',
  payout_frequency TEXT NOT NULL DEFAULT 'biweekly',
  myfreecams_rate NUMERIC(8,4) NOT NULL DEFAULT 0.05,
  chaturbate_rate NUMERIC(8,4) NOT NULL DEFAULT 0.05,
  stripchat_rate NUMERIC(8,4) NOT NULL DEFAULT 0.05,
  bongacams_rate NUMERIC(8,4) NOT NULL DEFAULT 0.05,
  cam4_rate NUMERIC(8,4) NOT NULL DEFAULT 0.05,
  camsoda_rate NUMERIC(8,4) NOT NULL DEFAULT 0.05,
  flirt4free_rate NUMERIC(8,4) NOT NULL DEFAULT 0.05,
  livejasmin_rate NUMERIC(8,4) NOT NULL DEFAULT 0.05,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- STREAMING SESSIONS — live status (Realtime enabled)
-- ──────────────────────────────────────────────
CREATE TABLE streaming_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  cam_account_id UUID NOT NULL REFERENCES cam_accounts(id) ON DELETE CASCADE,
  is_currently_live BOOLEAN NOT NULL DEFAULT FALSE,
  show_type TEXT NOT NULL DEFAULT 'offline',
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX streaming_sessions_studio_id ON streaming_sessions(studio_id);
CREATE INDEX streaming_sessions_cam_account ON streaming_sessions(cam_account_id);

-- ──────────────────────────────────────────────
-- DAILY STREAM STATS — aggregated per model/platform/day
-- ──────────────────────────────────────────────
CREATE TABLE daily_stream_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  cam_account_id UUID NOT NULL REFERENCES cam_accounts(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  total_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  unique_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  -- Granular show-type breakdowns
  free_chat_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  private_chat_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  nude_chat_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  member_chat_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  group_chat_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  semiprivate_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  vip_chat_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  happy_hour_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  party_chat_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  pre_gold_show_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  gold_show_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  true_private_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  paid_chat_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  away_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  break_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX daily_stream_stats_studio_date ON daily_stream_stats(studio_id, date);
CREATE INDEX daily_stream_stats_model_date ON daily_stream_stats(model_id, date);
CREATE UNIQUE INDEX daily_stream_stats_unique ON daily_stream_stats(cam_account_id, date, platform);

-- ──────────────────────────────────────────────
-- STREAM SEGMENTS — individual streaming blocks
-- ──────────────────────────────────────────────
CREATE TABLE stream_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  cam_account_id UUID NOT NULL REFERENCES cam_accounts(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  date DATE NOT NULL,
  duration_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  show_type TEXT NOT NULL DEFAULT 'free_chat',
  source TEXT NOT NULL DEFAULT 'scraper',
  platform TEXT NOT NULL,
  tokens_earned INTEGER NOT NULL DEFAULT 0,
  usd_earned NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX stream_segments_studio_date ON stream_segments(studio_id, date);
CREATE INDEX stream_segments_model_date ON stream_segments(model_id, date);
CREATE INDEX stream_segments_cam_account_date ON stream_segments(cam_account_id, date);

-- ──────────────────────────────────────────────
-- SHIFT ANALYSES — shift adherence reports
-- ──────────────────────────────────────────────
CREATE TABLE shift_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  shift_date DATE NOT NULL,
  adherence_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  late_start_minutes NUMERIC(6,2) NOT NULL DEFAULT 0,
  early_end_minutes NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_online_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_break_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  segment_count INTEGER NOT NULL DEFAULT 0,
  platforms_used TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX shift_analyses_studio_id ON shift_analyses(studio_id);
CREATE INDEX shift_analyses_model_date ON shift_analyses(model_id, shift_date);

-- ──────────────────────────────────────────────
-- DATA FETCH JOBS — historical data import tracking
-- ──────────────────────────────────────────────
CREATE TABLE data_fetch_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  cam_account_id UUID NOT NULL REFERENCES cam_accounts(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  status fetch_job_status NOT NULL DEFAULT 'pending',
  target_days INTEGER NOT NULL DEFAULT 30,
  total_pages INTEGER,
  pages_fetched INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX data_fetch_jobs_studio_id ON data_fetch_jobs(studio_id);

-- ──────────────────────────────────────────────
-- MEMBER ALERTS
-- ──────────────────────────────────────────────
CREATE TABLE member_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  cam_account_id UUID NOT NULL REFERENCES cam_accounts(id) ON DELETE CASCADE,
  model_username TEXT NOT NULL,
  model_name TEXT NOT NULL,
  sites TEXT[] NOT NULL DEFAULT '{}',
  spending_threshold NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX member_alerts_studio_id ON member_alerts(studio_id);

-- ──────────────────────────────────────────────
-- CHAT CHANNELS
-- ──────────────────────────────────────────────
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel_type channel_type NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chat_channels_studio_id ON chat_channels(studio_id);

-- ──────────────────────────────────────────────
-- CHAT MESSAGES (Realtime enabled)
-- ──────────────────────────────────────────────
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role user_role NOT NULL,
  message_text TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX chat_messages_studio_id ON chat_messages(studio_id);
CREATE INDEX chat_messages_created_at ON chat_messages(created_at);

-- ──────────────────────────────────────────────
-- SUPPORT TICKETS
-- ──────────────────────────────────────────────
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  is_escalated BOOLEAN NOT NULL DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX support_tickets_studio_id ON support_tickets(studio_id);
CREATE INDEX support_tickets_status ON support_tickets(status);

-- ──────────────────────────────────────────────
-- AUDIT LOGS — auto-populated by triggers
-- ──────────────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  event_type audit_event_type NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  actor_email TEXT NOT NULL DEFAULT '',
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_studio_id ON audit_logs(studio_id);
CREATE INDEX audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ──────────────────────────────────────────────
-- ERROR LOGS — for error tracking (fix #6)
-- ──────────────────────────────────────────────
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL DEFAULT 'unknown',
  message TEXT NOT NULL,
  stack_trace TEXT,
  url TEXT,
  user_agent TEXT,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX error_logs_studio_id ON error_logs(studio_id);
CREATE INDEX error_logs_created_at ON error_logs(created_at);
CREATE INDEX error_logs_error_type ON error_logs(error_type);

-- =============================================
-- 4. HELPER FUNCTIONS
-- =============================================

-- Get the studio_id for the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_studio_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT studio_id
  FROM accounts
  WHERE auth_user_id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;
$$;

-- Get the role for the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM accounts
  WHERE auth_user_id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;
$$;

-- Get the account id for the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id
  FROM accounts
  WHERE auth_user_id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;
$$;

-- Check if the current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin
     FROM accounts
     WHERE auth_user_id = auth.uid()
       AND is_active = TRUE
     LIMIT 1),
    FALSE
  );
$$;

-- Check if the current user has admin-level access (owner or admin)
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role IN ('owner', 'admin')
     FROM accounts
     WHERE auth_user_id = auth.uid()
       AND is_active = TRUE
     LIMIT 1),
    FALSE
  );
$$;

-- Increment model count for a studio
CREATE OR REPLACE FUNCTION increment_model_count(p_studio_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE studios
  SET current_model_count = current_model_count + 1
  WHERE id = p_studio_id;
END;
$$;

-- =============================================
-- 5. AUTOMATIC updated_at TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'updated_at'
      AND table_name NOT IN ('audit_logs', 'error_logs')
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t
    );
  END LOOP;
END;
$$;

-- Composite indexes for common query patterns
CREATE INDEX idx_earnings_studio_model_date ON earnings(studio_id, model_id, shift_date);
CREATE INDEX idx_shifts_studio_start ON shifts(studio_id, start_time);
CREATE INDEX idx_chat_messages_channel_created ON chat_messages(channel_id, created_at);
CREATE INDEX idx_support_tickets_studio_status ON support_tickets(studio_id, status);
CREATE INDEX idx_daily_stream_stats_studio_date ON daily_stream_stats(studio_id, date);

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE cam_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stream_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_fetch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- STUDIOS policies
-- ──────────────────────────────────────────────
-- Users can read their own studio
CREATE POLICY "studios_select_own" ON studios
  FOR SELECT USING (id = get_user_studio_id() OR is_super_admin());

-- Only super admins can see all studios
CREATE POLICY "studios_select_super" ON studios
  FOR SELECT USING (is_super_admin());

-- Studio can be updated by admin/owner of that studio
CREATE POLICY "studios_update_own" ON studios
  FOR UPDATE USING (id = get_user_studio_id() AND is_admin_or_owner());

-- Studios are created via service role (signup flow), not directly by users
-- No INSERT policy for regular users

-- ──────────────────────────────────────────────
-- ACCOUNTS policies
-- ──────────────────────────────────────────────
CREATE POLICY "accounts_select_own_studio" ON accounts
  FOR SELECT USING (studio_id = get_user_studio_id() OR is_super_admin());

CREATE POLICY "accounts_insert_admin" ON accounts
  FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());

CREATE POLICY "accounts_update_own_studio" ON accounts
  FOR UPDATE USING (
    studio_id = get_user_studio_id()
    AND (is_admin_or_owner() OR id = get_user_account_id())
  );

CREATE POLICY "accounts_delete_admin" ON accounts
  FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- ──────────────────────────────────────────────
-- Standard studio-scoped policies (read/write own studio)
-- Applied to: rooms, cam_accounts, shifts, shift_requests,
--   shift_change_requests, assignments, earnings, payouts,
--   global_settings, streaming_sessions, daily_stream_stats,
--   stream_segments, shift_analyses, data_fetch_jobs,
--   member_alerts, chat_channels, chat_messages, support_tickets
-- ──────────────────────────────────────────────

-- Helper: create all 4 CRUD policies for a studio-scoped table
-- We'll do each table explicitly for clarity

-- ROOMS
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "rooms_delete" ON rooms FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- CAM ACCOUNTS
CREATE POLICY "cam_accounts_select" ON cam_accounts FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "cam_accounts_insert" ON cam_accounts FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "cam_accounts_update" ON cam_accounts FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "cam_accounts_delete" ON cam_accounts FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- SHIFTS
CREATE POLICY "shifts_select" ON shifts FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "shifts_insert" ON shifts FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "shifts_update" ON shifts FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "shifts_delete" ON shifts FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- SHIFT REQUESTS
CREATE POLICY "shift_requests_select" ON shift_requests FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "shift_requests_insert" ON shift_requests FOR INSERT WITH CHECK (studio_id = get_user_studio_id());
CREATE POLICY "shift_requests_update" ON shift_requests FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "shift_requests_delete" ON shift_requests FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- SHIFT CHANGE REQUESTS
CREATE POLICY "shift_change_requests_select" ON shift_change_requests FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "shift_change_requests_insert" ON shift_change_requests FOR INSERT WITH CHECK (studio_id = get_user_studio_id());
CREATE POLICY "shift_change_requests_update" ON shift_change_requests FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "shift_change_requests_delete" ON shift_change_requests FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- ASSIGNMENTS
CREATE POLICY "assignments_select" ON assignments FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "assignments_insert" ON assignments FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "assignments_update" ON assignments FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "assignments_delete" ON assignments FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- EARNINGS
CREATE POLICY "earnings_select" ON earnings FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "earnings_insert" ON earnings FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "earnings_update" ON earnings FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "earnings_delete" ON earnings FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- PAYOUTS
CREATE POLICY "payouts_select" ON payouts FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "payouts_insert" ON payouts FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "payouts_update" ON payouts FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "payouts_delete" ON payouts FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- GLOBAL SETTINGS
CREATE POLICY "global_settings_select" ON global_settings FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "global_settings_insert" ON global_settings FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "global_settings_update" ON global_settings FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- STREAMING SESSIONS
CREATE POLICY "streaming_sessions_select" ON streaming_sessions FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "streaming_sessions_insert" ON streaming_sessions FOR INSERT WITH CHECK (studio_id = get_user_studio_id());
CREATE POLICY "streaming_sessions_update" ON streaming_sessions FOR UPDATE USING (studio_id = get_user_studio_id());

-- DAILY STREAM STATS
CREATE POLICY "daily_stream_stats_select" ON daily_stream_stats FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "daily_stream_stats_insert" ON daily_stream_stats FOR INSERT WITH CHECK (studio_id = get_user_studio_id());
CREATE POLICY "daily_stream_stats_update" ON daily_stream_stats FOR UPDATE USING (studio_id = get_user_studio_id());

-- STREAM SEGMENTS
CREATE POLICY "stream_segments_select" ON stream_segments FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "stream_segments_insert" ON stream_segments FOR INSERT WITH CHECK (studio_id = get_user_studio_id());
CREATE POLICY "stream_segments_update" ON stream_segments FOR UPDATE USING (studio_id = get_user_studio_id());

-- SHIFT ANALYSES
CREATE POLICY "shift_analyses_select" ON shift_analyses FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "shift_analyses_insert" ON shift_analyses FOR INSERT WITH CHECK (studio_id = get_user_studio_id());
CREATE POLICY "shift_analyses_update" ON shift_analyses FOR UPDATE USING (studio_id = get_user_studio_id());

-- DATA FETCH JOBS
CREATE POLICY "data_fetch_jobs_select" ON data_fetch_jobs FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "data_fetch_jobs_insert" ON data_fetch_jobs FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "data_fetch_jobs_update" ON data_fetch_jobs FOR UPDATE USING (studio_id = get_user_studio_id());

-- MEMBER ALERTS
CREATE POLICY "member_alerts_select" ON member_alerts FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "member_alerts_insert" ON member_alerts FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "member_alerts_update" ON member_alerts FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "member_alerts_delete" ON member_alerts FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- CHAT CHANNELS
CREATE POLICY "chat_channels_select" ON chat_channels FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "chat_channels_insert" ON chat_channels FOR INSERT WITH CHECK (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "chat_channels_update" ON chat_channels FOR UPDATE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());
CREATE POLICY "chat_channels_delete" ON chat_channels FOR DELETE USING (studio_id = get_user_studio_id() AND is_admin_or_owner());

-- CHAT MESSAGES
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (studio_id = get_user_studio_id());
CREATE POLICY "chat_messages_update" ON chat_messages FOR UPDATE USING (
  studio_id = get_user_studio_id()
  AND (user_id = get_user_account_id() OR is_admin_or_owner())
);

-- SUPPORT TICKETS
CREATE POLICY "support_tickets_select" ON support_tickets FOR SELECT USING (
  studio_id = get_user_studio_id()
  AND (account_id = get_user_account_id() OR is_admin_or_owner() OR is_super_admin())
);
CREATE POLICY "support_tickets_insert" ON support_tickets FOR INSERT WITH CHECK (studio_id = get_user_studio_id());
CREATE POLICY "support_tickets_update" ON support_tickets FOR UPDATE USING (
  studio_id = get_user_studio_id()
  AND (account_id = get_user_account_id() OR is_admin_or_owner() OR is_super_admin())
);

-- AUDIT LOGS — read-only for admins
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (
  studio_id = get_user_studio_id() AND is_admin_or_owner()
);
-- Audit logs are inserted by triggers (service role), not by users directly
CREATE POLICY "audit_logs_select_super" ON audit_logs FOR SELECT USING (is_super_admin());

-- ERROR LOGS — super admin only for reading, service role for writing
CREATE POLICY "error_logs_select_super" ON error_logs FOR SELECT USING (is_super_admin());

-- =============================================
-- 7. AUDIT LOG TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_studio_id UUID;
  v_actor_email TEXT;
  v_event audit_event_type;
  v_old JSONB;
  v_new JSONB;
  v_entity_id UUID;
  v_summary TEXT;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    v_event := 'create';
    v_entity_id := NEW.id;
    v_new := to_jsonb(NEW);
    v_old := NULL;
    v_studio_id := NEW.studio_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_event := 'update';
    v_entity_id := NEW.id;
    v_new := to_jsonb(NEW);
    v_old := to_jsonb(OLD);
    v_studio_id := NEW.studio_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_event := 'delete';
    v_entity_id := OLD.id;
    v_new := NULL;
    v_old := to_jsonb(OLD);
    v_studio_id := OLD.studio_id;
  END IF;

  -- Get actor email
  SELECT email INTO v_actor_email
  FROM accounts
  WHERE auth_user_id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;

  v_summary := TG_OP || ' on ' || TG_TABLE_NAME;

  INSERT INTO audit_logs (studio_id, entity_type, entity_id, event_type, summary, actor_email, old_data, new_data)
  VALUES (v_studio_id, TG_TABLE_NAME, v_entity_id, v_event, v_summary, COALESCE(v_actor_email, 'system'), v_old, v_new);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_accounts AFTER INSERT OR UPDATE OR DELETE ON accounts
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_shifts AFTER INSERT OR UPDATE OR DELETE ON shifts
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_earnings AFTER INSERT OR UPDATE OR DELETE ON earnings
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_payouts AFTER INSERT OR UPDATE OR DELETE ON payouts
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_cam_accounts AFTER INSERT OR UPDATE OR DELETE ON cam_accounts
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_rooms AFTER INSERT OR UPDATE OR DELETE ON rooms
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_global_settings AFTER INSERT OR UPDATE OR DELETE ON global_settings
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_member_alerts AFTER INSERT OR UPDATE OR DELETE ON member_alerts
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- =============================================
-- 8. ENABLE REALTIME for specific tables
-- =============================================
-- These tables need Supabase Realtime for live updates

ALTER PUBLICATION supabase_realtime ADD TABLE streaming_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- =============================================
-- 9. STORAGE BUCKET for studio logos
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-assets', 'studio-assets', TRUE)
ON CONFLICT DO NOTHING;

-- Storage policies: studios can upload to their own folder
CREATE POLICY "studio_assets_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'studio-assets'
    AND (storage.foldername(name))[1] = get_user_studio_id()::TEXT
  );

CREATE POLICY "studio_assets_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'studio-assets');

CREATE POLICY "studio_assets_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'studio-assets'
    AND (storage.foldername(name))[1] = get_user_studio_id()::TEXT
  );

CREATE POLICY "studio_assets_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'studio-assets'
    AND (storage.foldername(name))[1] = get_user_studio_id()::TEXT
  );

-- =============================================
-- DONE! Schema created successfully.
-- =============================================
