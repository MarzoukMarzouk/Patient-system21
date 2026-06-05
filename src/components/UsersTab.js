import { useState, useEffect, useCallback, useRef } from 'react';
import * as API from '@/lib/api';

const PERM_MODULES = [
  { module: 'patients', label: 'المرضى', actions: ['show', 'add', 'edit', 'delete', 'print'] },
  { module: 'users', label: 'المستخدمين', actions: ['show', 'add', 'edit', 'delete'] },
  { module: 'statistics', label: 'الإحصائيات', actions: ['show', 'print'] },
  { module: 'age_statistics', label: 'احصائيات بالسن', actions: ['show', 'print'] },
  { module: 'normal_statistics', label: 'طبيعيين', actions: ['show', 'print'] },
  { module: 'missing_numbers', label: 'الأرقام الناقصة', actions: ['show'] },
  { module: 'checkout_log', label: 'سجل الخروج', actions: ['show', 'edit'] },
  { module: 'vacations', label: 'الإجازات', actions: ['show', 'click'] },
  { module: 'internal_review', label: 'مراجعة الباطنة', actions: ['show', 'edit_order', 'actions'] },
  { module: 'state_expense', label: 'نفقة الدولة', actions: ['show', 'edit'] },
  { module: 'state_expense_follow_up', label: 'متابعة نفقة الدولة', actions: ['show', 'edit'] },
];

const ACTION_LABELS = {
  show: 'عرض', add: 'إضافة', edit: 'تعديل', delete: 'حذف', print: 'طباعة',
  click: 'تفعيل', edit_order: 'ترتيب', actions: 'إجراء', edit_password: 'تعديل الباسورد'
};

const HEADER_COLORS = {
  patients: 'primary',
  users: 'info',
  statistics: 'dark',
  age_statistics: 'dark',
  normal_statistics: 'dark',
  missing_numbers: 'secondary',
  checkout_log: 'warning',
  vacations: 'danger',
  internal_review: 'success',
  state_expense: 'primary',
};

