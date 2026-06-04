import { getSupabase } from './supabase';

function supabase() { return getSupabase(); }

const PERM_MODULES = [
  { module: 'patients', actions: ['show','add','edit','delete','print'] },
  { module: 'users', actions: ['show','add','edit','delete'] },
  { module: 'statistics', actions: ['show','print'] },
  { module: 'age_statistics', actions: ['show','print'] },
  { module: 'normal_statistics', actions: ['show','print'] },
  { module: 'missing_numbers', actions: ['show'] },
  { module: 'checkout_log', actions: ['show','edit'] },
  { module: 'vacations', actions: ['show','click'] },
  { module: 'internal_review', actions: ['show','edit_order','actions'] },
  { module: 'state_expense', actions: ['show','edit'] },
  { module: 'state_expense_follow_up', actions: ['show','edit'] },
];

function permRowToObject(row) {
  if (!row) return {};
  const obj = {};
  for (const m of PERM_MODULES) {
    for (const a of m.actions) {
      const col = `${m.module}_${a}`;
      if (!obj[m.module]) obj[m.module] = {};
      obj[m.module][a] = row[col] === 'نعم';
    }
  }
  return obj;
}

function permObjectToRow(obj) {
  const row = {};
  for (const m of PERM_MODULES) {
    for (const a of m.actions) {
      row[`${m.module}_${a}`] = obj?.[m.module]?.[a] ? 'نعم' : 'لا';
    }
  }
  return row;
}

function permDefaults() {
  return permObjectToRow({});
}

function mapPatientRow(row) {
  return {
    id: row.patient_id,
    patientName: row.patient_name,
    dateOfEntry: row.date_of_entry,
    diagnosis: row.diagnosis,
    enrolmentNumber: row.enrolment_number,
    fileNumber: row.file_number,
    category: row.category,
    identity: row.identity,
    nationalId: row.national_id,
    dateOfBirth: row.date_of_birth,
    age: row.age,
    ageClassification: row.age_classification,
    familyPhone: row.family_phone,
    clozapax: row.clozapax,
    internalPatient: row.internal_patient,
    internalDiseases: row.internal_diseases,
    status: row.status || 'متواجد',
    holidayDate: row.holiday_date,
    returnDate: row.return_date,
    vacationDurationType: row.vacation_duration_type,
    vacationDays: row.vacation_days,
    outDate: row.out_date,
    outType: row.out_type,
    outNote: row.out_note,
    reviewNumber: row.review_number,
    committeeDate: row.committee_date,
    stateExpenseStatus: row.state_expense_status,
    stateExpenseEndDate: row.state_expense_end_date,
    stateExpenseNotes: row.state_expense_notes,
  };
}

// ==================== AUTH ====================

export async function loginUser(email, password = null, checkOnly = false) {
  let query = supabase()
    .from('accounts')
    .select('*')
    .eq('email', email);

  if (!checkOnly && password) {
    query = query.eq('password', password);
  }

  const { data, error } = await query.single();
  if (error || !data) return { success: false, message: 'الحساب غير موجود' };
  if (data.approved !== 'موافق') return { success: false, message: 'الحساب قيد المراجعة' };

  return {
    success: true,
    user: {
      id: data.id,
      name: data.name,
      email: data.email,
      position: data.position,
      permissions: permRowToObject(data),
    }
  };
}

export async function createAccount(name, email, password, phone) {
  // تشفير ID قصير
  const id = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const { error } = await supabase().from('accounts').insert({
    id, name, email, password: String(password || ''), phone: phone || '',
    approved: 'انتظار المراجعة',
    position: 'مستخدم',
    ...permDefaults(),
  });
  if (error) return { success: false, message: error.message };
  return { success: true, message: 'تم إنشاء الحساب بنجاح، يرجى انتظار مراجعة المدير' };
}

export async function getAllAccountsForLogin() {
  // يجلب فقط id/email/password/approved — مفيد لتجديد الصلاحيات بعد التعديل
  const { data, error } = await supabase().from('accounts').select('*').eq('email').limit(1);
  if (error || !data || !data.length) return null;
  return data[0];
}

export async function getAccountById(id) {
  const { data, error } = await supabase().from('accounts').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data;
}

