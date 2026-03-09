-- Migration: Set up pg_cron schedules for Edge Functions
--
-- BEFORE running this:
-- 1. Go to Supabase Dashboard → Database → Extensions
-- 2. Enable "pg_cron"
-- 3. Enable "pg_net"
--
-- INSTRUCTIONS:
-- Replace YOUR_SUPABASE_URL with your project URL (e.g. https://abcdefg.supabase.co)
-- Replace YOUR_SERVICE_ROLE_KEY with your service_role key from Settings → API
--

-- Scrape cam data every 15 minutes
SELECT cron.schedule(
  'scrape-cam-data',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/scrape-cam-data',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Fetch exchange rates daily at 6 AM UTC
SELECT cron.schedule(
  'fetch-exchange-rate',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/fetch-exchange-rate',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Correlate shifts every hour
SELECT cron.schedule(
  'correlate-shifts',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/correlate-shifts',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Check trial reminders daily at 9 AM UTC
SELECT cron.schedule(
  'check-trial-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/check-trial-reminders',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
