-- إضافة صلاحيات متابعة نفقة الدولة
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS state_expense_follow_up_show text DEFAULT 'لا';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS state_expense_follow_up_edit text DEFAULT 'لا';

-- تعطيلها لكل المستخدمين الحاليين
UPDATE accounts SET state_expense_follow_up_show = 'لا', state_expense_follow_up_edit = 'لا';
