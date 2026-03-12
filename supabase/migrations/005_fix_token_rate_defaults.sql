-- Fix token rate defaults to match actual platform rates
-- Previously all were 0.05, but BongaCams=0.02, Cam4=0.1, Flirt4Free=0.03, LiveJasmin=1.0

-- 1. Fix column defaults
ALTER TABLE global_settings ALTER COLUMN bongacams_rate SET DEFAULT 0.02;
ALTER TABLE global_settings ALTER COLUMN cam4_rate SET DEFAULT 0.1;
ALTER TABLE global_settings ALTER COLUMN flirt4free_rate SET DEFAULT 0.03;
ALTER TABLE global_settings ALTER COLUMN livejasmin_rate SET DEFAULT 1.0;

-- 2. Update existing rows that still have the wrong 0.05 defaults
-- Only update if the value is exactly 0.05 (user hasn't customized it)
UPDATE global_settings SET bongacams_rate = 0.02 WHERE bongacams_rate = 0.05;
UPDATE global_settings SET cam4_rate = 0.1 WHERE cam4_rate = 0.05;
UPDATE global_settings SET flirt4free_rate = 0.03 WHERE flirt4free_rate = 0.05;
UPDATE global_settings SET livejasmin_rate = 1.0 WHERE livejasmin_rate = 0.05;
