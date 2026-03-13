-- Add column to track when the last trial reminder was sent (dedup protection)
ALTER TABLE studios ADD COLUMN IF NOT EXISTS last_trial_reminder_sent timestamptz;
