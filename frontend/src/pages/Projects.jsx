import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

function ProjectModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (initial) { await api.put(`/projects/${initial.id}`, form); }
      else { await api.post('/projects', form); }
      onSave();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{initial ? 'Edit Project' : 'New Project'}</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Name</label>
            <input placeholder="Project name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group"><label>Description</label>
            <textarea rows={3} placeholder="What is this project about?"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>{loading ? '...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const load = () => api.get('/projects').then(r => setProjects(r.data));
  useEffect(() => { load(); }, []);

  const deleteProject = async id => {
    if (!confirm('Delete this project?')) return;
    await api.delete(`/projects/${id}`);
    load();
  };

  return (
    <Layout>
      <div className="page-header">
        <div><h1>Projects</h1><p>{projects.length} project{projects.length !== 1 ? 's' : ''}</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0
        ? <div className="empty-state"><div className="icon">⬡</div><h3>No projects yet</h3><p>Create your first project to get started</p></div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map(p => (
            <div key={p.id} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>⬡</div>
                {isAdmin && <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditProject(p); setShowModal(true); }}>✎</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteProject(p.id)}>✕</button>
                </div>}
              </div>
              <h3 style={{ fontSize: 16, marginBottom: 6 }}>{p.name}</h3>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>{p.description || 'No description'}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
                <span>✦ {p.task_count} tasks</span>
                <span>👥 {p.member_count} members</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>By {p.owner_name}</div>
            </div>
          ))}
        </div>
      }

      {showModal && <ProjectModal
        initial={editProject}
        onClose={() => { setShowModal(false); setEditProject(null); }}
        onSave={() => { load(); setShowModal(false); setEditProject(null); }} />}
    </Layout>
  );
}