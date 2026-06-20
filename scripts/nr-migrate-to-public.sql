-- الخطوة 1: انقل البيانات من nursing_roster schema إلى public schema
-- شغّل الكود دا كله في Supabase SQL Editor

-- إنشاء الجداول في public schema
CREATE TABLE IF NOT EXISTS public.nr_users (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(255),
    email       VARCHAR(255) UNIQUE,
    phone       VARCHAR(50)  UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'nurse' CHECK (role IN ('admin', 'nurse', 'roster_manager')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT nr_users_email_or_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.nr_user_sessions (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES public.nr_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.nr_schedules (
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

CREATE TABLE IF NOT EXISTS public.nr_absences (
    id           SERIAL PRIMARY KEY,
    nurse_name   VARCHAR(255) NOT NULL,
    month        INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    absence_date DATE NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nurse_name, absence_date)
);

CREATE TABLE IF NOT EXISTS public.nr_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.nr_leave_balance (
    id              SERIAL PRIMARY KEY,
    nurse_name      VARCHAR(255) NOT NULL UNIQUE,
    holiday_balance NUMERIC(5,1) NOT NULL DEFAULT 0,
    annual_balance  INTEGER NOT NULL DEFAULT 0,
    casual_balance  INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.nr_leave_records (
    id          SERIAL PRIMARY KEY,
    nurse_name  VARCHAR(255) NOT NULL,
    leave_date  DATE NOT NULL,
    leave_type  VARCHAR(20) NOT NULL CHECK (leave_type IN ('holiday', 'annual', 'casual')),
    shift       VARCHAR(10) CHECK (shift IN ('morning', 'night')),
    notes       TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nurse_name, leave_date, leave_type)
);

-- نقل البيانات من nursing_roster schema
INSERT INTO public.nr_users (id, full_name, email, phone, password, role, is_active, created_at, updated_at)
SELECT id, full_name, email, phone, password, role, is_active, created_at, updated_at
FROM nursing_roster.users;

UPDATE public.nr_users SET phone = u.phone
FROM nursing_roster.users u
WHERE public.nr_users.email = u.email AND u.phone IS NOT NULL AND public.nr_users.phone IS NULL;

INSERT INTO public.nr_user_sessions (id, user_id, session_token, expires_at, created_at, last_activity)
SELECT id, user_id, session_token, expires_at, created_at, last_activity
FROM nursing_roster.user_sessions;

INSERT INTO public.nr_schedules (id, nurse_name, month, work_type, selected_days, schedule_system, selected_shifts, created_at, updated_at)
SELECT id, nurse_name, month, work_type, selected_days, schedule_system, selected_shifts, created_at, updated_at
FROM nursing_roster.schedules;

INSERT INTO public.nr_absences (id, nurse_name, month, absence_date, created_at)
SELECT id, nurse_name, month, absence_date, created_at
FROM nursing_roster.absences;

INSERT INTO public.nr_settings (key, value, updated_at, updated_by)
SELECT key, value, updated_at, updated_by
FROM nursing_roster.settings
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by;

INSERT INTO public.nr_leave_balance (id, nurse_name, holiday_balance, annual_balance, casual_balance, updated_at)
SELECT id, nurse_name, holiday_balance, annual_balance, casual_balance, updated_at
FROM nursing_roster.leave_balance
ON CONFLICT (nurse_name) DO UPDATE SET holiday_balance = EXCLUDED.holiday_balance, annual_balance = EXCLUDED.annual_balance, casual_balance = EXCLUDED.casual_balance, updated_at = EXCLUDED.updated_at;

INSERT INTO public.nr_leave_records (id, nurse_name, leave_date, leave_type, shift, notes, created_at)
SELECT id, nurse_name, leave_date, leave_type, shift, notes, created_at
FROM nursing_roster.leave_records;

-- إعادة تعيين الـ sequences
SELECT setval('public.nr_users_id_seq', COALESCE((SELECT MAX(id) FROM public.nr_users), 1));
SELECT setval('public.nr_user_sessions_id_seq', COALESCE((SELECT MAX(id) FROM public.nr_user_sessions), 1));
SELECT setval('public.nr_schedules_id_seq', COALESCE((SELECT MAX(id) FROM public.nr_schedules), 1));
SELECT setval('public.nr_absences_id_seq', COALESCE((SELECT MAX(id) FROM public.nr_absences), 1));
SELECT setval('public.nr_leave_balance_id_seq', COALESCE((SELECT MAX(id) FROM public.nr_leave_balance), 1));
SELECT setval('public.nr_leave_records_id_seq', COALESCE((SELECT MAX(id) FROM public.nr_leave_records), 1));

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_nr_schedules_nurse_month ON public.nr_schedules(nurse_name, month);
CREATE INDEX IF NOT EXISTS idx_nr_schedules_month ON public.nr_schedules(month);
CREATE INDEX IF NOT EXISTS idx_nr_schedules_system ON public.nr_schedules(schedule_system);
CREATE INDEX IF NOT EXISTS idx_nr_schedules_shifts ON public.nr_schedules USING GIN (selected_shifts);
CREATE INDEX IF NOT EXISTS idx_nr_absences_nurse_month ON public.nr_absences(nurse_name, month);
CREATE INDEX IF NOT EXISTS idx_nr_absences_date ON public.nr_absences(absence_date);
CREATE INDEX IF NOT EXISTS idx_nr_users_email ON public.nr_users(email);
CREATE INDEX IF NOT EXISTS idx_nr_users_role ON public.nr_users(role);
CREATE INDEX IF NOT EXISTS idx_nr_sessions_token ON public.nr_user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_nr_sessions_user ON public.nr_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_nr_leave_balance_nurse ON public.nr_leave_balance(nurse_name);
CREATE INDEX IF NOT EXISTS idx_nr_leave_records_nurse ON public.nr_leave_records(nurse_name);
CREATE INDEX IF NOT EXISTS idx_nr_leave_records_date ON public.nr_leave_records(leave_date);
CREATE INDEX IF NOT EXISTS idx_nr_leave_records_type ON public.nr_leave_records(leave_type);

-- التحقق من البيانات
SELECT 'nr_users' AS "جدول", COUNT(*) AS "عدد السجلات" FROM public.nr_users
UNION ALL
SELECT 'nr_schedules', COUNT(*) FROM public.nr_schedules
UNION ALL
SELECT 'nr_absences', COUNT(*) FROM public.nr_absences
UNION ALL
SELECT 'nr_settings', COUNT(*) FROM public.nr_settings
UNION ALL
SELECT 'nr_leave_balance', COUNT(*) FROM public.nr_leave_balance
UNION ALL
SELECT 'nr_leave_records', COUNT(*) FROM public.nr_leave_records;
