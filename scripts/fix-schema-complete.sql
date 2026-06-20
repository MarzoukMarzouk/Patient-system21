-- ============================================================
-- Complete fix for nursing_roster schema access
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- 1. Verify schema exists (if not, create it)
CREATE SCHEMA IF NOT EXISTS nursing_roster;

-- 2. Grant all permissions to anon role
GRANT USAGE ON SCHEMA nursing_roster TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA nursing_roster TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA nursing_roster TO anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA nursing_roster TO anon;

-- 3. Default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA nursing_roster GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA nursing_roster GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA nursing_roster GRANT ALL ON ROUTINES TO anon;

-- 4. Also grant to public role as fallback
GRANT USAGE ON SCHEMA nursing_roster TO public;
GRANT ALL ON ALL TABLES IN SCHEMA nursing_roster TO public;
GRANT ALL ON ALL SEQUENCES IN SCHEMA nursing_roster TO public;

-- 5. CRITICAL: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 6. Verify
SELECT 'ok' AS status, COUNT(*) AS tables_count
FROM information_schema.tables
WHERE table_schema = 'nursing_roster';
