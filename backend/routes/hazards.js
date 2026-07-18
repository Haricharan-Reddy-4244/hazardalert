// routes/hazards.js
const express = require('express');
const router = express.Router();
const pool = require('../db-config');
const rateLimit = require('express-rate-limit');

// ── Rate limiting: prevent abuse ──────────────────────────────────
// Max 5 hazard reports per IP per 60 minutes
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    success: false,
    message: '⚠️ Too many reports from this device. You can report up to 5 hazards per hour. This prevents false reports and protects data quality.',
    retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
  })
});

// Max 100 read requests per IP per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: 'Too many requests. Please wait a few minutes.' })
});


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DB MIGRATION â€” run these SQL statements in your MySQL client
//  before starting the server for the first time with these features.
//
//  ALTER TABLE hazards ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL;
//
//  CREATE TABLE IF NOT EXISTS verifications (
//    response_id   INT AUTO_INCREMENT PRIMARY KEY,
//    hazard_id     INT NOT NULL,
//    user_id       INT NOT NULL,
//    response_type ENUM('confirm','reject') NOT NULL,
//    photo_proof   TEXT NULL,
//    video_proof   TEXT NULL,
//    timestamp     DATETIME DEFAULT CURRENT_TIMESTAMP,
//    FOREIGN KEY (hazard_id) REFERENCES hazards(id) ON DELETE CASCADE,
//    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
//    UNIQUE KEY uniq_user_hazard (user_id, hazard_id)
//  );
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ Haversine helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// â”€â”€ Trust score helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function computeTrustScore(verifications) {
  if (!verifications || verifications.length === 0) return { score: null, status: 'pending' };

  const photoProofs = verifications.filter(v => v.photo_proof).length;
  const videoProofs = verifications.filter(v => v.video_proof).length;
  const confirms = verifications.filter(v => v.response_type === 'confirm').length;
  const rejects = verifications.filter(v => v.response_type === 'reject').length;
  const total = verifications.length;

  const raw = (photoProofs * 4 + videoProofs * 5 + confirms * 2 - rejects * 3) / total;
  const score = Math.max(0, Math.min(raw, 10)) / 10; // normalise to 0-1

  let status = 'pending';
  if (score > 0.75) status = 'verified';
  else if (score < 0.3) status = 'false_report';

  return { score: parseFloat(score.toFixed(3)), photoProofs, videoProofs, confirms, rejects, total, status };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  POST /api/hazards  â†’  submit hazard
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Honeypot middleware — must run BEFORE reportLimiter so bots don't consume rate-limit slots
function honeypotCheck(req, res, next) {
  if (req.body && req.body.website) {
    return res.status(200).json({ success: true, hazardId: 0 }); // Silent bot reject
  }
  next();
}

