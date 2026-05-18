import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.08) 0%, transparent 60%), var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, color: 'var(--accent)', marginBottom: 8 }}>⬡</div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>TaskFlow</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>Sign in to your workspace</p>
        </div>
        <div className="card">
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}>{loading ? 'Signing in...' : 'Sign In →'}</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text2)', fontSize: 13 }}>
            No account? <Link to="/signup" style={{ color: 'var(--accent)' }}>Sign up</Link>
          </p>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 12, marginTop: 16 }}>
          Demo: admin@demo.com / password123
        </p>
      </div>
    </div>
  );
}