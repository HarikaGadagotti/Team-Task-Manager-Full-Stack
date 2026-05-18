const express = require('express');
const { getDb } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireAdmin, async (req, res) => {
  const db = await getDb();
  const [users] = await db.execute(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(users);
});

router.get('/search', authenticate, async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const db = await getDb();
  const [users] = await db.execute(
    'SELECT id, name, email, role FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 10',
    [q, q]
  );
  res.json(users);
});

module.exports = router;