// routes/users.js - Admin user management endpoint
const express = require('express');
const router = express.Router();
const pool = require('../db-config');

// GET /api/users → list all users (admin only by convention)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id,
        name,
        email,
        role,
        created_at AS createdAt,
        (SELECT COUNT(*) FROM hazards WHERE user_id = users.id) AS reportsSubmitted
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ success: true, users: rows, total: rows.length });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/users/:id → get single user profile
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await pool.query(
      `SELECT
        id,
        name,
        email,
        role,
        phone,
        created_at AS createdAt,
        (SELECT COUNT(*) FROM hazards WHERE user_id = users.id) AS reportsSubmitted
       FROM users
       WHERE id = ?`,
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = rows[0];
    res.json({ success: true, user, name: user.name, id: user.id, role: user.role });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// PATCH /api/users/:id/role → promote/demote user role
router.patch('/:id/role', async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    const allowed = ['citizen', 'admin', 'moderator'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'Role updated', userId: Number(userId), role });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

module.exports = router;
