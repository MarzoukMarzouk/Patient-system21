import { supabase } from './supabase';

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
  let query = supabase
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
      permissions: data.permissions || {},
    }
  };
}

export async function createAccount(name, email, password, phone) {
  const { error } = await supabase.from('accounts').insert({
    name, email, password, phone,
    approved: 'انتظار المراجعة',
    position: 'مستخدم',
    permissions: {}
  });
  if (error) return { success: false, message: error.message };
  return { success: true, message: 'تم إنشاء الحساب بنجاح، يرجى انتظار المراجعة' };
}

export async function updatePassword(userId, oldPassword, newPassword) {
  const { data, error } = await supabase.from('accounts').select('password').eq('id', userId).single();
  if (error || !data) throw new Error('تعذر التحقق من المستخدم');
  if (data.password !== oldPassword) throw new Error('كلمة المرور الحالية غير صحيحة');
  const { error: updateError } = await supabase.from('accounts').update({ password: newPassword }).eq('id', userId);
  if (updateError) throw updateError;
  return { success: true };
}

// ==================== PATIENTS ====================

export async function getAllPatients() {
  const { data, error } = await supabase
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
  const { error } = await supabase.from('patients').insert(row);
  if (error) throw error;

  if (patientData.status === 'خروج') {
    await supabase.from('exits').insert(buildExitRow(patientData));
    await supabase.from('patients').delete().eq('patient_id', patientData.id);
  }

  return getAllPatients();
}

export async function updatePatient(patientData) {
  const row = buildPatientRow(patientData);
  const { error } = await supabase.from('patients').update(row).eq('patient_id', patientData.id);
  if (error) throw error;

  if (patientData.status === 'خروج') {
    await supabase.from('exits').insert(buildExitRow(patientData));
    await supabase.from('patients').delete().eq('patient_id', patientData.id);
  }

  return getAllPatients();
}

export async function deletePatient(patientId) {
  const { error } = await supabase.from('patients').delete().eq('patient_id', patientId);
  if (error) throw error;
  return getAllPatients();
}

export async function updateStateExpenseFields(id, updates) {
  const { error } = await supabase.from('patients').update({
    committee_date: updates.committeeDate || null,
    state_expense_status: updates.stateExpenseStatus || null,
    state_expense_end_date: updates.stateExpenseEndDate || null,
    state_expense_notes: updates.stateExpenseNotes || null,
  }).eq('patient_id', id);
  if (error) throw error;
  return getAllPatients();
}

export async function updateReviewNumber(patientId, reviewNumber) {
  const { error } = await supabase.from('patients')
    .update({ review_number: reviewNumber ? parseInt(reviewNumber) : null })
    .eq('patient_id', patientId);
  if (error) throw error;
  return getAllPatients();
}

// ==================== EXITS ====================

export async function getAllExits() {
  const { data, error } = await supabase.from('exits').select('*').order('out_date', { ascending: false });
  if (error) throw error;
  return { count: data.length, exits: data.map(mapPatientRow) };
}

export async function returnPatientToDepartment(exitData) {
  const row = buildPatientRow({
    ...exitData,
    status: 'متواجد',
    holidayDate: '', returnDate: '', outDate: '', outType: '', outNote: ''
  });
  const { error: deleteError } = await supabase.from('exits').delete().eq('patient_id', exitData.patientId || exitData.id);
  if (deleteError) throw deleteError;
  const { error } = await supabase.from('patients').upsert(row, { onConflict: 'patient_id' });
  if (error) throw error;
  return getAllPatients();
}

// ==================== USERS ====================

export async function getAllUsers() {
  const { data, error } = await supabase.from('accounts').select('*').order('id');
  if (error) throw error;
  return data.map(r => ({
    id: r.id, name: r.name, email: r.email, password: r.password,
    phone: r.phone, approved: r.approved, position: r.position,
    permissions: r.permissions || {},
  }));
}

export async function updateUser(userData) {
  const payload = { name: userData.name, email: userData.email, phone: userData.phone };
  if (userData.password) payload.password = userData.password;
  if (userData.permissions) payload.permissions = userData.permissions;
  if (userData.approved) payload.approved = userData.approved;
  if (userData.position) payload.position = userData.position;

  const { error } = await supabase.from('accounts').update(payload).eq('id', userData.id);
  if (error) throw error;
  return { success: true, message: 'تم التحديث بنجاح' };
}

export async function deleteUser(userId) {
  const { error } = await supabase.from('accounts').delete().eq('id', userId);
  if (error) throw error;
  return { success: true, message: 'تم الحذف بنجاح' };
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
  return Array.from({ length: len })
    .map(() => cs[Math.floor(Math.random() * cs.length)])
    .join('');
}
