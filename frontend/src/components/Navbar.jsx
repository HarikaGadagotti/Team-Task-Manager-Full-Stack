import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/projects', label: 'Projects', icon: '⬡' },
  { to: '/tasks', label: 'My Tasks', icon: '✦' },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{
      width: 220, minHeight: '100vh', background: 'var(--surface)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', padding: '24px 16px', position: 'fixed', top: 0, left: 0,
    }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', letterSpacing: -0.5 }}>
          ⬡ TaskFlow
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Team Manager</div>
      </div>

      <div style={{ flex: 1 }}>
        {NAV.map(n => (
          <Link key={n.to} to={n.to} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 8, marginBottom: 4, fontSize: 14, fontWeight: 500,
            background: location.pathname.startsWith(n.to) ? 'rgba(108,99,255,0.15)' : 'transparent',
            color: location.pathname.startsWith(n.to) ? 'var(--accent)' : 'var(--text2)',
            transition: 'all 0.15s',
          }}>{n.icon} {n.label}</Link>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
        <div style={{ padding: '8px 14px', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{user?.email}</div>
          <span className={`badge badge-${user?.role}`} style={{ marginTop: 6 }}>{user?.role}</span>
        </div>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleLogout}>↩ Logout</button>
      </div>
    </nav>
  );
}