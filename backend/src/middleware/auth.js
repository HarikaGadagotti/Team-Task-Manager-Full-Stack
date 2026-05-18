const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getDb();
    const [rows] = await db.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?', [decoded.userId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

async function requireProjectAdmin(req, res, next) {
  const db = await getDb();
  const projectId = req.params.projectId || req.body.project_id;

  const [projects] = await db.execute('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
  if (!projects[0]) return res.status(404).json({ error: 'Project not found' });

  const [members] = await db.execute(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, req.user.id]
  );

  const isOwner = projects[0].owner_id === req.user.id;
  const isProjectAdmin = members[0]?.role === 'admin';
  const isGlobalAdmin = req.user.role === 'admin';

  if (!isOwner && !isProjectAdmin && !isGlobalAdmin) {
    return res.status(403).json({ error: 'Project admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireProjectAdmin };