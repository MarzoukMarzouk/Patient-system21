import { useState, useEffect } from 'react';
import PatientsTab from './PatientsTab';
import StateExpenseTab from './StateExpenseTab';
import ExitsTab from './ExitsTab';
import VacationsTab from './VacationsTab';
import UsersTab from './UsersTab';
import InternalReviewTab from './InternalReviewTab';
import StatsTab from './StatsTab';
import MissingNumbersTab from './MissingNumbersTab';
import * as API from '@/lib/api';

export default function Dashboard({ user, patients, exits, onLogout, hasPerm, loadPatients, loadExits, loadAll }) {
  const [activeTab, setActiveTab] = useState('patients');
  const [cpShow, setCpShow] = useState(false);
  const [cpForm, setCpForm] = useState({ old: '', newPw: '', confirm: '' });
  const [cpError, setCpError] = useState('');

  const tabs = [
    { id: 'patients', label: 'المرضى', check: () => hasPerm('patients') },
    { id: 'stateExpense', label: 'نفقة الدولة', check: () => hasPerm('state_expense') },
    { id: 'stats', label: 'الإحصائيات', check: () => hasPerm('statistics') },
    { id: 'vacations', label: 'الإجازات', check: () => hasPerm('vacations') },
    { id: 'exits', label: 'سجل الخروج', check: () => hasPerm('checkout_log') },
    { id: 'missingNumbers', label: 'الأرقام الناقصة', check: () => hasPerm('missing_numbers') },
    { id: 'internalReview', label: 'مراجعة الباطنة', check: () => hasPerm('internal_review') },
    { id: 'users', label: 'المستخدمين', check: () => hasPerm('users') },
  ].filter(t => t.check());

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleChangePassword = async () => {
    setCpError('');
    if (!cpForm.old || !cpForm.newPw) { setCpError('يرجى ملء جميع الحقول'); return; }
    if (cpForm.newPw !== cpForm.confirm) { setCpError('كلمة المرور الجديدة غير متطابقة'); return; }
    if (cpForm.newPw.length < 4) { setCpError('كلمة المرور يجب أن تكون 4 أحرف على الأقل'); return; }
    try {
      await API.updatePassword(user.id, cpForm.old, cpForm.newPw);
      setCpShow(false);
      alert('تم تغيير كلمة المرور بنجاح');
    } catch (err) {
      setCpError(err.message);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'patients':
        return <PatientsTab patients={patients} hasPerm={hasPerm} loadPatients={loadPatients} loadExits={loadExits} />;
      case 'stateExpense':
        return <StateExpenseTab patients={patients} hasPerm={hasPerm} loadPatients={loadPatients} />;
      case 'stats':
        return <StatsTab patients={patients} hasPerm={hasPerm} />;
      case 'vacations':
        return <VacationsTab patients={patients} hasPerm={hasPerm} />;
      case 'exits':
        return <ExitsTab exits={exits} hasPerm={hasPerm} loadPatients={loadPatients} loadExits={loadExits} />;
      case 'internalReview':
        return <InternalReviewTab patients={patients} hasPerm={hasPerm} loadPatients={loadPatients}
          onEditPatient={(id) => { localStorage.setItem('editPatientNext', id); setActiveTab('patients'); }} />;
      case 'missingNumbers':
        return <MissingNumbersTab patients={patients} />;
      case 'users':
        return <UsersTab user={user} hasPerm={hasPerm} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <nav className="navbar navbar-dark bg-primary py-2">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h6">نظام إدارة المرضى</span>
          <div className="d-flex align-items-center gap-2">
            <span className="navbar-text me-2 small d-none d-sm-inline">مرحباً، {user.name}</span>
            <button className="btn btn-outline-light btn-sm" onClick={() => setCpShow(true)}>
              <i className="bi bi-key"></i>
            </button>
            <button className="btn btn-outline-light btn-sm" onClick={onLogout}>خروج</button>
          </div>
        </div>
      </nav>
      <div className="container-fluid px-2 mt-2">
        <ul className="nav nav-tabs mb-2">
          {tabs.map(t => (
            <li className="nav-item" key={t.id}>
              <button className={`nav-link ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="tab-content">{renderTab()}</div>
      </div>

      {cpShow && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">تغيير كلمة المرور</h5>
                <button type="button" className="btn-close" onClick={() => setCpShow(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">كلمة المرور الحالية</label>
                  <input type="password" className="form-control" value={cpForm.old}
                    onChange={e => setCpForm(f => ({ ...f, old: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label">كلمة المرور الجديدة</label>
                  <input type="password" className="form-control" value={cpForm.newPw}
                    onChange={e => setCpForm(f => ({ ...f, newPw: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label">تأكيد كلمة المرور</label>
                  <input type="password" className="form-control" value={cpForm.confirm}
                    onChange={e => setCpForm(f => ({ ...f, confirm: e.target.value }))} />
                </div>
                {cpError && <div className="alert alert-danger py-2">{cpError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCpShow(false)}>إلغاء</button>
                <button type="button" className="btn btn-primary" onClick={handleChangePassword}>حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
