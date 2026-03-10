-- Migration 004: Add missing indexes and constraints for performance & data integrity

-- Prevent duplicate earnings for the same shift
CREATE UNIQUE INDEX IF NOT EXISTS earnings_shift_id_unique ON earnings(shift_id) WHERE shift_id IS NOT NULL;

-- Composite index for shift overlap detection queries
CREATE INDEX IF NOT EXISTS idx_shifts_model_status_time ON shifts(studio_id, model_id, status, start_time, end_time);

-- Member alerts by account (used in hooks)
CREATE INDEX IF NOT EXISTS idx_member_alerts_account_id ON member_alerts(account_id);

-- Earnings by shift_id (for duplicate checks and lookups)
CREATE INDEX IF NOT EXISTS idx_earnings_shift_id ON earnings(shift_id);

-- Data fetch jobs by cam_account and status (for progress queries)
CREATE INDEX IF NOT EXISTS idx_data_fetch_jobs_cam_status ON data_fetch_jobs(cam_account_id, status);

-- Assignments composite (frequently queried together)
CREATE INDEX IF NOT EXISTS idx_assignments_studio_active ON assignments(studio_id, is_active);

-- Cam accounts by platform (for scraping queries)
CREATE INDEX IF NOT EXISTS idx_cam_accounts_active ON cam_accounts(is_active) WHERE is_active = true;

-- Chat messages composite for pagination queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_studio ON chat_messages(channel_id, studio_id, created_at DESC);

-- Accounts auth user lookup (critical for every API call)
CREATE INDEX IF NOT EXISTS idx_accounts_auth_user_active ON accounts(auth_user_id, is_active) WHERE is_active = true;

-- Stream segments source index (for historical data fetch delete+insert)
CREATE INDEX IF NOT EXISTS idx_stream_segments_cam_date_source ON stream_segments(cam_account_id, date, source);
