const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const hazardRoutes = require('./routes/hazards');
const userRoutes = require('./routes/users');
const intelligenceRoutes = require('./routes/intelligence');
const cron = require('node-cron');
const pool = require('./db-config');

const app = express();
const server = http.createServer(app); // wrap Express in http.Server for Socket.io

// â”€â”€ Socket.io setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Share the io instance with route handlers via app.set
app.set('io', io);

// Each connected client joins a "grid zone" room based on their GPS.
// Zone key = floor(lat/0.01)_floor(lng/0.01)  (~1.1 km cells)
// When a hazard is created, the server emits to all adjacent zones.
io.on('connection', socket => {
  console.log(`ðŸ”Œ Socket connected: ${socket.id}`);

  // Client registers their location: { lat, lng, userId }
  socket.on('register_location', ({ lat, lng, userId }) => {
    if (!lat || !lng) return;
    // Join the 9 surrounding grid cells to catch hazards on zone edges
    const baseLat = Math.floor(lat / 0.01);
    const baseLng = Math.floor(lng / 0.01);
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLng = -1; dLng <= 1; dLng++) {
        const room = `zone_${baseLat + dLat}_${baseLng + dLng}`;
        socket.join(room);
      }
    }
    socket.data.userId = userId;
    socket.data.lat = lat;
    socket.data.lng = lng;
    console.log(`ðŸ“ User ${userId} registered at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  });

  // Client updates location (called every 5 min)
  socket.on('update_location', ({ lat, lng }) => {
    if (!lat || !lng) return;
    // Leave old rooms, join new ones
    socket.rooms.forEach(room => { if (room.startsWith('zone_')) socket.leave(room); });
    const baseLat = Math.floor(lat / 0.01);
    const baseLng = Math.floor(lng / 0.01);
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLng = -1; dLng <= 1; dLng++) {
        socket.join(`zone_${baseLat + dLat}_${baseLng + dLng}`);
      }
    }
    socket.data.lat = lat;
    socket.data.lng = lng;
  });

  socket.on('disconnect', () => {
    console.log(`ðŸ”Œ Socket disconnected: ${socket.id}`);
  });
});

// â”€â”€ Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3000',
  'http://127.0.0.1:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // permissive for hackathon — tighten post-launch
    }
  },
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve frontend — unified deployment (frontend + backend as one Railway service)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/auth', authRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/intelligence', intelligenceRoutes);

// Health check
app.get('/api/test', (req, res) => {
  res.json({
    message: 'ðŸš¨ HazardAlert API LIVE!',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/auth/register', '/api/auth/login', '/api/hazards'],
    realtime: 'Socket.io enabled âœ…'
  });
});

// API 404 — only for /api/* routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: `${req.method} ${req.originalUrl}`
  });
});

// SPA catch-all — serve index.html for all non-API routes
// This ensures browser refreshes and direct URL access work correctly
// Express 5 requires named wildcard: '{*path}' instead of '*'
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
const { exec } = require('child_process');

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  FEATURE 6: Auto-Escalation Engine (runs daily at 8 AM)
//  Escalates unresolved hazards to higher authority tiers
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
cron.schedule('0 8 * * *', async () => {
  console.log('â° Auto-escalation cron running...');
  try {
    const DAY1 = parseInt(process.env.ESCALATION_DAY_1) || 7;
    const DAY2 = parseInt(process.env.ESCALATION_DAY_2) || 15;
    const DAY3 = parseInt(process.env.ESCALATION_DAY_3) || 30;

    // Find all pending/disputed hazards older than DAY1
    const [stale] = await pool.query(
      `SELECT h.id, h.hazard_type, h.severity, h.latitude, h.longitude,
              DATEDIFF(NOW(), h.created_at) AS days_old,
              h.escalation_level
       FROM hazards h
       WHERE h.status IN ('pending','disputed')
         AND DATEDIFF(NOW(), h.created_at) >= ?
       ORDER BY h.severity DESC, days_old DESC`,
      [DAY1]
    );

    let escalated = 0;
    for (const hazard of stale) {
      let newLevel = hazard.escalation_level || 0;
      let levelName = '';

      if (hazard.days_old >= DAY3 && newLevel < 3) {
        newLevel = 3; levelName = 'Municipal Commissioner (NEGLECTED)';
      } else if (hazard.days_old >= DAY2 && newLevel < 2) {
        newLevel = 2; levelName = 'Zonal Commissioner';
      } else if (hazard.days_old >= DAY1 && newLevel < 1) {
        newLevel = 1; levelName = 'Ward Officer';
      }

      if (newLevel > (hazard.escalation_level || 0)) {
        await pool.query(
          `UPDATE hazards SET escalation_level = ? WHERE id = ?`,
          [newLevel, hazard.id]
        );
        await pool.query(
          `INSERT IGNORE INTO escalation_log
             (hazard_id, from_level, to_level, level_name, days_pending)
           VALUES (?, ?, ?, ?, ?)`,
          [hazard.id, hazard.escalation_level || 0, newLevel, levelName, hazard.days_old]
        );
        // Emit real-time event to admin sockets
        io.emit('hazard_escalated', {
          hazardId: hazard.id,
          hazardType: hazard.hazard_type,
          severity: hazard.severity,
          escalationLevel: newLevel,
          levelName,
          daysPending: hazard.days_old
        });
        escalated++;
        console.log(`📢 Hazard #${hazard.id} escalated to Level ${newLevel}: ${levelName} (${hazard.days_old} days old)`);
      }
    }
    console.log(`✅ Escalation complete: ${escalated} hazards escalated`);
  } catch (err) {
    console.error('Auto-escalation error:', err.message);
  }
});

// ——— MUST register error handler BEFORE listen() ———————————————
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️  Port ${PORT} in use.`);
    // On Linux/production (Railway), just exit — the platform handles restarts
    if (process.platform !== 'win32') {
      console.error(`❌ Port ${PORT} already in use. Exiting.`);
      process.exit(1);
    }
    // On Windows (local dev), try to kill the old process
    exec(`netstat -ano | findstr :${PORT}`, (e, stdout) => {
      const pids = new Set();
      (stdout || '').trim().split('\n').forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
      });
      if (pids.size === 0) {
        console.error(`❌ Could not find process on port ${PORT}. Kill it manually then retry.`);
        process.exit(1);
      }
      pids.forEach(pid => {
        exec(`taskkill /PID ${pid} /F`, (killErr) => {
          if (killErr) console.warn(`Could not kill PID ${pid}:`, killErr.message);
          else console.log(`✅ Killed old process PID ${pid}`);
        });
      });
      setTimeout(() => {
        server.listen(PORT, () => {
          console.log(`🚀 Server restarted: http://localhost:${PORT}`);
          console.log(`⚡ Socket.io: real-time proximity alerts enabled`);
        });
      }, 1500);
    });
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

// â”€â”€ Start server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
server.listen(PORT, () => {
  console.log(`ðŸš€ Server: http://localhost:${PORT}`);
  console.log(`âš¡ Socket.io: real-time proximity alerts enabled`);
  console.log(`ðŸ§ª Test: http://localhost:${PORT}/api/test`);
  console.log(`ðŸ¤– Intelligence API: http://localhost:${PORT}/api/intelligence`);
  console.log(`â° Auto-escalation cron: daily at 8 AM`);
});
