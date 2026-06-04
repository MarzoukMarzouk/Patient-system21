-- ===== إنشاء الجداول (إذا لم تكن موجودة) =====

create table if not exists patients (
  patient_id        text primary key,
  patient_name      text not null,
  date_of_entry     date,
  diagnosis         text,
  enrolment_number  text,
  file_number       text,
  category          text,
  identity          text,
  national_id       text,
  date_of_birth     date,
  age               text,
  age_classification text,
  family_phone      text,
  clozapax          text,
  internal_patient  text,
  internal_diseases text,
  status            text default 'متواجد',
  holiday_date      date,
  return_date       date,
  vacation_duration_type text,
  vacation_days     integer,
  out_date          date,
  out_type          text,
  out_note          text,
  review_number     integer,
  committee_date    date,
  state_expense_status text,
  state_expense_end_date date,
  state_expense_notes text,
  created_at        timestamptz default now()
);

create table if not exists exits (
  id                bigserial primary key,
  patient_id        text,
  patient_name      text,
  date_of_entry     date,
  diagnosis         text,
  enrolment_number  text,
  file_number       text,
  category          text,
  identity          text,
  national_id       text,
  date_of_birth     date,
  age               text,
  age_classification text,
  family_phone      text,
  clozapax          text,
  internal_patient  text,
  internal_diseases text,
  status            text default 'خروج',
  holiday_date      date,
  return_date       date,
  vacation_duration_type text,
  vacation_days     integer,
  out_date          date,
  out_type          text,
  out_note          text,
  committee_date    date,
  state_expense_status text,
  state_expense_end_date date,
  state_expense_notes text,
  created_at        timestamptz default now()
);

create table if not exists accounts (
  id          text primary key,
  name        text not null,
  email       text unique not null,
  password    text not null,
  phone       text,
  approved    text default 'انتظار المراجعة',
  position    text default 'مستخدم',
  patients_show           text default 'لا',
  patients_add            text default 'لا',
  patients_edit           text default 'لا',
  patients_delete         text default 'لا',
  patients_print          text default 'لا',
  users_show              text default 'لا',
  users_add               text default 'لا',
  users_edit              text default 'لا',
  users_delete            text default 'لا',
  statistics_show         text default 'لا',
  statistics_print        text default 'لا',
  age_statistics_show     text default 'لا',
  age_statistics_print    text default 'لا',
  normal_statistics_show  text default 'لا',
  normal_statistics_print text default 'لا',
  missing_numbers_show    text default 'لا',
  checkout_log_show       text default 'لا',
  checkout_log_edit       text default 'لا',
  vacations_show          text default 'لا',
  vacations_click         text default 'لا',
  internal_review_show    text default 'لا',
  internal_review_edit_order text default 'لا',
  internal_review_actions text default 'لا',
  state_expense_show      text default 'لا',
  state_expense_edit      text default 'لا',
  created_at      timestamptz default now()
);

-- ===== إضافة الأعمدة المفقودة للجداول الموجودة =====

-- للمرضى
ALTER TABLE patients ADD COLUMN IF NOT EXISTS review_number integer;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS committee_date date;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state_expense_status text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state_expense_end_date date;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state_expense_notes text;

-- للخروج
ALTER TABLE exits ADD COLUMN IF NOT EXISTS committee_date date;
ALTER TABLE exits ADD COLUMN IF NOT EXISTS state_expense_status text;
ALTER TABLE exits ADD COLUMN IF NOT EXISTS state_expense_end_date date;
ALTER TABLE exits ADD COLUMN IF NOT EXISTS state_expense_notes text;

-- للحسابات
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS approved text DEFAULT 'انتظار المراجعة';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS position text DEFAULT 'مستخدم';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS patients_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS patients_add text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS patients_edit text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS patients_delete text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS patients_print text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS users_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS users_add text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS users_edit text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS users_delete text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS statistics_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS statistics_print text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS age_statistics_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS age_statistics_print text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS normal_statistics_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS normal_statistics_print text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS missing_numbers_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS checkout_log_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS checkout_log_edit text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS vacations_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS vacations_click text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS internal_review_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS internal_review_edit_order text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS internal_review_actions text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS state_expense_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS state_expense_edit text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS state_expense_follow_up_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS state_expense_follow_up_edit text DEFAULT 'لا';

