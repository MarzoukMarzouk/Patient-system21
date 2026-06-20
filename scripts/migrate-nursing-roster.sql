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


-- ============================================================
-- DATA MIGRATION
-- ============================================================

-- ============================================================
-- Nursing Roster Data Migration
-- Generated by extract-nursing-data.cjs
-- Date: 2026-06-13T01:09:58.651Z
-- ============================================================

SET search_path TO nursing_roster;


-- ===== users (7 rows) =====
INSERT INTO nursing_roster.users (id, full_name, email, password, role, is_active, created_at, updated_at, phone) VALUES
  (15, 'ا/علاء', 'rehamalaa54321@gmail.com', '123456', 'roster_manager', TRUE, '2026-03-14T17:18:51.685+00:00', '2026-03-14T17:18:51.770864+00:00', NULL),
  (16, 'Mohamed elsayed abdelmoaty', 'mohamedelhalby41@gmail.com', 'mohamed#135', 'roster_manager', TRUE, '2026-03-15T17:15:47.978+00:00', '2026-03-15T17:41:56.32203+00:00', NULL),
  (17, 'Mohamed Shehta Abdelbaky', 'medoshehta555@gmail.com', 'me@0120700', 'nurse', TRUE, '2026-03-15T18:00:46.89+00:00', '2026-03-15T18:00:47.696642+00:00', NULL),
  (14, 'Ahmed magdy', 'ahmedmario519@gmail.com', '281764', 'roster_manager', TRUE, '2026-03-14T17:17:44.901+00:00', '2026-03-15T18:01:31.866938+00:00', NULL),
  (18, 'Abdelrahman Marzouk', 'Abdo@2002.com', '200267', 'nurse', TRUE, '2026-03-15T18:10:26.131+00:00', '2026-03-15T18:10:27.448145+00:00', NULL),
  (1, 'Mohamed Marzouk', 'abomrzk@gmail.com', '123456', 'admin', TRUE, '2026-03-11T22:05:33.460179+00:00', '2026-03-15T18:22:06.007624+00:00', NULL),
  (22, 'Karim Ali', NULL, '123457', 'nurse', TRUE, '2026-03-16T19:24:48.054+00:00', '2026-03-16T10:24:04.464255+00:00', '01211065017');


