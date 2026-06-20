-- ============================================================
-- Nursing Roster Schema Migration
-- Creates all nursing roster tables in a separate schema
-- inside the same database as patient-next
-- ============================================================

-- ===============================
-- 1. Create Schema
-- ===============================
CREATE SCHEMA IF NOT EXISTS nursing_roster;

-- ===============================
-- 2. Create Tables
-- ===============================

-- 2.1 users
CREATE TABLE IF NOT EXISTS nursing_roster.users (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(255),
    email       VARCHAR(255) UNIQUE,
    phone       VARCHAR(50)  UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'nurse' CHECK (role IN ('admin', 'nurse', 'roster_manager')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT users_email_or_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- 2.2 user_sessions
CREATE TABLE IF NOT EXISTS nursing_roster.user_sessions (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES nursing_roster.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE
);

-- 2.3 schedules
CREATE TABLE IF NOT EXISTS nursing_roster.schedules (
    id              SERIAL PRIMARY KEY,
    nurse_name      VARCHAR(255) NOT NULL,
    month           INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    work_type       VARCHAR(50) NOT NULL DEFAULT 'mixed' CHECK (work_type IN ('24hour', 'morning', 'mixed')),
    selected_days   TEXT[] NOT NULL DEFAULT '{}',
    schedule_system VARCHAR(20) DEFAULT '24' CHECK (schedule_system IN ('24', 'multiple')),
    selected_shifts JSONB DEFAULT '[]',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nurse_name, month)
);

-- 2.4 absences
CREATE TABLE IF NOT EXISTS nursing_roster.absences (
    id           SERIAL PRIMARY KEY,
    nurse_name   VARCHAR(255) NOT NULL,
    month        INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    absence_date DATE NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nurse_name, absence_date)
);

-- 2.5 settings
CREATE TABLE IF NOT EXISTS nursing_roster.settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by  VARCHAR(255)
);

-- 2.6 leave_balance
CREATE TABLE IF NOT EXISTS nursing_roster.leave_balance (
    id              SERIAL PRIMARY KEY,
    nurse_name      VARCHAR(255) NOT NULL UNIQUE,
    holiday_balance NUMERIC(5,1) NOT NULL DEFAULT 0,
    annual_balance  INTEGER NOT NULL DEFAULT 0,
    casual_balance  INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7 leave_records
CREATE TABLE IF NOT EXISTS nursing_roster.leave_records (
    id          SERIAL PRIMARY KEY,
    nurse_name  VARCHAR(255) NOT NULL,
    leave_date  DATE NOT NULL,
    leave_type  VARCHAR(20) NOT NULL CHECK (leave_type IN ('holiday', 'annual', 'casual')),
    shift       VARCHAR(10) CHECK (shift IN ('morning', 'night')),
    notes       TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nurse_name, leave_date, leave_type)
);

-- ===============================
-- 3. Indexes
-- ===============================
CREATE INDEX IF NOT EXISTS idx_nr_schedules_nurse_month  ON nursing_roster.schedules(nurse_name, month);
CREATE INDEX IF NOT EXISTS idx_nr_schedules_month        ON nursing_roster.schedules(month);
CREATE INDEX IF NOT EXISTS idx_nr_schedules_system       ON nursing_roster.schedules(schedule_system);
CREATE INDEX IF NOT EXISTS idx_nr_schedules_shifts       ON nursing_roster.schedules USING GIN (selected_shifts);
CREATE INDEX IF NOT EXISTS idx_nr_absences_nurse_month   ON nursing_roster.absences(nurse_name, month);
CREATE INDEX IF NOT EXISTS idx_nr_absences_date          ON nursing_roster.absences(absence_date);
CREATE INDEX IF NOT EXISTS idx_nr_users_email            ON nursing_roster.users(email);
CREATE INDEX IF NOT EXISTS idx_nr_users_role             ON nursing_roster.users(role);
CREATE INDEX IF NOT EXISTS idx_nr_sessions_token         ON nursing_roster.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_nr_sessions_user          ON nursing_roster.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_nr_leave_balance_nurse    ON nursing_roster.leave_balance(nurse_name);
CREATE INDEX IF NOT EXISTS idx_nr_leave_records_nurse    ON nursing_roster.leave_records(nurse_name);
CREATE INDEX IF NOT EXISTS idx_nr_leave_records_date     ON nursing_roster.leave_records(leave_date);
CREATE INDEX IF NOT EXISTS idx_nr_leave_records_type     ON nursing_roster.leave_records(leave_type);

