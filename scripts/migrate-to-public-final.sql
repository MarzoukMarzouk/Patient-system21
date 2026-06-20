-- Create nursing roster tables in public schema with ORIGINAL names
-- No prefix needed - no conflicts with patients/exits/accounts

-- Drop nr_ prefixed tables if they exist
DROP TABLE IF EXISTS public.nr_leave_records CASCADE;
DROP TABLE IF EXISTS public.nr_leave_balance CASCADE;
DROP TABLE IF EXISTS public.nr_settings CASCADE;
DROP TABLE IF EXISTS public.nr_absences CASCADE;
DROP TABLE IF EXISTS public.nr_schedules CASCADE;
DROP TABLE IF EXISTS public.nr_user_sessions CASCADE;
DROP TABLE IF EXISTS public.nr_users CASCADE;

-- Create tables with original names (same as nursing roster code uses)

CREATE TABLE IF NOT EXISTS public.users (
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

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.schedules (
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

CREATE TABLE IF NOT EXISTS public.absences (
    id           SERIAL PRIMARY KEY,
    nurse_name   VARCHAR(255) NOT NULL,
    month        INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    absence_date DATE NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nurse_name, absence_date)
);

CREATE TABLE IF NOT EXISTS public.settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.leave_balance (
    id              SERIAL PRIMARY KEY,
    nurse_name      VARCHAR(255) NOT NULL UNIQUE,
    holiday_balance NUMERIC(5,1) NOT NULL DEFAULT 0,
    annual_balance  INTEGER NOT NULL DEFAULT 0,
    casual_balance  INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_records (
    id          SERIAL PRIMARY KEY,
    nurse_name  VARCHAR(255) NOT NULL,
    leave_date  DATE NOT NULL,
    leave_type  VARCHAR(20) NOT NULL CHECK (leave_type IN ('holiday', 'annual', 'casual')),
    shift       VARCHAR(10) CHECK (shift IN ('morning', 'night')),
    notes       TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nurse_name, leave_date, leave_type)
);

-- Copy data from nursing_roster schema (still has all data)
INSERT INTO public.users (id, full_name, email, phone, password, role, is_active, created_at, updated_at)
SELECT id, full_name, email, phone, password, role, is_active, created_at, updated_at
FROM nursing_roster.users;

INSERT INTO public.user_sessions (id, user_id, session_token, expires_at, created_at, last_activity)
SELECT id, user_id, session_token, expires_at, created_at, last_activity
FROM nursing_roster.user_sessions;

INSERT INTO public.schedules (id, nurse_name, month, work_type, selected_days, schedule_system, selected_shifts, created_at, updated_at)
SELECT id, nurse_name, month, work_type, selected_days, schedule_system, selected_shifts, created_at, updated_at
FROM nursing_roster.schedules;

INSERT INTO public.absences (id, nurse_name, month, absence_date, created_at)
SELECT id, nurse_name, month, absence_date, created_at
FROM nursing_roster.absences;

INSERT INTO public.settings (key, value, updated_at, updated_by)
SELECT key, value, updated_at, updated_by
FROM nursing_roster.settings
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by;

INSERT INTO public.leave_balance (id, nurse_name, holiday_balance, annual_balance, casual_balance, updated_at)
SELECT id, nurse_name, holiday_balance, annual_balance, casual_balance, updated_at
FROM nursing_roster.leave_balance
ON CONFLICT (nurse_name) DO UPDATE SET holiday_balance = EXCLUDED.holiday_balance, annual_balance = EXCLUDED.annual_balance, casual_balance = EXCLUDED.casual_balance, updated_at = EXCLUDED.updated_at;

INSERT INTO public.leave_records (id, nurse_name, leave_date, leave_type, shift, notes, created_at)
SELECT id, nurse_name, leave_date, leave_type, shift, notes, created_at
FROM nursing_roster.leave_records;

-- Reset sequences
SELECT setval('public.users_id_seq', COALESCE((SELECT MAX(id) FROM public.users), 1));
SELECT setval('public.user_sessions_id_seq', COALESCE((SELECT MAX(id) FROM public.user_sessions), 1));
SELECT setval('public.schedules_id_seq', COALESCE((SELECT MAX(id) FROM public.schedules), 1));
SELECT setval('public.absences_id_seq', COALESCE((SELECT MAX(id) FROM public.absences), 1));
SELECT setval('public.leave_balance_id_seq', COALESCE((SELECT MAX(id) FROM public.leave_balance), 1));
SELECT setval('public.leave_records_id_seq', COALESCE((SELECT MAX(id) FROM public.leave_records), 1));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_schedules_nurse_month ON public.schedules(nurse_name, month);
CREATE INDEX IF NOT EXISTS idx_schedules_month ON public.schedules(month);
CREATE INDEX IF NOT EXISTS idx_schedules_system ON public.schedules(schedule_system);
CREATE INDEX IF NOT EXISTS idx_schedules_shifts ON public.schedules USING GIN (selected_shifts);
CREATE INDEX IF NOT EXISTS idx_absences_nurse_month ON public.absences(nurse_name, month);
CREATE INDEX IF NOT EXISTS idx_absences_date ON public.absences(absence_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_nurse ON public.leave_balance(nurse_name);
CREATE INDEX IF NOT EXISTS idx_leave_records_nurse ON public.leave_records(nurse_name);
CREATE INDEX IF NOT EXISTS idx_leave_records_date ON public.leave_records(leave_date);
CREATE INDEX IF NOT EXISTS idx_leave_records_type ON public.leave_records(leave_type);

-- Disable RLS (same as existing patients/exits/accounts tables)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_records DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'users' AS table_name, COUNT(*) AS rows FROM public.users
UNION ALL SELECT 'schedules', COUNT(*) FROM public.schedules
UNION ALL SELECT 'absences', COUNT(*) FROM public.absences
UNION ALL SELECT 'settings', COUNT(*) FROM public.settings
UNION ALL SELECT 'leave_balance', COUNT(*) FROM public.leave_balance
UNION ALL SELECT 'leave_records', COUNT(*) FROM public.leave_records;
