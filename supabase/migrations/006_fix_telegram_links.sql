-- Fix telegram_links column names to match application code
-- Code uses: link_token, telegram_chat_id, telegram_username
-- Migration 003 created: token, chat_id (no username column)

-- Rename token → link_token
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_links' AND column_name = 'token')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_links' AND column_name = 'link_token') THEN
    ALTER TABLE telegram_links RENAME COLUMN token TO link_token;
  END IF;
END $$;

-- Rename chat_id → telegram_chat_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_links' AND column_name = 'chat_id')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_links' AND column_name = 'telegram_chat_id') THEN
    ALTER TABLE telegram_links RENAME COLUMN chat_id TO telegram_chat_id;
  END IF;
END $$;

-- Add telegram_username column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_links' AND column_name = 'telegram_username') THEN
    ALTER TABLE telegram_links ADD COLUMN telegram_username TEXT;
  END IF;
END $$;

-- Update indexes to match new column names (drop old, create new)
DROP INDEX IF EXISTS idx_telegram_links_token;
DROP INDEX IF EXISTS idx_telegram_links_chat_id;
CREATE INDEX IF NOT EXISTS idx_telegram_links_link_token ON telegram_links(link_token);
CREATE INDEX IF NOT EXISTS idx_telegram_links_telegram_chat_id ON telegram_links(telegram_chat_id);
