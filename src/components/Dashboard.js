import { useState, useEffect } from 'react';
import PatientsTab from './PatientsTab';
import StateExpenseTab from './StateExpenseTab';
import ExitsTab from './ExitsTab';
import VacationsTab from './VacationsTab';
import UsersTab from './UsersTab';
import * as API from '@/lib/api';

export default function Dashboard({ user, patients, exits, onLogout, hasPerm, loadPatients, loadExits, loadAll }) {
  const [activeTab, setActiveTab] = useState('patients');

  const tabs = [
    { id: 'patients', label: 'المرضى', check: () => hasPerm('patients') },
    { id: 'stateExpense', label: 'نفقة الدولة', check: () => hasPerm('state_expense') },
    { id: 'vacations', label: 'الإجازات', check: () => hasPerm('vacations') },
    { id: 'exits', label: 'سجل الخروج', check: () => hasPerm('checkout_log') },
    { id: 'users', label: 'المستخدمين', check: () => hasPerm('users') },
  ].filter(t => t.check());

  useEffect(() => { loadAll(); }, [loadAll]);

  const renderTab = () => {
    switch (activeTab) {
      case 'patients':
        return <PatientsTab patients={patients} hasPerm={hasPerm} loadPatients={loadPatients} loadExits={loadExits} />;
      case 'stateExpense':
        return <StateExpenseTab patients={patients} hasPerm={hasPerm} loadPatients={loadPatients} />;
      case 'vacations':
        return <VacationsTab patients={patients} hasPerm={hasPerm} />;
      case 'exits':
        return <ExitsTab exits={exits} hasPerm={hasPerm} loadPatients={loadPatients} loadExits={loadExits} />;
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
          <div className="d-flex align-items-center">
            <span className="navbar-text me-2 small d-none d-sm-inline">مرحباً، {user.name}</span>
            <button className="btn btn-outline-light btn-sm" onClick={onLogout}>خروج</button>
          </div>
        </div>
      </nav>
      <div className="container-fluid px-2 mt-2">
        <ul className="nav nav-tabs mb-2">
          {tabs.map(t => (
            <li className="nav-item" key={t.id}>
              <button className={`nav-link ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="tab-content">{renderTab()}</div>
      </div>
    </div>
  );
}
