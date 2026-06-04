import { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await onLogin(email, password);
    if (!result.success) setError(result.message);
    setLoading(false);
  };

  return (
    <div className="login-container" style={{ maxWidth: 400, margin: '60px auto', padding: 20, backgroundColor: 'white', borderRadius: 10, boxShadow: '0 0 10px rgba(0,0,0,.1)' }}>
      <h2 className="text-center mb-4">تسجيل الدخول</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">البريد الإلكتروني</label>
          <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">كلمة المرور</label>
          <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div className="alert alert-warning py-2">{error}</div>}
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
        </button>
      </form>
    </div>
  );
}
