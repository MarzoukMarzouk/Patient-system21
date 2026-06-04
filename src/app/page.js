'use client';

import { useEffect, useState, useCallback } from 'react';
import * as API from '@/lib/api';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';

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
    } catch {}
  }, []);

  const loadAll = useCallback(() => {
    loadPatients();
    loadExits();
  }, [loadPatients, loadExits]);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
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
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const handlePermissionCheck = (mod, action = 'show') => {
    if (!user || !user.permissions) return false;
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
  );
}