-- ===== user_sessions (28 rows) =====
INSERT INTO nursing_roster.user_sessions (id, user_id, session_token, expires_at, created_at, last_activity) VALUES
  (1, 1, 'session_ar6f53fk6_1773266835651', '2026-03-18T22:07:15.651+00:00', '2026-03-11T22:07:15.651+00:00', '2026-03-11T22:07:20.334303+00:00'),
  (2, 1, 'session_vuup4jea4_1773266858863', '2026-03-12T22:07:38.863+00:00', '2026-03-11T22:07:38.863+00:00', '2026-03-11T22:07:43.456703+00:00'),
  (3, 1, 'session_ko8rzcgzx_1773266864020', '2026-03-12T22:07:44.02+00:00', '2026-03-11T22:07:44.02+00:00', '2026-03-11T22:07:48.619883+00:00'),
  (4, 1, 'session_93w1089uu_1773267116941', '2026-03-12T22:11:56.941+00:00', '2026-03-11T22:11:56.941+00:00', '2026-03-11T22:12:01.583807+00:00'),
  (5, 1, 'session_c58tbzatv_1773325211229', '2026-03-19T14:20:11.229+00:00', '2026-03-12T14:20:11.267+00:00', '2026-03-12T14:16:26.488364+00:00'),
  (6, 1, 'session_olblajqcn_1773373833027', '2026-03-14T03:50:33.027+00:00', '2026-03-13T03:50:33.027+00:00', '2026-03-13T03:50:32.980413+00:00'),
  (7, 1, 'session_ruc04pclw_1773376811328', '2026-03-14T04:40:11.328+00:00', '2026-03-13T04:40:11.328+00:00', '2026-03-13T04:40:11.323494+00:00'),
  (8, 1, 'session_b9wmpqzo8_1773378695210', '2026-03-20T05:11:35.21+00:00', '2026-03-13T05:11:35.21+00:00', '2026-03-13T05:11:35.405304+00:00'),
  (9, 1, 'session_es6ahyhwf_1773379710979', '2026-03-14T05:28:30.979+00:00', '2026-03-13T05:28:30.993+00:00', '2026-03-13T05:24:46.218149+00:00'),
  (10, 1, 'session_z9pzd6yjs_1773379750578', '2026-03-14T05:29:10.578+00:00', '2026-03-13T05:29:10.579+00:00', '2026-03-13T05:25:25.753216+00:00'),
  (11, 1, 'session_f39sv6a1e_1773379752775', '2026-03-20T05:29:12.775+00:00', '2026-03-13T05:29:12.776+00:00', '2026-03-13T05:25:27.89506+00:00'),
  (13, 1, 'session_5j586sbm4_1773453998818', '2026-04-13T02:06:38.818+00:00', '2026-03-14T02:06:38.838+00:00', '2026-03-14T02:02:54.155516+00:00'),
  (17, 15, 'session_5l90mjufx_1773509730541', '2027-03-14T17:35:30.541+00:00', '2026-03-14T17:35:30.548+00:00', '2026-03-14T17:35:30.814965+00:00'),
  (18, 16, 'session_8f7kvbcdf_1773594963660', '2027-03-15T17:16:03.66+00:00', '2026-03-15T17:16:03.66+00:00', '2026-03-15T17:16:03.930043+00:00'),
  (20, 1, 'session_jjpaktgvc_1773596719851', '2027-03-15T17:45:19.853+00:00', '2026-03-15T17:45:19.867+00:00', '2026-03-15T17:41:33.803254+00:00'),
  (22, 14, 'session_a4a9zggdq_1773597610894', '2027-03-15T18:00:10.894+00:00', '2026-03-15T18:00:10.903+00:00', '2026-03-15T18:00:11.951522+00:00'),
  (23, 17, 'session_e0p9qo0df_1773597669290', '2027-03-15T18:01:09.29+00:00', '2026-03-15T18:01:09.292+00:00', '2026-03-15T18:01:10.081914+00:00'),
  (24, 18, 'session_tbnphxhn6_1773598258234', '2027-03-15T18:10:58.234+00:00', '2026-03-15T18:10:58.238+00:00', '2026-03-15T18:10:59.528577+00:00'),
  (25, 1, 'session_ysunc3xwu_1773598883363', '2027-03-15T18:21:23.363+00:00', '2026-03-15T18:21:23.363+00:00', '2026-03-15T18:17:37.162272+00:00'),
  (27, 1, 'session_s3jlfkvsa_1773607078089', '2027-03-15T20:37:58.089+00:00', '2026-03-15T20:37:58.089+00:00', '2026-03-15T20:37:59.138191+00:00'),
  (28, 1, 'session_9q751cfma_1773632115401', '2027-03-16T03:35:15.401+00:00', '2026-03-16T03:35:15.402+00:00', '2026-03-16T03:31:29.300169+00:00'),
  (29, 22, 'session_kj39d53bo_1773689115547', '2027-03-16T19:25:15.547+00:00', '2026-03-16T19:25:15.547+00:00', '2026-03-16T10:24:31.829504+00:00'),
  (31, 1, 'session_5lxzm5853_1774207280282', '2027-03-22T19:21:20.282+00:00', '2026-03-22T19:21:20.283+00:00', '2026-03-22T19:17:35.325397+00:00'),
  (32, 1, 'session_e2h3sb7g9_1774216462946', '2027-03-22T21:54:22.951+00:00', '2026-03-22T21:54:22.952+00:00', '2026-03-22T21:50:37.685732+00:00'),
  (34, 1, 'session_0phzge99d_1775681767339', '2027-04-08T20:56:07.339+00:00', '2026-04-08T20:56:07.339+00:00', '2026-04-08T20:56:08.022814+00:00'),
  (35, 1, 'session_s68ohdc88_1775797079028', '2027-04-10T04:57:59.028+00:00', '2026-04-10T04:57:59.079+00:00', '2026-04-10T04:58:00.048712+00:00'),
  (36, 1, 'session_rq9yy1log_1780065884838', '2027-05-29T14:44:44.838+00:00', '2026-05-29T14:44:44.838+00:00', '2026-05-29T14:44:51.070479+00:00'),
  (37, 16, 'session_g6hcvle7v_1780307902748', '2027-06-01T09:58:22.748+00:00', '2026-06-01T09:58:22.748+00:00', '2026-06-01T09:58:23.094054+00:00');