export default function UsersTab({ user, hasPerm }) {
  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [toast, setToast] = useState({ msg: '', type: 'info' });
  const [realtimeOn, setRealtimeOn] = useState(true);
  const channelsRef = useRef([]);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'info' }), 2500);
  };

  const loadUsers = useCallback(async () => {
    try {
      const data = await API.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Realtime — التحديث لحظي لأي تشيك بوكس يتغير في القاعدة
  useEffect(() => {
    if (!hasPerm || !hasPerm('users', 'show')) return;
    let ch = null;
    try {
      ch = API.subscribeUsers(() => {
        loadUsers();
        showToast('تم تحديث الصلاحيات لحظياً', 'success');
      });
      channelsRef.current = [ch];
    } catch (err) {
      console.error('Realtime subscribe failed:', err);
    }
    return () => {
      if (ch) {
        try { API.unsubscribeChannel(ch); } catch (e) { /* ignore */ }
      }
      channelsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handlePermToggle = async (userId, mod, act, val) => {
    const u = users.find(x => x.id == userId);
    if (!u) return;
    if (!u.permissions) u.permissions = {};
    if (!u.permissions[mod]) u.permissions[mod] = {};
    u.permissions[mod][act] = val;

    try {
      await API.updateUser({ id: userId, name: u.name, email: u.email, password: '', permissions: u.permissions });
      // سيتم التحديث لحظياً عبر الـ Realtime
    } catch (err) {
      showToast('فشل التحديث: ' + err.message, 'danger');
      loadUsers(); // رجوع للحالة السابقة
    }
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await API.updateUser({ id: editId, ...form });
        showToast('تم تحديث المستخدم بنجاح', 'success');
      } else {
        const r = await API.createAccount(form.name, form.email, form.password, '');
        if (!r.success) { showToast(r.message, 'danger'); return; }
        showToast(r.message, 'success');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      showToast('خطأ: ' + err.message, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف المستخدم؟')) return;
    try {
      await API.deleteUser(id);
      showToast('تم الحذف بنجاح', 'success');
      loadUsers();
    } catch (err) {
      showToast('خطأ: ' + err.message, 'danger');
    }
  };

  const toggleRealtime = () => {
    if (realtimeOn) {
      channelsRef.current.forEach(c => API.unsubscribeChannel(c));
      channelsRef.current = [];
    } else {
      const ch = API.subscribeUsers(() => loadUsers());
      channelsRef.current = [ch];
    }
    setRealtimeOn(!realtimeOn);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <h3 className="mb-0">إدارة المستخدمين</h3>
          <span className="badge bg-secondary">{users.length}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" id="realtimeSwitch" checked={realtimeOn}
              onChange={toggleRealtime} />
            <label className="form-check-label small" htmlFor="realtimeSwitch">
              تحديث لحظي
            </label>
          </div>
          {hasPerm('users', 'add') && (
            <button className="btn btn-success btn-sm" onClick={() => {
              setEditId(null);
              setForm({ name: '', email: '', password: '' });
              setShowModal(true);
            }}>
              <i className="bi bi-plus-lg"></i> إضافة مستخدم
            </button>
          )}
        </div>
      </div>

      {toast.msg && (
        <div className={`alert alert-${toast.type} py-2`}>{toast.msg}</div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-hover text-center align-middle" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
          <thead className="align-middle" style={{ backgroundColor: '#f8f9fa' }}>
            <tr style={{ borderBottom: '2px solid #dee2e6' }}>
              <th rowSpan="2" className="align-middle" style={{ minWidth: 150 }}>الاسم / الايميل</th>
              {PERM_MODULES.map(m => {
                const c = HEADER_COLORS[m.module] || 'secondary';
                return (
                  <th key={m.module} colSpan={m.actions.length}
                    className={`bg-${c} bg-opacity-10 text-${c} border-${c} border-opacity-25`}
                    style={c === 'warning' || c === 'info' ? { color: c === 'warning' ? '#664d03' : '#055160' } : {}}>
                    {m.label}
                  </th>
                );
              })}
              <th rowSpan="2" className="align-middle">تعديلات</th>
            </tr>
            <tr style={{ fontSize: '0.85rem' }} className="bg-light text-muted">
              {PERM_MODULES.map(m => m.actions.map(a => (
                <th key={`${m.module}-${a}`} style={{ fontWeight: 'normal' }}>{ACTION_LABELS[a] || a}</th>
              )))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="text-start">
                  <strong>{u.name}</strong>
                  {u.position === 'مدير' && <span className="badge bg-primary ms-1">مدير</span>}
                  {u.approved === 'انتظار المراجعة' && <span className="badge bg-warning text-dark ms-1">قيد المراجعة</span>}
                  <br />
                  <small className="text-muted">{u.email}</small>
                </td>
                {PERM_MODULES.map(m => m.actions.map(a => {
                  const checked = !!(u.permissions?.[m.module]?.[a]);
                  return (
                    <td key={`${u.id}-${m.module}-${a}`}>
                      <input type="checkbox" className="form-check-input"
                        checked={checked}
                        onChange={e => handlePermToggle(u.id, m.module, a, e.target.checked)}
                        disabled={!hasPerm('users', 'edit')}
                        style={{ transform: 'scale(1.3)' }} />
                    </td>
                  );
                }))}
                <td>
                  {hasPerm('users', 'edit') && (
                    <button className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => {
                        setEditId(u.id);
                        setForm({ name: u.name, email: u.email, password: '' });
                        setShowModal(true);
                      }}>
                      <i className="bi bi-pencil"></i>
                    </button>
                  )}
                  {hasPerm('users', 'delete') && u.id !== user.id && (
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">الاسم</label>
                  <input type="text" className="form-control" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input type="email" className="form-control" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">كلمة المرور {editId ? '(اتركه فارغاً إذا لم ترد التغيير)' : ''}</label>
                  <input type="password" className="form-control" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    {...(!editId ? { required: true } : {})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                {editId && hasPerm('users', 'delete') && (
                  <button type="button" className="btn btn-danger me-auto" onClick={async () => {
                    if (!confirm('حذف المستخدم؟')) return;
                    await handleDelete(editId);
                    setShowModal(false);
                  }}>حذف</button>
                )}
                <button type="button" className="btn btn-primary" onClick={handleSave}>حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
