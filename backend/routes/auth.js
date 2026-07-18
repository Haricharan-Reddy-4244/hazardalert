

const express = require('express');
const router = express.Router();
const pool = require('../db-config');
const bcrypt = require('bcrypt');



// REGISTER (Your exact code ✅)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 'citizen']
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId,
      user: {
        id: result.insertId,
        name,
        email,
        role: 'citizen'
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});


// LOGIN

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, role, password FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ── Compute trust_tier from stored civic_points (same as /civic-score) ─
    let trust_tier = 'citizen';
    try {
      const [[civicRow]] = await pool.query(
        'SELECT civic_points, trust_tier FROM users WHERE id = ?', [user.id]
      );
      const pts = civicRow?.civic_points || 0;
      // Match thresholds used in /api/intelligence/civic-score
      if (pts >= 300) trust_tier = 'champion';
      else if (pts >= 150) trust_tier = 'trusted';
      else if (pts >= 50) trust_tier = 'verified';
      else trust_tier = 'newcomer';
      // If DB has stored tier use it
      if (civicRow?.trust_tier) trust_tier = civicRow.trust_tier;
    } catch (_) { /* non-fatal */ }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        trust_tier
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});


module.exports = router;
