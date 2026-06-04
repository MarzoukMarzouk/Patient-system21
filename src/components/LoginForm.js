import { useState } from 'react';
import * as API from '@/lib/api';

export default function LoginForm({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    const result = await onLogin(email, password);
    if (!result.success) setError(result.message);
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    if (!name || !email || !password) {
      setError('يرجى ملء الاسم والبريد وكلمة المرور');
      setLoading(false);
      return;
    }
    if (password.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      setLoading(false);
      return;
    }
    const r = await API.createAccount(name, email, password, phone);
    if (r.success) {
      setInfo(r.message);
      setMode('login');
      setPassword('');
    } else {
      setError(r.message);
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError('أدخل البريد الإلكتروني أولاً'); return; }
    setError('');
    setInfo('تم إرسال تعليمات استرجاع كلمة المرور إلى بريدك (في حال تفعيلها من المدير).');
    // ملاحظة: في الإصدار الحالي النظام يعتمد على المدير لتغيير كلمة المرور من حسابه.
  };

  return (
    <div className="login-container" style={{ maxWidth: 420, margin: '60px auto', padding: 20, backgroundColor: 'white', borderRadius: 10, boxShadow: '0 0 10px rgba(0,0,0,.1)' }}>
      <h2 className="text-center mb-4">
        {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
      </h2>

      {mode === 'login' ? (
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">البريد الإلكتروني</label>
            <input type="email" className="form-control" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">كلمة المرور</label>
            <input type="password" className="form-control" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="alert alert-warning py-2">{error}</div>}
          {info && <div className="alert alert-success py-2">{info}</div>}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
          </button>
          <div className="text-center mt-2">
            <a href="#" className="text-muted small" onClick={e => { e.preventDefault(); handleForgot(); }}>
              <i className="bi bi-key me-1"></i>نسيت كلمة المرور؟
            </a>
          </div>
          <hr />
          <div className="text-center">
            <p className="mb-0">ليس لديك حساب؟{' '}
              <a href="#" onClick={e => { e.preventDefault(); setMode('register'); setError(''); setInfo(''); }}>
                إنشاء حساب جديد
              </a>
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label className="form-label">الاسم</label>
            <input type="text" className="form-control" value={name}
              onChange={e => setName(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">البريد الإلكتروني</label>
            <input type="email" className="form-control" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">رقم الهاتف</label>
            <input type="tel" className="form-control" value={phone}
              onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">كلمة المرور</label>
            <input type="password" className="form-control" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="alert alert-warning py-2">{error}</div>}
          {info && <div className="alert alert-success py-2">{info}</div>}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
          </button>
          <hr />
          <div className="text-center">
            <p className="mb-0">لديك حساب بالفعل؟{' '}
              <a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); setInfo(''); }}>
                تسجيل الدخول
              </a>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
