import { getSupabase } from './supabase';

const SCHEMA = 'nursing_roster';

function db() {
  return getSupabase().schema(SCHEMA);
}

// ==================== USERS ====================

export async function getNursingUsers() {
  const { data, error } = await db().from('users').select('*').order('id');
  if (error) throw error;
  return data;
}

export async function getNursingUserById(id) {
  const { data, error } = await db().from('users').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function loginNursingUser(emailOrPhone, password) {
  const { data, error } = await db()
    .from('users')
    .select('*')
    .or(`email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
    .eq('password', password)
    .eq('is_active', true)
    .single();
  if (error || !data) return null;
  return data;
}

export async function createNursingAccount(userData) {
  const { data, error } = await db().from('users').insert({
    full_name: userData.fullName,
    email: userData.email || null,
    phone: userData.phone || null,
    password: userData.password,
    role: userData.role || 'nurse',
    is_active: true,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateNursingUser(id, updates) {
  const { error } = await db().from('users').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteNursingUser(id) {
  const { error } = await db().from('users').delete().eq('id', id);
  if (error) throw error;
}

// ==================== SESSIONS ====================

export async function createSession(userId, token, expiresAt) {
  const { data, error } = await db().from('user_sessions').insert({
    user_id: userId,
    session_token: token,
    expires_at: expiresAt,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getSessionByToken(token) {
  const { data, error } = await db()
    .from('user_sessions')
    .select('*, users(*)')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  if (error) return null;
  return data;
}

export async function deleteSession(token) {
  const { error } = await db().from('user_sessions').delete().eq('session_token', token);
  if (error) throw error;
}

export async function updateSessionActivity(token) {
  const { error } = await db().from('user_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('session_token', token);
  if (error) throw error;
}

// ==================== SCHEDULES ====================

export async function getSchedules(filters = {}) {
  let query = db().from('schedules').select('*');
  if (filters.nurseName) query = query.eq('nurse_name', filters.nurseName);
  if (filters.month) query = query.eq('month', filters.month);
  if (filters.scheduleSystem) query = query.eq('schedule_system', filters.scheduleSystem);
  query = query.order('nurse_name').order('month');
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getScheduleByNurseAndMonth(nurseName, month) {
  const { data, error } = await db()
    .from('schedules')
    .select('*')
    .eq('nurse_name', nurseName)
    .eq('month', month)
    .single();
  if (error) return null;
  return data;
}

export async function upsertSchedule(scheduleData) {
  const { data, error } = await db().from('schedules').upsert({
    nurse_name: scheduleData.nurseName,
    month: scheduleData.month,
    work_type: scheduleData.workType || 'mixed',
    selected_days: scheduleData.selectedDays || [],
    schedule_system: scheduleData.scheduleSystem || '24',
    selected_shifts: scheduleData.selectedShifts || [],
  }, { onConflict: 'nurse_name, month' }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSchedule(id) {
  const { error } = await db().from('schedules').delete().eq('id', id);
  if (error) throw error;
}

// ==================== ABSENCES ====================

export async function getAbsences(filters = {}) {
  let query = db().from('absences').select('*');
  if (filters.nurseName) query = query.eq('nurse_name', filters.nurseName);
  if (filters.month) query = query.eq('month', filters.month);
  query = query.order('absence_date', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addAbsence(nurseName, absenceDate) {
  const month = new Date(absenceDate).getMonth() + 1;
  const { data, error } = await db().from('absences').insert({
    nurse_name: nurseName,
    absence_date: absenceDate,
    month,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAbsence(id) {
  const { error } = await db().from('absences').delete().eq('id', id);
  if (error) throw error;
}

// ==================== SETTINGS ====================

export async function getSetting(key) {
  const { data, error } = await db().from('settings').select('value').eq('key', key).single();
  if (error) return null;
  return data.value;
}

export async function setSetting(key, value, updatedBy = null) {
  const { error } = await db().from('settings').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
  if (error) throw error;
}

export async function getAllSettings() {
  const { data, error } = await db().from('settings').select('*');
  if (error) throw error;
  return data;
}

// ==================== LEAVE BALANCE ====================

export async function getLeaveBalance(nurseName) {
  const { data, error } = await db().from('leave_balance').select('*').eq('nurse_name', nurseName).single();
  if (error) return null;
  return data;
}

export async function getAllLeaveBalances() {
  const { data, error } = await db().from('leave_balance').select('*').order('nurse_name');
  if (error) throw error;
  return data;
}

export async function upsertLeaveBalance(balanceData) {
  const { data, error } = await db().from('leave_balance').upsert({
    nurse_name: balanceData.nurseName,
    holiday_balance: balanceData.holidayBalance ?? 0,
    annual_balance: balanceData.annualBalance ?? 0,
    casual_balance: balanceData.casualBalance ?? 0,
  }, { onConflict: 'nurse_name' }).select().single();
  if (error) throw error;
  return data;
}

// ==================== LEAVE RECORDS ====================

export async function getLeaveRecords(filters = {}) {
  let query = db().from('leave_records').select('*');
  if (filters.nurseName) query = query.eq('nurse_name', filters.nurseName);
  if (filters.leaveType) query = query.eq('leave_type', filters.leaveType);
  query = query.order('leave_date', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addLeaveRecord(record) {
  const { data, error } = await db().from('leave_records').insert({
    nurse_name: record.nurseName,
    leave_date: record.leaveDate,
    leave_type: record.leaveType,
    shift: record.shift || null,
    notes: record.notes || null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLeaveRecord(id) {
  const { error } = await db().from('leave_records').delete().eq('id', id);
  if (error) throw error;
}

export async function updateLeaveRecord(id, updates) {
  const { error } = await db().from('leave_records').update(updates).eq('id', id);
  if (error) throw error;
}