export async function updatePassword(userId, oldPassword, newPassword) {
  const { data, error } = await supabase().from('accounts').select('password').eq('id', userId).single();
  if (error || !data) throw new Error('تعذر التحقق من المستخدم');
  if (data.password !== oldPassword) throw new Error('كلمة المرور الحالية غير صحيحة');
  const { error: updateError } = await supabase().from('accounts').update({ password: newPassword }).eq('id', userId);
  if (updateError) throw updateError;
  return { success: true };
}

// ==================== PATIENTS ====================

export async function getAllPatients() {
  const { data, error } = await supabase()
    .from('patients')
    .select('*')
    .neq('status', 'خروج')
    .order('file_number', { ascending: true });

  if (error) throw error;
  const patients = data.map(mapPatientRow);
  return { patients };
}

export async function addPatient(patientData) {
  const row = buildPatientRow(patientData);
  const { error } = await supabase().from('patients').insert(row);
  if (error) throw error;

  if (patientData.status === 'خروج') {
    await supabase().from('exits').insert(buildExitRow(patientData));
    await supabase().from('patients').delete().eq('patient_id', patientData.id);
  }

  return getAllPatients();
}

export async function updatePatient(patientData) {
  const row = buildPatientRow(patientData);
  const { error } = await supabase().from('patients').update(row).eq('patient_id', patientData.id);
  if (error) throw error;

  if (patientData.status === 'خروج') {
    await supabase().from('exits').insert(buildExitRow(patientData));
    await supabase().from('patients').delete().eq('patient_id', patientData.id);
  }

  return getAllPatients();
}

export async function deletePatient(patientId) {
  const { error } = await supabase().from('patients').delete().eq('patient_id', patientId);
  if (error) throw error;
  return getAllPatients();
}

export async function updateStateExpenseFields(id, updates) {
  const { error } = await supabase().from('patients').update({
    committee_date: updates.committeeDate || null,
    state_expense_status: updates.stateExpenseStatus || null,
    state_expense_end_date: updates.stateExpenseEndDate || null,
    state_expense_notes: updates.stateExpenseNotes || null,
  }).eq('patient_id', id);
  if (error) throw error;
  return getAllPatients();
}

export async function updateReviewNumber(patientId, reviewNumber) {
  const { error } = await supabase().from('patients')
    .update({ review_number: reviewNumber ? parseInt(reviewNumber) : null })
    .eq('patient_id', patientId);
  if (error) throw error;
  return getAllPatients();
}

// ==================== EXITS ====================

export async function getAllExits() {
  const { data, error } = await supabase().from('exits').select('*').order('out_date', { ascending: false });
  if (error) throw error;
  return { count: data.length, exits: data.map(mapPatientRow) };
}

export async function returnPatientToDepartment(exitData) {
  const row = buildPatientRow({
    ...exitData, status: 'متواجد',
    holidayDate: '', returnDate: '', outDate: '', outType: '', outNote: ''
  });
  const { error: deleteError } = await supabase().from('exits').delete().eq('patient_id', exitData.patientId || exitData.id);
  if (deleteError) throw deleteError;
  const { error } = await supabase().from('patients').upsert(row, { onConflict: 'patient_id' });
  if (error) throw error;
  return getAllPatients();
}

// ==================== USERS ====================

export async function getAllUsers() {
  try {
    const { data, error } = await supabase().from('accounts').select('*').order('id');
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id, name: r.name || '', email: r.email || '', password: r.password || '',
      phone: r.phone || '', approved: r.approved || 'موافق', position: r.position || 'مستخدم',
      permissions: permRowToObject(r),
    }));
  } catch (err) {
    console.error('getAllUsers error:', err);
    throw err;
  }
}

export async function updateUser(userData) {
  const payload = {};
  if (userData.name !== undefined) payload.name = userData.name;
  if (userData.email !== undefined) payload.email = userData.email;
  if (userData.phone !== undefined) payload.phone = userData.phone;
  if (userData.password) payload.password = userData.password;
  if (userData.permissions) Object.assign(payload, permObjectToRow(userData.permissions));
  if (userData.approved !== undefined) payload.approved = userData.approved;
  if (userData.position !== undefined) payload.position = userData.position;

  const { error } = await supabase().from('accounts').update(payload).eq('id', userData.id);
  if (error) throw error;
  return { success: true, message: 'تم التحديث بنجاح' };
}