-- ===============================
-- 4. Trigger Function & Trigger
-- ===============================
CREATE OR REPLACE FUNCTION nursing_roster.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = nursing_roster
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_schedules_updated_at ON nursing_roster.schedules;
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON nursing_roster.schedules
    FOR EACH ROW
    EXECUTE FUNCTION nursing_roster.update_updated_at_column();

-- ===============================
-- 5. Views
-- ===============================
CREATE OR REPLACE VIEW nursing_roster.nursing_statistics
WITH (security_invoker = true)
AS
SELECT
    COUNT(DISTINCT nurse_name) AS total_nurses,
    COUNT(*) AS total_schedules,
    COUNT(CASE WHEN schedule_system = '24' THEN 1 END) AS nurses_24h,
    COUNT(CASE WHEN schedule_system = 'multiple' THEN 1 END) AS nurses_multiple,
    (SELECT COUNT(*) FROM nursing_roster.absences) AS total_absences,
    (SELECT COUNT(*) FROM nursing_roster.users WHERE is_active = TRUE) AS active_users,
    (SELECT COUNT(*) FROM nursing_roster.users WHERE role = 'admin') AS total_admins,
    (SELECT COUNT(*) FROM nursing_roster.users WHERE role = 'nurse') AS total_nurses_users
FROM nursing_roster.schedules;

CREATE OR REPLACE VIEW nursing_roster.users_info
WITH (security_invoker = true)
AS
SELECT id, full_name, email, phone, role, is_active, created_at
FROM nursing_roster.users;

CREATE OR REPLACE VIEW nursing_roster.active_sessions
WITH (security_invoker = true)
AS
SELECT s.id, s.user_id, s.expires_at, s.created_at, u.full_name, u.email, u.role
FROM nursing_roster.user_sessions s
JOIN nursing_roster.users u ON u.id = s.user_id
WHERE s.expires_at > NOW();

CREATE OR REPLACE VIEW nursing_roster.schedule_details
WITH (security_invoker = true)
AS
SELECT * FROM nursing_roster.schedules;

-- ===============================
-- 6. Functions
-- ===============================
CREATE OR REPLACE FUNCTION nursing_roster.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = nursing_roster
AS $$
BEGIN
    DELETE FROM nursing_roster.user_sessions WHERE expires_at < NOW();
END;
$$;

-- ===============================
-- 7. Grant permissions to anon role (required for Supabase anon key access)
-- ===============================
GRANT USAGE ON SCHEMA nursing_roster TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA nursing_roster TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA nursing_roster TO anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA nursing_roster TO anon;

-- Also grant to public role as fallback
GRANT USAGE ON SCHEMA nursing_roster TO public;
GRANT ALL ON ALL TABLES IN SCHEMA nursing_roster TO public;
GRANT ALL ON ALL SEQUENCES IN SCHEMA nursing_roster TO public;

-- Default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA nursing_roster GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA nursing_roster GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA nursing_roster GRANT ALL ON ROUTINES TO anon;

-- ===============================
-- Reload PostgREST schema cache
-- ===============================
NOTIFY pgrst, 'reload schema';

-- ===============================
-- 8. Disable RLS (same approach as patient-next)
-- ===============================
ALTER TABLE nursing_roster.users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_roster.user_sessions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_roster.schedules      DISABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_roster.absences       DISABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_roster.settings       DISABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_roster.leave_balance  DISABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_roster.leave_records  DISABLE ROW LEVEL SECURITY;

-- ===============================
-- 8. Enable Realtime
-- ===============================
alter publication supabase_realtime add table nursing_roster.users;
alter publication supabase_realtime add table nursing_roster.user_sessions;
alter publication supabase_realtime add table nursing_roster.schedules;
alter publication supabase_realtime add table nursing_roster.absences;
alter publication supabase_realtime add table nursing_roster.settings;
alter publication supabase_realtime add table nursing_roster.leave_balance;
alter publication supabase_realtime add table nursing_roster.leave_records;

-- ===============================
-- 9. Verify
-- ===============================
SELECT
    (SELECT COUNT(*) FROM nursing_roster.users)     AS "المستخدمون",
    (SELECT COUNT(*) FROM nursing_roster.schedules) AS "الروسترات",
    (SELECT COUNT(*) FROM nursing_roster.absences)  AS "الماعدا",
    'تم إنشاء schema بنجاح ✅' AS "الحالة";
