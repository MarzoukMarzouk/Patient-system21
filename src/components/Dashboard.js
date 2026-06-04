import { useState, useEffect } from 'react';
import PatientsTab from './PatientsTab';
import StateExpenseTab from './StateExpenseTab';
import ExitsTab from './ExitsTab';
import VacationsTab from './VacationsTab';
import UsersTab from './UsersTab';
import InternalReviewTab from './InternalReviewTab';
import StatsTab from './StatsTab';
import AgeStatsTab from './AgeStatsTab';
import NormalStatsTab from './NormalStatsTab';
import MissingNumbersTab from './MissingNumbersTab';
import * as API from '@/lib/api';

export default function Dashboard({ user, patients, exits, onLogout, hasPerm, loadPatients, loadExits, loadAll }) {
  const [activeTab, setActiveTab] = useState('patients');
  const [cpShow, setCpShow] = useState(false);
  const [cpForm, setCpForm] = useState({ old: '', newPw: '', confirm: '' });
  const [cpError, setCpError] = useState('');
  const [cpInfo, setCpInfo] = useState('');

  const tabs = [
    { id: 'patients', label: 'المرضى', check: () => hasPerm('patients') },
    { id: 'stateExpense', label: 'نفقة الدولة', check: () => hasPerm('state_expense') },
    { id: 'stats', label: 'الإحصائيات', check: () => hasPerm('statistics') },
    { id: 'ageStats', label: 'احصائيات بالسن', check: () => hasPerm('age_statistics') },
    { id: 'normalStats', label: 'طبيعيين', check: () => hasPerm('normal_statistics') },
    { id: 'vacations', label: 'الإجازات', check: () => hasPerm('vacations') },
    { id: 'exits', label: 'سجل الخروج', check: () => hasPerm('checkout_log') },
    { id: 'missingNumbers', label: 'الأرقام الناقصة', check: () => hasPerm('missing_numbers') },
    { id: 'internalReview', label: 'مراجعة الباطنة', check: () => hasPerm('internal_review') },
    { id: 'users', label: 'المستخدمين', check: () => hasPerm('users') },
  ].filter(t => t.check());

  // تأكد من أن التبويب النشط ضمن المتاحة
  useEffect(() => {
    if (!tabs.find(t => t.id === activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleChangePassword = async () => {
    setCpError('');
    setCpInfo('');
    if (!cpForm.old || !cpForm.newPw) { setCpError('يرجى ملء جميع الحقول'); return; }
    if (cpForm.newPw !== cpForm.confirm) { setCpError('كلمة المرور الجديدة غير متطابقة'); return; }
    if (cpForm.newPw.length < 4) { setCpError('كلمة المرور يجب أن تكون 4 أحرف على الأقل'); return; }
    try {
      await API.updatePassword(user.id, cpForm.old, cpForm.newPw);
      setCpInfo('تم تغيير كلمة المرور بنجاح ✓');
      setCpForm({ old: '', newPw: '', confirm: '' });
      setTimeout(() => { setCpShow(false); setCpInfo(''); }, 1500);
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
      case 'ageStats':
        return <AgeStatsTab patients={patients} hasPerm={hasPerm} />;
      case 'normalStats':
        return <NormalStatsTab patients={patients} hasPerm={hasPerm} />;
      case 'vacations':
        return <VacationsTab patients={patients} hasPerm={hasPerm}
          onEditPatient={(id) => { localStorage.setItem('editPatientNext', id); setActiveTab('patients'); }} />;
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
      <nav className="navbar navbar-dark bg-primary py-2 d-print-none">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h6">نظام إدارة المرضى</span>
          <div className="d-flex align-items-center gap-2">
            <span className="navbar-text me-2 small d-none d-sm-inline">
              مرحباً، {user.name}
              {user.position === 'مدير' && <span className="badge bg-warning text-dark ms-1">مدير</span>}
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={() => {
              setCpShow(true); setCpError(''); setCpInfo(''); setCpForm({ old: '', newPw: '', confirm: '' });
            }} title="تغيير كلمة المرور">
              <i className="bi bi-key"></i>
            </button>
            <button className="btn btn-outline-light btn-sm" onClick={onLogout}>خروج</button>
          </div>
        </div>
      </nav>
      <div className="container-fluid px-2 mt-2">
        <div className="mb-3 d-print-none">
          <select 
            className="form-select form-select-lg border-primary shadow-sm" 
            value={activeTab} 
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {tabs.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="tab-content">{renderTab()}</div>
      </div>

      {cpShow && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-key me-2"></i>تغيير كلمة المرور</h5>
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
                  <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                  <input type="password" className="form-control" value={cpForm.confirm}
                    onChange={e => setCpForm(f => ({ ...f, confirm: e.target.value }))} />
                </div>
                {cpError && <div className="alert alert-danger py-2">{cpError}</div>}
                {cpInfo && <div className="alert alert-success py-2">{cpInfo}</div>}
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