router.post('/', honeypotCheck, reportLimiter, async (req, res) => {
  try {
    const {
      userId, title, hazardType, severity,
      latitude, longitude, description, imageUrl
    } = req.body;

    if (!userId || !hazardType || !severity ||
      latitude === null || latitude === undefined ||
      longitude === null || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'userId, hazardType, severity, latitude, longitude are required'
      });
    }

    const [userRows] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid userId (user does not exist)' });
    }

    const [result] = await pool.query(
      `INSERT INTO hazards
        (user_id, title, hazard_type, severity, latitude, longitude, description, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        title || null,
        hazardType,
        severity.toLowerCase(),
        latitude,
        longitude,
        description || null,
        imageUrl || null
      ]
    );

    const hazardId = result.insertId;

    // â”€â”€ Emit real-time Socket.io event to nearby users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    try {
      const io = req.app.get('io');
      if (io) {
        const baseLat = Math.floor(parseFloat(latitude) / 0.01);
        const baseLng = Math.floor(parseFloat(longitude) / 0.01);
        const payload = {
          id: hazardId,
          hazard_type: hazardType,
          severity,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          description: description || '',
          reporter: 'A nearby user',
          status: 'pending',
          reported_by: userId
        };
        for (let dLat = -1; dLat <= 1; dLat++) {
          for (let dLng = -1; dLng <= 1; dLng++) {
            io.to(`zone_${baseLat + dLat}_${baseLng + dLng}`).emit('new_hazard', payload);
          }
        }
        console.log(`âš¡ Socket.io: emitted new_hazard #${hazardId} to zone ${baseLat}_${baseLng}`);
      }
    } catch (socketErr) {
      console.warn('Socket.io emit failed (non-fatal):', socketErr.message);
    }

    // â”€â”€ Notify nearby users via DB (keeps notification bell working) â”€â”€
    try {
      const deg = 0.5 / 111;
      const [nearbyUsers] = await pool.query(
        `SELECT user_id FROM user_locations
         WHERE latitude  BETWEEN ? AND ?
           AND longitude BETWEEN ? AND ?
           AND user_id   != ?`,
        [latitude - deg, latitude + deg, longitude - deg, longitude + deg, userId]
      );
      let notifiedCount = 0;
      for (const { user_id } of nearbyUsers) {
        try {
          await pool.query(
            `INSERT IGNORE INTO notifications (user_id, hazard_id, type, message)
             VALUES (?, ?, 'proximity_verify', ?)`,
            [user_id, hazardId, `A new ${hazardType} hazard was reported near you. Help verify it!`]
          );
          notifiedCount++;
        } catch (_) { /* ignore duplicate */ }
      }
      console.log(`ðŸ“¡ Notified ${notifiedCount} nearby users for hazard #${hazardId}`);
    } catch (notifyErr) {
      console.warn('Notify nearby users failed (non-fatal):', notifyErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Hazard report submitted successfully',
      reportId: hazardId,
      report: {
        id: hazardId,
        userId, title, hazardType, severity, latitude, longitude, status: 'pending'
      }
    });
  } catch (err) {
    console.error('Submit hazard error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit hazard' });
  }
});
router.get('/', async (req, res) => {
  try {
    const { type, severity, status, search, sort, page, limit, lat, lng, radius } = req.query;

    // If lat/lng/radius provided, defer to nearby logic conceptually (handled by /nearby route)
    // But still support it here for broad compat
    let query = `
      SELECT
        h.id,
        h.user_id       AS userId,
        h.title,
        h.hazard_type   AS hazardType,
        h.severity,
        h.latitude,
        h.longitude,
        h.description,
        h.image_url     AS imageUrl,
        h.status,
        h.created_at    AS createdAt,
        u.name          AS reporter
      FROM hazards h
      JOIN users u ON h.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type) { query += ' AND h.hazard_type = ?'; params.push(type); }
    if (severity) { query += ' AND h.severity = ?'; params.push(severity.toLowerCase()); }
    if (status) { query += ' AND h.status = ?'; params.push(status.toLowerCase()); }
    if (search) {
      query += ' AND (h.description LIKE ? OR u.name LIKE ?)';
      const p = `%${search}%`;
      params.push(p, p);
    }

    let orderBy = 'h.created_at DESC';
    if (sort === 'oldest') orderBy = 'h.created_at ASC';
    else if (sort === 'severity') orderBy = "FIELD(h.severity,'critical','high','medium','low'), h.created_at DESC";
    query += ` ORDER BY ${orderBy}`;

    // ── Pagination ─────────────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const pageSize = Math.min(100, parseInt(limit) || 100);
    const offset   = (pageNum - 1) * pageSize;
    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, page: pageNum, limit: pageSize, hazards: rows });
  } catch (err) {
    console.error('Get hazards error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch hazards' });
  }
});

// â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
//  GET /api/hazards/nearby  â†’  hazards within radius (km)
// â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 0.5 } = req.query; // radius in km, default 500 m
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxKm = parseFloat(radius);

    // Rough bounding box to limit DB scan
    const deg = maxKm / 111;
    const [rows] = await pool.query(
      `SELECT h.*, u.name AS reporter
       FROM hazards h
       JOIN users u ON h.user_id = u.id
       WHERE h.latitude  BETWEEN ? AND ?
         AND h.longitude BETWEEN ? AND ?
         AND h.status NOT IN ('false_report','resolved')`,
      [userLat - deg, userLat + deg, userLng - deg, userLng + deg]
    );

    const nearby = rows.filter(h => {
      const km = haversineKm(userLat, userLng, parseFloat(h.latitude), parseFloat(h.longitude));
      h.distanceKm = parseFloat(km.toFixed(3));
      return km <= maxKm;
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ success: true, count: nearby.length, hazards: nearby });
  } catch (err) {
    console.error('Nearby hazards error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch nearby hazards' });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  GET /api/hazards/risk-zones  â†’  predictive risk areas
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/risk-zones', async (req, res) => {
  try {
    const now = new Date();
    const since24h = new Date(now - 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const since7d = new Date(now - 7 * 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    const [allHazards] = await pool.query(
      `SELECT id, hazard_type, latitude, longitude, status, created_at FROM hazards`
    );

    // Cluster by 0.01Â° grid (~1.1 km cell)
    const GRID = 0.01;
    const cells = {};

    allHazards.forEach(h => {
      const lat = parseFloat(h.latitude);
      const lng = parseFloat(h.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const cellLat = Math.floor(lat / GRID) * GRID;
      const cellLng = Math.floor(lng / GRID) * GRID;
      const key = `${cellLat.toFixed(2)}_${cellLng.toFixed(2)}`;

      if (!cells[key]) {
        cells[key] = {
          cellLat, cellLng,
          hazards_24h: 0,
          accidents_7d: 0,
          unresolved: 0,
          total: 0
        };
      }

      const c = cells[key];
      c.total++;

      const createdAt = new Date(h.created_at);
      if (createdAt >= new Date(since24h)) c.hazards_24h++;
      if (h.hazard_type === 'Accident' && createdAt >= new Date(since7d)) c.accidents_7d++;
      if (!['resolved', 'false_report'].includes(h.status)) c.unresolved++;
    });

    const HIGH_RISK_THRESHOLD = 10;
    const MEDIUM_THRESHOLD = 5;

    const zones = Object.values(cells).map(c => {
      const riskScore = c.hazards_24h * 2 + c.accidents_7d * 3 + c.unresolved;
      let riskLevel = 'safe';
      if (riskScore >= HIGH_RISK_THRESHOLD) riskLevel = 'high';
      else if (riskScore >= MEDIUM_THRESHOLD) riskLevel = 'medium';
      return { ...c, riskScore, riskLevel };
    }).filter(z => z.riskScore > 0);

    res.json({ success: true, count: zones.length, zones });
  } catch (err) {
    console.error('Risk zones error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute risk zones' });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  POST /api/hazards/:id/verify  â†’  submit witness verification
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.post('/:id/verify', async (req, res) => {
  try {
    const hazardId = parseInt(req.params.id);
    const { userId, responseType = 'confirm', photoProof, videoProof } = req.body;

    if (!userId || !['confirm', 'reject'].includes(responseType)) {
      return res.status(400).json({
        success: false,
        message: 'userId required; responseType must be confirm or reject'
      });
    }

    // Upsert â€” one response per user per hazard
    await pool.query(
      `INSERT INTO verifications (hazard_id, user_id, response_type, photo_proof, video_proof)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         response_type = VALUES(response_type),
         photo_proof   = VALUES(photo_proof),
         video_proof   = VALUES(video_proof),
         timestamp     = CURRENT_TIMESTAMP`,
      [hazardId, userId, responseType, photoProof || null, videoProof || null]
    );

    // Re-compute trust score
    const [verifications] = await pool.query(
      'SELECT * FROM verifications WHERE hazard_id = ?',
      [hazardId]
    );
    const { score, status } = computeTrustScore(verifications);

    // Auto-update hazard status if threshold crossed
    if (status === 'verified' || status === 'false_report') {
      await pool.query('UPDATE hazards SET status = ? WHERE id = ?', [status, hazardId]);
    }

    res.json({
      success: true,
      message: 'Verification recorded',
      trustScore: score,
      newStatus: status,
      totalVerifications: verifications.length
    });
  } catch (err) {
    console.error('Verify hazard error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit verification' });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  GET /api/hazards/:id/trust-score  â†’  get current trust score
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/:id/trust-score', async (req, res) => {
  try {
    const hazardId = parseInt(req.params.id);
    const [verifications] = await pool.query(
      'SELECT * FROM verifications WHERE hazard_id = ?',
      [hazardId]
    );
    const result = computeTrustScore(verifications);
    res.json({ success: true, hazardId, ...result, verifications });
  } catch (err) {
    console.error('Trust score error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch trust score' });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  PATCH /api/hazards/:id/status  â†’  update status (admin)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.patch('/:id/status', async (req, res) => {
  try {
    const hazardId = parseInt(req.params.id);
    const { status } = req.body;

    const allowedStatuses = ['pending', 'verified', 'resolved', 'disputed', 'false_report'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const [result] = await pool.query(
      'UPDATE hazards SET status = ? WHERE id = ?',
      [status, hazardId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Hazard not found' });
    }

    res.json({ success: true, message: 'Hazard status updated', hazardId: Number(hazardId), status });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update hazard status' });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  GET /api/hazards/notifications  â†’  get unread proximity alerts
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/notifications', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const [rows] = await pool.query(
      `SELECT n.id, n.hazard_id, n.type, n.message, n.read_at, n.created_at,
              h.hazard_type, h.severity, h.latitude, h.longitude, h.status,
              u.name AS reporter
       FROM notifications n
       JOIN hazards h ON h.id = n.hazard_id
       JOIN users   u ON u.id = h.user_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const unreadCount = rows.filter(r => !r.read_at).length;
    res.json({ success: true, count: rows.length, unreadCount, notifications: rows });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  PATCH /api/hazards/notifications/:id/read  â†’  mark as read
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('UPDATE notifications SET read_at = NOW() WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark-read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark notification' });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  POST /api/hazards/user-location  â†’  upsert user GPS position
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.post('/user-location', async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'userId, latitude, longitude required' });
    }
    await pool.query(
      `INSERT INTO user_locations (user_id, latitude, longitude)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude)`,
      [userId, latitude, longitude]
    );
    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    console.error('User location error:', err);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
});

// ══════════════════════════════════════════════════════════════
//  GET /api/hazards/:id  →  single hazard by ID
//  NOTE: Must be LAST GET route — /:id would shadow /nearby etc.
// ══════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const hazardId = parseInt(req.params.id);
    if (isNaN(hazardId)) {
      return res.status(400).json({ success: false, message: 'Invalid hazard ID' });
    }
    const [rows] = await pool.query(
      `SELECT h.*, u.name AS reporter
       FROM hazards h
       JOIN users u ON h.user_id = u.id
       WHERE h.id = ?`,
      [hazardId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hazard not found' });
    }
    res.json({ success: true, hazard: rows[0] });
  } catch (err) {
    console.error('Get hazard by ID error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch hazard' });
  }
});

module.exports = router;