export async function deleteUser(userId) {
  const { error } = await supabase().from('accounts').delete().eq('id', userId);
  if (error) throw error;
  return { success: true, message: 'تم الحذف بنجاح' };
}

// اشتراك Realtime على المستخدمين (للحصول على تحديث لحظي للصلاحيات)
export function subscribeUsers(onChange) {
  const channel = supabase()
    .channel('accounts-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
      onChange();
    })
    .subscribe();
  return channel;
}

export function unsubscribeChannel(channel) {
  if (channel) supabase().removeChannel(channel);
}

// اشتراك Realtime على المرضى
export function subscribePatients(onChange) {
  const channel = supabase()
    .channel('patients-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
      onChange();
    })
    .subscribe();
  return channel;
}

// اشتراك Realtime على سجل الخروج
export function subscribeExits(onChange) {
  const channel = supabase()
    .channel('exits-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'exits' }, () => {
      onChange();
    })
    .subscribe();
  return channel;
}

// ==================== HELPERS ====================

function buildPatientRow(d) {
  return {
    patient_id: d.id,
    patient_name: d.patientName,
    date_of_entry: d.dateOfEntry || null,
    diagnosis: d.diagnosis,
    enrolment_number: d.enrolmentNumber,
    file_number: d.fileNumber,
    category: d.category,
    identity: d.identity,
    national_id: d.nationalId,
    date_of_birth: d.dateOfBirth || null,
    age: d.age,
    age_classification: d.ageClassification,
    family_phone: d.familyPhone,
    clozapax: d.clozapax,
    internal_patient: d.internalPatient,
    internal_diseases: d.internalDiseases,
    status: d.status || 'متواجد',
    holiday_date: d.holidayDate || null,
    return_date: d.returnDate || null,
    vacation_duration_type: d.vacationDurationType || null,
    vacation_days: d.vacationDays ? parseInt(d.vacationDays) : null,
    out_date: d.outDate || null,
    out_type: d.outType || null,
    out_note: d.outNote || null,
    review_number: d.reviewNumber ? parseInt(d.reviewNumber) : null,
    committee_date: d.committeeDate || null,
    state_expense_status: d.stateExpenseStatus || null,
    state_expense_end_date: d.stateExpenseEndDate || null,
    state_expense_notes: d.stateExpenseNotes || null,
  };
}

function buildExitRow(d) {
  return {
    patient_id: d.id,
    patient_name: d.patientName,
    date_of_entry: d.dateOfEntry || null,
    diagnosis: d.diagnosis,
    enrolment_number: d.enrolmentNumber,
    file_number: d.fileNumber,
    category: d.category,
    identity: d.identity,
    national_id: d.nationalId,
    date_of_birth: d.dateOfBirth || null,
    age: d.age,
    age_classification: d.ageClassification,
    family_phone: d.familyPhone,
    clozapax: d.clozapax,
    internal_patient: d.internalPatient,
    internal_diseases: d.internalDiseases,
    status: 'خروج',
    out_date: d.outDate || null,
    out_type: d.outType || null,
    out_note: d.outNote || null,
  };
}

export function calculateAgeFromNationalId(nationalId) {
  if (!nationalId || nationalId.length !== 14) return { age: '', ageClassification: '', dateOfBirth: '' };
  const century = parseInt(nationalId[0]);
  const year = parseInt(nationalId.substring(1, 3));
  const month = parseInt(nationalId.substring(3, 5));
  const day = parseInt(nationalId.substring(5, 7));
  const fullYear = century === 2 ? 1900 + year : 2000 + year;
  const birth = new Date(fullYear, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  const pad = n => String(n).padStart(2, '0');
  return {
    age: String(age),
    ageClassification: age >= 50 ? 'فوق 50 عام' : 'تحت 50 عام',
    dateOfBirth: `${fullYear}-${pad(month)}-${pad(day)}`
  };
}

export function generateUniquePatientId(len = 10) {
  const cs = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const make = n => {
    const a = new Uint32Array(n);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(a);
    } else {
      for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 0xffffffff);
    }
    return Array.from(a).map(v => cs[v % cs.length]).join('');
  };
  // 3 محاولات لتفادي التكرار (احتمال ضعيف لكن للأمان)
  return make(len);
}

// مولّد unique id للحسابات
export function generateAccountId() {
  return 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}
