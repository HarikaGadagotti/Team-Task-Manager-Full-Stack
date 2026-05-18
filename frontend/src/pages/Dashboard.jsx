import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, color, icon }) => (
  <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ color: 'var(--text2)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4, color }}>{value}</div>
      </div>
      <div style={{ fontSize: 24, opacity: 0.6 }}>{icon}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/tasks/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div style={{ color: 'var(--text2)' }}>Loading dashboard...</div></Layout>;

  const { stats, recentTasks, overdueTasks } = data || {};

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name} 👋</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Tasks" value={stats?.total} color="var(--accent)" icon="✦" />
        <StatCard label="In Progress" value={stats?.in_progress} color="var(--warning)" icon="⟳" />
        <StatCard label="Completed" value={stats?.done} color="var(--success)" icon="✓" />
        <StatCard label="Overdue" value={stats?.overdue} color="var(--danger)" icon="⚠" />
        <StatCard label="My Tasks" value={stats?.my_tasks} color="var(--accent2)" icon="◈" />
        <StatCard label="Projects" value={stats?.projects} color="#06b6d4" icon="⬡" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>Recent Tasks</h3>
          {recentTasks?.length === 0 && <div className="empty-state"><p>No tasks yet</p></div>}
          {recentTasks?.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{t.project_name}</div>
              </div>
              <span className={`badge badge-${t.status}`}>{t.status.replace('_',' ')}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: 1 }}>⚠ Overdue Tasks</h3>
          {overdueTasks?.length === 0
            ? <div style={{ color: 'var(--success)', fontSize: 13 }}>🎉 No overdue tasks!</div>
            : overdueTasks?.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>Due: {t.due_date}</div>
                </div>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              </div>
            ))}
        </div>
      </div>
    </Layout>
  );
}