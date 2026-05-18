const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

//  Fix: Convert ISO datetime to YYYY-MM-DD for MySQL DATE column
function formatDate(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'string' && dateVal.includes('T')) {
    return dateVal.split('T')[0];
  }
  return dateVal;
}

async function canAccessProject(db, projectId, userId, userRole) {
  if (userRole === 'admin') return true;
  const [[m]] = await db.execute(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]
  );
  return !!m;
}

// IMPORTANT: /dashboard must be before /:id
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const uid = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const projectFilter = isAdmin
      ? 'TRUE'
      : `project_id IN (SELECT project_id FROM project_members WHERE user_id = '${uid}')`;

    const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM tasks WHERE ${projectFilter}`);
    const [[{ todo }]] = await db.execute(`SELECT COUNT(*) as todo FROM tasks WHERE status='todo' AND ${projectFilter}`);
    const [[{ in_progress }]] = await db.execute(`SELECT COUNT(*) as in_progress FROM tasks WHERE status='in_progress' AND ${projectFilter}`);
    const [[{ done }]] = await db.execute(`SELECT COUNT(*) as done FROM tasks WHERE status='done' AND ${projectFilter}`);
    const [[{ overdue }]] = await db.execute(`SELECT COUNT(*) as overdue FROM tasks WHERE due_date < CURDATE() AND status != 'done' AND ${projectFilter}`);
    const [[{ my_tasks }]] = await db.execute(`SELECT COUNT(*) as my_tasks FROM tasks WHERE assignee_id = ? AND status != 'done'`, [uid]);
    const [[{ projects }]] = isAdmin
      ? await db.execute('SELECT COUNT(*) as projects FROM projects')
      : await db.execute('SELECT COUNT(*) as projects FROM project_members WHERE user_id = ?', [uid]);

    const [recentTasks] = await db.execute(`
      SELECT t.*, u.name as assignee_name, p.name as project_name
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE ${projectFilter} ORDER BY t.created_at DESC LIMIT 5
    `);

    const [overdueTasks] = await db.execute(`
      SELECT t.*, u.name as assignee_name, p.name as project_name
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.due_date < CURDATE() AND t.status != 'done' AND ${projectFilter}
      ORDER BY t.due_date ASC LIMIT 5
    `);

    res.json({ stats: { total, todo, in_progress, done, overdue, my_tasks, projects }, recentTasks, overdueTasks });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const { projectId, status, assigneeId } = req.query;
    let query = `
      SELECT t.*, u.name as assignee_name, ub.name as created_by_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users ub ON t.created_by = ub.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ` AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)`;
      params.push(req.user.id);
    }
    if (projectId) { query += ' AND t.project_id = ?'; params.push(projectId); }
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (assigneeId) { query += ' AND t.assignee_id = ?'; params.push(assigneeId); }
    query += ' ORDER BY t.created_at DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticate, async (req, res) => {
  const { title, description, project_id, assignee_id, priority, due_date, status } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id are required' });
  try {
    const db = await getDb();
    if (!await canAccessProject(db, project_id, req.user.id, req.user.role))
      return res.status(403).json({ error: 'Access denied' });

    const id = uuidv4();
    await db.execute(
      `INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, created_by, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description || '', status || 'todo', priority || 'medium',
       project_id, assignee_id || null, req.user.id, formatDate(due_date)]
    );
    const [[task]] = await db.execute(`
      SELECT t.*, u.name as assignee_name, ub.name as created_by_name
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users ub ON t.created_by = ub.id WHERE t.id = ?
    `, [id]);
    res.status(201).json(task);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const [[task]] = await db.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!await canAccessProject(db, task.project_id, req.user.id, req.user.role))
      return res.status(403).json({ error: 'Access denied' });

    const { title, description, status, priority, assignee_id, due_date } = req.body;
    await db.execute(
      `UPDATE tasks SET title=?, description=?, status=?, priority=?, assignee_id=?, due_date=? WHERE id=?`,
      [
        title ?? task.title,
        description ?? task.description,
        status ?? task.status,
        priority ?? task.priority,
        assignee_id !== undefined ? (assignee_id || null) : task.assignee_id,
        due_date !== undefined ? formatDate(due_date) : formatDate(task.due_date),
        req.params.id
      ]
    );
    const [[updated]] = await db.execute(`
      SELECT t.*, u.name as assignee_name, ub.name as created_by_name
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users ub ON t.created_by = ub.id WHERE t.id = ?
    `, [req.params.id]);
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const [[task]] = await db.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!await canAccessProject(db, task.project_id, req.user.id, req.user.role))
      return res.status(403).json({ error: 'Access denied' });
    await db.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;