-- ===== schedules (8 rows) =====
INSERT INTO nursing_roster.schedules (id, nurse_name, month, work_type, selected_days, created_at, updated_at, schedule_system, selected_shifts) VALUES
  (15, 'Ahmed magdy', 4, '24hour', '{"sunday","thursday"}'::text[], '2026-03-15T18:00:39.841+00:00', '2026-03-15T18:01:59.29755+00:00', '24', '["24hour"]'::jsonb),
  (16, 'Mohamed Shehta Abdelbaky', 4, '24hour', '{"sunday","friday"}'::text[], '2026-03-15T18:01:45.04+00:00', '2026-03-15T18:03:51.463716+00:00', '24', '["24hour"]'::jsonb),
  (17, 'Abdelrahman Marzouk', 4, '24hour', '{"saturday","tuesday"}'::text[], '2026-03-15T18:13:26.635+00:00', '2026-03-15T18:13:27.902134+00:00', '24', '["24hour"]'::jsonb),
  (19, 'Mohamed Marzouk', 4, '24hour', '{"monday","wednesday"}'::text[], '2026-03-15T20:56:47.791+00:00', '2026-03-15T20:56:48.950813+00:00', '24', '["24hour"]'::jsonb),
  (20, 'Karim Ali', 4, '24hour', '{"wednesday","monday"}'::text[], '2026-03-16T19:26:30.101+00:00', '2026-03-16T10:25:46.390307+00:00', '24', '["24hour"]'::jsonb),
  (21, 'Mohamed elsayed abdelmoaty', 4, 'mixed', '{}'::text[], '2026-03-16T15:25:22.375+00:00', '2026-03-16T15:25:22.549387+00:00', 'multiple', '["{\"day\":5,\"shift\":\"morning\"}","{\"day\":10,\"shift\":\"morning\"}","{\"day\":10,\"shift\":\"night\"}","{\"day\":10,\"shift\":\"evening\"}","{\"day\":7,\"shift\":\"evening\"}"]'::jsonb),
  (22, 'Mohamed Marzouk', 5, '24hour', '{"monday","wednesday"}'::text[], '2026-04-13T07:28:31.563+00:00', '2026-04-13T07:28:33.100032+00:00', '24', '["24hour"]'::jsonb),
  (26, 'Mohamed Marzouk', 6, '24hour', '{"monday","wednesday"}'::text[], '2026-05-29T14:45:04.729+00:00', '2026-05-29T14:45:10.965577+00:00', '24', '["24hour"]'::jsonb);


-- ===== absences (2 rows) =====
INSERT INTO nursing_roster.absences (id, nurse_name, month, absence_date, created_at) VALUES
  (29, 'Mohamed Marzouk', 4, '2026-04-08', '2026-03-22T12:57:14.963+00:00'),
  (30, 'Mohamed Marzouk', 5, '2026-05-25', '2026-04-26T22:16:50.37+00:00');


-- ===== settings (2 rows) =====
INSERT INTO nursing_roster.settings (key, value, updated_at, updated_by) VALUES
  ('schedule_open', 'true', '2026-03-15T17:54:22.769+00:00', 'Mohamed elsayed abdelmoaty'),
  ('absence_open', 'true', '2026-04-26T22:16:40.437+00:00', 'Mohamed Marzouk') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by;


-- ===== leave_balance (1 rows) =====
INSERT INTO nursing_roster.leave_balance (id, nurse_name, holiday_balance, annual_balance, casual_balance, updated_at) VALUES
  (3, 'Mohamed Marzouk', 4, 10, 3, '2026-03-22T19:10:46.816+00:00');


-- ===== leave_records (13 rows) =====
INSERT INTO nursing_roster.leave_records (id, nurse_name, leave_date, leave_type, shift, notes, created_at) VALUES
  (7, 'Mohamed Marzouk', '2026-03-22', 'casual', NULL, 'add:3', '2026-03-22T19:24:54.88349+00:00'),
  (9, 'Mohamed Marzouk', '2026-01-28', 'holiday', 'night', 'جازة عيد الشرطة + ثورة 25 يناير (مُرحّلة)', '2026-03-23T14:32:16.038506+00:00'),
  (2, 'Mohamed Marzouk', '2026-01-07', 'holiday', 'night', 'عيد المسيحيين', '2026-03-22T14:38:11.484067+00:00'),
  (3, 'Mohamed Marzouk', '2026-03-18', 'holiday', 'night', 'أول يوم إجازة عيد الفطر', '2026-03-22T14:38:36.159992+00:00'),
  (10, 'Mohamed Marzouk', '2026-03-23', 'holiday', 'morning', 'آخر يوم إجازة عيد الفطر', '2026-03-23T14:32:28.356851+00:00'),
  (8, 'Mohamed Marzouk', '2026-02-09', 'holiday', NULL, 'earned:2', '2026-03-22T19:34:50.349183+00:00'),
  (11, 'Mohamed Marzouk', '2026-04-13', 'holiday', 'morning', 'شم النسيم', '2026-04-13T07:30:00.407305+00:00'),
  (12, 'Mohamed Marzouk', '2026-04-15', 'annual', NULL, 'add:5', '2026-04-15T08:57:46.966729+00:00'),
  (13, 'Mohamed Marzouk', '2026-04-15', 'casual', NULL, 'add:1', '2026-04-15T08:57:54.164077+00:00'),
  (17, 'Mohamed Marzouk', '2026-04-11', 'holiday', NULL, 'earned:9', '2026-04-15T09:56:18.548267+00:00'),
  (18, 'Mohamed Marzouk', '2026-05-07', 'holiday', 'morning', 'عيد العمال', '2026-05-09T14:00:12.882035+00:00'),
  (19, 'Mohamed Marzouk', '2026-05-27', 'holiday', 'morning', 'اول يوم عيد الاضحى', '2026-05-29T14:46:17.747192+00:00'),
  (20, 'Mohamed Marzouk', '2026-05-28', 'holiday', 'morning', 'ثانى عيد الاضحى', '2026-05-29T14:46:43.72599+00:00');


