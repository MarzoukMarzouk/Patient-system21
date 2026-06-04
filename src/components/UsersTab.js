import { useState, useEffect, useCallback } from 'react';
import * as API from '@/lib/api';

const PERM_MODULES = [
  { module: 'patients', label: 'المرضى', actions: ['show', 'add', 'edit', 'delete', 'print'] },
  { module: 'users', label: 'المستخدمين', actions: ['show', 'add', 'edit', 'delete'] },
  { module: 'statistics', label: 'الإحصائيات', actions: ['show', 'print'] },
  { module: 'age_statistics', label: 'إحصائيات بالسن', actions: ['show', 'print'] },
  { module: 'normal_statistics', label: 'طبيعيين', actions: ['show', 'print'] },
  { module: 'missing_numbers', label: 'الأرقام الناقصة', actions: ['show'] },
  { module: 'checkout_log', label: 'سجل الخروج', actions: ['show', 'edit'] },
  { module: 'vacations', label: 'الإجازات', actions: ['show', 'click'] },
  { module: 'internal_review', label: 'مراجعة الباطنة', actions: ['show', 'edit_order', 'actions'] },
  { module: 'state_expense', label: 'نفقة الدولة', actions: ['show', 'edit'] },
];

export default function UsersTab({ user, hasPerm }) {
  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const loadUsers = useCallback(async () => {
    try {
      const data = await API.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handlePermToggle = async (userId, mod, act, val) => {
    const u = users.find(x => x.id == userId);
    if (!u) return;
    if (!u.permissions) u.permissions = {};
    if (!u.permissions[mod]) u.permissions[mod] = {};
    u.permissions[mod][act] = val;

    try {
      await API.updateUser({ id: userId, name: u.name, email: u.email, password: '', permissions: u.permissions });
      loadUsers();
    } catch (err) {
      alert('فشل التحديث: ' + err.message);
    }
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await API.updateUser({ id: editId, ...form });
      } else {
        await API.createAccount(form.name, form.email, form.password, '');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف المستخدم؟')) return;
    try {
      await API.deleteUser(id);
      loadUsers();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">إدارة المستخدمين</h5>
        {hasPerm('users', 'add') && (
          <button className="btn btn-success btn-sm" onClick={() => { setEditId(null); setForm({ name: '', email: '', password: '' }); setShowModal(true); }}>
            <i className="bi bi-plus-lg"></i> إضافة مستخدم
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover text-center align-middle" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
          <thead className="align-middle bg-light">
            <tr>
              <th rowSpan="2" className="align-middle">الاسم</th>
              {PERM_MODULES.map(m => (
                <th key={m.module} colSpan={m.actions.length} className={m.module === 'state_expense' ? 'bg-primary bg-opacity-10' : ''}>
                  {m.label}
                </th>
              ))}
              <th rowSpan="2" className="align-middle">إجراءات</th>
            </tr>
            <tr className="text-muted" style={{ fontSize: '0.8rem' }}>
              {PERM_MODULES.map(m => m.actions.map(a => (
                <th key={`${m.module}-${a}`} style={{ fontWeight: 'normal' }}>
                  {a === 'show' ? 'عرض' : a === 'add' ? 'إضافة' : a === 'edit' ? 'تعديل' : a === 'delete' ? 'حذف' : a === 'print' ? 'طباعة' : a === 'click' ? 'نقر' : a === 'edit_order' ? 'ترتيب' : a === 'actions' ? 'إجراء' : a}
                </th>
              )))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="text-start"><strong>{u.name}</strong><br /><small className="text-muted">{u.email}</small></td>
                {PERM_MODULES.map(m => m.actions.map(a => {
                  const checked = !!(u.permissions?.[m.module]?.[a]);
                  return (
                    <td key={`${u.id}-${m.module}-${a}`}>
                      <input type="checkbox" className="form-check-input"
                        checked={checked}
                        onChange={e => handlePermToggle(u.id, m.module, a, e.target.checked)}
                        disabled={!hasPerm('users', 'edit')}
                        style={{ transform: 'scale(1.2)' }} />
                    </td>
                  );
                }))}
                <td>
                  {hasPerm('users', 'edit') && (
                    <button className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => { setEditId(u.id); setForm({ name: u.name, email: u.email, password: '' }); setShowModal(true); }}>
                      <i className="bi bi-pencil"></i>
                    </button>
                  )}
                  {hasPerm('users', 'delete') && (
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
                <h5 className="modal-title">{editId ? 'تعديل مستخدم' : 'إضافة مستخدم'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">الاسم</label>
                  <input type="text" className="form-control" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input type="email" className="form-control" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label">كلمة المرور {editId ? '(اتركه فارغاً إذا لم ترد التغيير)' : ''}</label>
                  <input type="password" className="form-control" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
