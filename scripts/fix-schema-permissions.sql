-- Fix: Grant anon role access to nursing_roster schema
-- Run this in Supabase SQL Editor if the schema already exists

GRANT USAGE ON SCHEMA nursing_roster TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA nursing_roster TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA nursing_roster TO anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA nursing_roster TO anon;

-- Also set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA nursing_roster GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA nursing_roster GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA nursing_roster GRANT ALL ON ROUTINES TO anon;
