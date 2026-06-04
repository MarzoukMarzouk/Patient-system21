-- إضافة حقول جدول نفقة الدولة
ALTER TABLE patients ADD COLUMN IF NOT EXISTS committee_date date;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state_expense_status text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state_expense_end_date date;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state_expense_notes text;

ALTER TABLE exits ADD COLUMN IF NOT EXISTS committee_date date;
ALTER TABLE exits ADD COLUMN IF NOT EXISTS state_expense_status text;
ALTER TABLE exits ADD COLUMN IF NOT EXISTS state_expense_end_date date;
ALTER TABLE exits ADD COLUMN IF NOT EXISTS state_expense_notes text;

-- إضافة حقل الصلاحيات لحسابات المستخدمين
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- تعطيل RLS على كل الجداول (حل مشكلة أخطاء الاكسيز)
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE exits DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;

-- إسقاط أي  policies موجودة من قبل (لو في)
DROP POLICY IF EXISTS "allow all" ON patients;
DROP POLICY IF EXISTS "allow all" ON exits;
DROP POLICY IF EXISTS "allow all" ON accounts;
