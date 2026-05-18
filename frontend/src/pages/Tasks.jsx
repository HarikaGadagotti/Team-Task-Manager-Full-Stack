import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const { user } = useAuth();

  const load = () => {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    api.get(`/tasks?${params}&assigneeId=${user.id}`).then(r => setTasks(r.data));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.put(`/tasks/${id}`, { status });
    load();
  };

  return (
    <Layout>
      <div className="page-header">
        <div><h1>My Tasks</h1><p>{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}
            style={{ width: 140 }}>
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {tasks.length === 0
        ? <div className="empty-state"><div className="icon">✦</div><h3>No tasks</h3><p>You have no tasks assigned yet.</p></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map(t => (
            <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {t.project_name}
                  {t.due_date && <span style={{ marginLeft: 12, color: new Date(t.due_date) < new Date() && t.status !== 'done' ? 'var(--danger)' : 'var(--text2)' }}>
                    · Due {t.due_date}
                  </span>}
                </div>
              </div>
              <select value={t.status}
                onChange={e => updateStatus(t.id, e.target.value)}
                style={{ width: 140, background: 'var(--surface2)' }}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          ))}
        </div>
      }
    </Layout>
  );
}