-- ===== تفعيل الحسابات الموجودة =====
UPDATE accounts SET approved = 'موافق' WHERE approved IS NULL OR approved = 'انتظار المراجعة';
UPDATE accounts SET
  patients_show = 'نعم', patients_add = 'نعم', patients_edit = 'نعم', patients_delete = 'نعم', patients_print = 'نعم',
  users_show = 'نعم', users_add = 'نعم', users_edit = 'نعم', users_delete = 'نعم',
  statistics_show = 'نعم', statistics_print = 'نعم',
  age_statistics_show = 'نعم', age_statistics_print = 'نعم',
  normal_statistics_show = 'نعم', normal_statistics_print = 'نعم',
  missing_numbers_show = 'نعم',
  checkout_log_show = 'نعم', checkout_log_edit = 'نعم',
  vacations_show = 'نعم', vacations_click = 'نعم',
  internal_review_show = 'نعم', internal_review_edit_order = 'نعم', internal_review_actions = 'نعم',
  state_expense_show = 'نعم', state_expense_edit = 'نعم',
  state_expense_follow_up_show = 'نعم', state_expense_follow_up_edit = 'نعم'
  WHERE patients_show IS NULL;

-- ===== إسقاط عمود permissions القديم (لو كان JSONB) =====
ALTER TABLE accounts DROP COLUMN IF EXISTS permissions;

-- ===== إيقاف RLS لتجنب أخطاء الوصول =====
alter table patients disable row level security;
alter table exits disable row level security;
alter table accounts disable row level security;

-- ===== تفعيل Realtime (مع تجاهل الخطأ لو الجدول مضاف بالفعل) =====
do $$
begin
  alter publication supabase_realtime add table patients;
exception when others then end;
$$;
do $$
begin
  alter publication supabase_realtime add table exits;
exception when others then end;
$$;
do $$
begin
  alter publication supabase_realtime add table accounts;
exception when others then end;
$$;

-- ===== إنشاء/تحديث حساب المدير (abomrzk@gmail.com / mm) بكل الصلاحيات =====
do $$
begin
  update accounts set
    password = 'mm', approved = 'موافق', position = 'مدير',
    patients_show = 'نعم', patients_add = 'نعم', patients_edit = 'نعم', patients_delete = 'نعم', patients_print = 'نعم',
    users_show = 'نعم', users_add = 'نعم', users_edit = 'نعم', users_delete = 'نعم',
    statistics_show = 'نعم', statistics_print = 'نعم',
    age_statistics_show = 'نعم', age_statistics_print = 'نعم',
    normal_statistics_show = 'نعم', normal_statistics_print = 'نعم',
    missing_numbers_show = 'نعم',
    checkout_log_show = 'نعم', checkout_log_edit = 'نعم',
    vacations_show = 'نعم', vacations_click = 'نعم',
    internal_review_show = 'نعم', internal_review_edit_order = 'نعم', internal_review_actions = 'نعم',
    state_expense_show = 'نعم', state_expense_edit = 'نعم',
    state_expense_follow_up_show = 'نعم', state_expense_follow_up_edit = 'نعم'
  where email = 'abomrzk@gmail.com';

  if not found then
    insert into accounts (id, name, email, password, phone, approved, position,
      patients_show, patients_add, patients_edit, patients_delete, patients_print,
      users_show, users_add, users_edit, users_delete,
      statistics_show, statistics_print,
      age_statistics_show, age_statistics_print,
      normal_statistics_show, normal_statistics_print,
      missing_numbers_show,
      checkout_log_show, checkout_log_edit,
      vacations_show, vacations_click,
      internal_review_show, internal_review_edit_order, internal_review_actions,
      state_expense_show, state_expense_edit,
      state_expense_follow_up_show, state_expense_follow_up_edit)
    values (
      'admin-001', 'المدير', 'abomrzk@gmail.com', 'mm', '', 'موافق', 'مدير',
      'نعم','نعم','نعم','نعم','نعم',
      'نعم','نعم','نعم','نعم',
      'نعم','نعم','نعم','نعم',
      'نعم','نعم','نعم',
      'نعم','نعم','نعم','نعم',
      'نعم','نعم','نعم',
      'نعم','نعم',
      'نعم','نعم');
  end if;
end;
$$;
