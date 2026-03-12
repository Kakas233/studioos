-- Allow the same platform+username to be added by different studios
-- Old: unique on (platform, username) globally
-- New: unique on (studio_id, platform, username) per studio

DROP INDEX IF EXISTS cam_accounts_platform_username;
CREATE UNIQUE INDEX cam_accounts_studio_platform_username ON cam_accounts(studio_id, platform, username);
