const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authenticate, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    let rows;
    if (req.user.role === 'admin') {
      [rows] = await db.execute(`
        SELECT p.*, u.name as owner_name,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
        FROM projects p JOIN users u ON p.owner_id = u.id
        ORDER BY p.created_at DESC
      `);
    } else {
      [rows] = await db.execute(`
        SELECT p.*, u.name as owner_name,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
        ORDER BY p.created_at DESC
      `, [req.user.id]);
    }
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticate, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  try {
    const db = await getDb();
    const id = uuidv4();
    await db.execute(
      'INSERT INTO projects (id, name, description, owner_id) VALUES (?, ?, ?, ?)',
      [id, name, description || '', req.user.id]
    );
    await db.execute(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [id, req.user.id, 'admin']
    );
    const [[project]] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
    res.status(201).json(project);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:projectId', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const [[project]] = await db.execute(`
      SELECT p.*, u.name as owner_name FROM projects p
      JOIN users u ON p.owner_id = u.id WHERE p.id = ?
    `, [req.params.projectId]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.user.role !== 'admin') {
      const [[member]] = await db.execute(
        'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
        [req.params.projectId, req.user.id]
      );
      if (!member) return res.status(403).json({ error: 'Access denied' });
    }

    const [members] = await db.execute(`
      SELECT u.id, u.name, u.email, pm.role, pm.joined_at
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `, [req.params.projectId]);

    const [tasks] = await db.execute(`
      SELECT t.*, u.name as assignee_name, ub.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users ub ON t.created_by = ub.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `, [req.params.projectId]);

    res.json({ ...project, members, tasks });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:projectId', authenticate, requireProjectAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  try {
    const db = await getDb();
    await db.execute('UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description || '', req.params.projectId]);
    const [[project]] = await db.execute('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
    res.json(project);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:projectId', authenticate, requireProjectAdmin, async (req, res) => {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM projects WHERE id = ?', [req.params.projectId]);
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/:projectId/members', authenticate, requireProjectAdmin, async (req, res) => {
  const { userId, role } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    const db = await getDb();
    const [[user]] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [[existing]] = await db.execute(
      'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.projectId, userId]
    );
    if (existing) return res.status(409).json({ error: 'User already a member' });

    await db.execute(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.projectId, userId, role === 'admin' ? 'admin' : 'member']
    );
    res.status(201).json({ message: 'Member added' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:projectId/members/:userId', authenticate, requireProjectAdmin, async (req, res) => {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.projectId, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;