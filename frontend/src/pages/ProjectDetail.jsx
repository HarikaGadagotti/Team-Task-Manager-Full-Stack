import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

function TaskModal({ projectId, members, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', due_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const payload = { ...form, project_id: projectId, assignee_id: form.assignee_id || null, due_date: form.due_date || null };
      if (initial) await api.put(`/tasks/${initial.id}`, payload);
      else await api.post('/tasks', payload);
      onSave();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <h2>{initial ? 'Edit Task' : 'New Task'}</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Title</label>
            <input placeholder="Task title" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group"><label>Description</label>
            <textarea rows={2} placeholder="Details..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group"><label>Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Assignee</label>
              <select value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Due Date</label>
              <input type="date" value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>{loading ? '...' : 'Save Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onSave }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const search = async q => {
    setQuery(q);
    if (q.length < 1) return setResults([]);
    const { data } = await api.get(`/users/search?q=${q}`);
    setResults(data);
  };

  const add = async (userId) => {
    try {
      await api.post(`/projects/${projectId}/members`, { userId, role: 'member' });
      onSave();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Add Member</h2>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <input placeholder="Search by name or email..." value={query} onChange={e => search(e.target.value)} autoFocus />
        </div>
        {results.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13 }}>{u.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{u.email}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => add(u.id)}>Add</button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLS = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_COLORS = { todo: 'var(--text2)', in_progress: 'var(--accent)', done: 'var(--success)' };

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const load = () => api.get(`/projects/${projectId}`).then(r => setProject(r.data)).catch(() => navigate('/projects'));
  useEffect(() => { load(); }, [projectId]);

  if (!project) return <Layout><div style={{ color: 'var(--text2)' }}>Loading...</div></Layout>;

  const myRole = project.members?.find(m => m.id === user?.id)?.role;
  const canManage = isAdmin || myRole === 'admin';

  const deleteTask = async id => {
    if (!confirm('Delete task?')) return;
    await api.delete(`/tasks/${id}`);
    load();
  };

  const quickStatus = async (taskId, status) => {
    await api.put(`/tasks/${taskId}`, { status });
    load();
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => navigate('/projects')}>Projects</span>
            {' / '}{project.name}
          </div>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
        {canManage && <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setShowMemberModal(true)}>+ Member</button>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>+ Task</button>
        </div>}
      </div>

      {/* Members */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Team Members</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {project.members?.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)',
              borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {m.name[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>{m.name}</div>
              </div>
              <span className={`badge badge-${m.role}`}>{m.role}</span>
              {canManage && m.id !== user?.id &&
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}
                  onClick={() => api.delete(`/projects/${projectId}/members/${m.id}`).then(load)}>✕</button>}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {STATUS_COLS.map(col => {
          const colTasks = project.tasks?.filter(t => t.status === col) || [];
          return (
            <div key={col}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[col] }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLORS[col] }}>{STATUS_LABELS[col]}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--surface2)',
                  padding: '2px 8px', borderRadius: 10 }}>{colTasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {colTasks.map(t => (
                  <div key={t.id} className="card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {canManage && <>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}
                            onClick={() => { setEditTask(t); setShowTaskModal(true); }}>✎</button>
                          <button className="btn btn-danger btn-sm" style={{ padding: '2px 6px' }}
                            onClick={() => deleteTask(t.id)}>✕</button>
                        </>}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>{t.description}</div>}
                    {t.assignee_name && <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>👤 {t.assignee_name}</div>}
                    {t.due_date && <div style={{ fontSize: 11, color: new Date(t.due_date) < new Date() && t.status !== 'done' ? 'var(--danger)' : 'var(--text2)' }}>
                      📅 {t.due_date}
                    </div>}
                    {/* Quick status buttons */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                      {STATUS_COLS.filter(s => s !== col).map(s => (
                        <button key={s} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '3px 8px' }}
                          onClick={() => quickStatus(t.id, s)}>→ {STATUS_LABELS[s]}</button>
                      ))}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && <div style={{ padding: '20px', border: '1px dashed var(--border)',
                  borderRadius: 10, textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>Empty</div>}
              </div>
            </div>
          );
        })}
      </div>

      {showTaskModal && <TaskModal projectId={projectId} members={project.members || []}
        initial={editTask}
        onClose={() => { setShowTaskModal(false); setEditTask(null); }}
        onSave={() => { load(); setShowTaskModal(false); setEditTask(null); }} />}
      {showMemberModal && <AddMemberModal projectId={projectId}
        onClose={() => setShowMemberModal(false)}
        onSave={() => { load(); setShowMemberModal(false); }} />}
    </Layout>
  );
}