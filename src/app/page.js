'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import * as API from '@/lib/api';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Home() {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [exits, setExits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = useCallback(async () => {
    try {
      const result = await API.getAllPatients();
      setPatients(result.patients);
    } catch {}
  }, []);

  const loadExits = useCallback(async () => {
    try {
      const result = await API.getAllExits();
      setExits(result.exits);
    } catch {}
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const result = await API.getAllUsers();
      setUsers(result);
      setUser(prev => {
        if (!prev) return prev;
        const freshMe = result.find(x => x.id === prev.id);
        if (freshMe) {
          localStorage.setItem('currentUser', JSON.stringify(freshMe));
          return freshMe;
        }
        return prev;
      });
    } catch {}
  }, []);

  const loadAll = useCallback(() => {
    loadPatients();
    loadExits();
    loadUsers();
  }, [loadPatients, loadExits, loadUsers]);

  // Realtime subscriptions
  const channelsRef = useRef([]);
  useEffect(() => {
    if (!user) return;
    const pCh = API.subscribePatients(() => loadPatients());
    const eCh = API.subscribeExits(() => loadExits());
    const uCh = API.subscribeUsers(() => loadUsers());
    channelsRef.current = [pCh, eCh, uCh];
    return () => {
      channelsRef.current.forEach(ch => API.unsubscribeChannel(ch));
      channelsRef.current = [];
    };
  }, [user, loadPatients, loadExits, loadUsers]);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        // تحديث الاسم/الصلاحية من السيرفر في الخلفية
        API.getAccountById(u.id).then(fresh => {
          if (fresh) {
            setUser(prev => prev ? { ...prev, name: fresh.name, position: fresh.position, approved: fresh.approved } : prev);
          }
        }).catch(() => {});
      } catch {}
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    const result = await API.loginUser(email, password);
    if (result.success) {
      setUser(result.user);
      localStorage.setItem('currentUser', JSON.stringify(result.user));
    }
    return result;
  };

  const handleLogout = () => {
    // تنظيف الاشتراكات
    channelsRef.current.forEach(ch => API.unsubscribeChannel(ch));
    channelsRef.current = [];
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const handlePermissionCheck = (mod, action = 'show') => {
    if (!user || !user.permissions) return false;
    // الضمان الوحيد للأدمن الأساسي هو صفحة المستخدمين حتى لا يفقد السيطرة، باقي الصلاحيات تتأثر بعلامات الصح
    if (user.email === 'abomrzk@gmail.com' && mod === 'users') return true;
    return !!(user.permissions[mod] && user.permissions[mod][action]);
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" />
    </div>;
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <Dashboard
        user={user}
        patients={patients}
        exits={exits}
        users={users}
        onLogout={handleLogout}
        hasPerm={handlePermissionCheck}
        loadPatients={loadPatients}
        loadExits={loadExits}
        loadUsers={loadUsers}
        loadAll={loadAll}
      />
    </ErrorBoundary>
  );
}
