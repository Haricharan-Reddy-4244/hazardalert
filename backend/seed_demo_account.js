// seed_demo_account.js
// Creates the judge demo account + Champion status
// Run once: node seed_demo_account.js

const mysql  = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const DEMO_EMAIL    = 'demo@hazardalert.com';
  const DEMO_PASSWORD = 'demo1234';
  const DEMO_NAME     = 'Civic Champion 🏆';

  // Check if already exists
  const [[existing]] = await c.query('SELECT id FROM users WHERE email = ?', [DEMO_EMAIL]);

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  let userId;
  if (existing) {
    // Update existing
    await c.query(
      'UPDATE users SET name=?, password=?, civic_points=350, trust_tier="champion" WHERE email=?',
      [DEMO_NAME, hash, DEMO_EMAIL]
    );
    userId = existing.id;
    console.log(`✅ Updated existing demo account (id=${userId})`);
  } else {
    // Create new
    const [r] = await c.query(
      'INSERT INTO users (name, email, password, phone, civic_points, trust_tier) VALUES (?, ?, ?, ?, 350, "champion")',
      [DEMO_NAME, DEMO_EMAIL, hash, '9876543210']
    );
    userId = r.insertId;
    console.log(`✅ Created demo account (id=${userId})`);
  }

  // Also seed some demo hazard reports from this user if none exist
  const [[hcount]] = await c.query('SELECT COUNT(*) AS cnt FROM hazards WHERE user_id=?', [userId]);
  if (parseInt(hcount.cnt) === 0) {
    // Get first real hazard id to copy from
    const [[firstHazard]] = await c.query('SELECT * FROM hazards LIMIT 1');
    if (firstHazard) {
      await c.query(
        'INSERT INTO hazards (user_id, hazard_type, severity, latitude, longitude, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'Pothole', 'high', 17.4375, 78.4483, 'Large pothole near Ameerpet Metro — damaged my bike tyre', 'resolved']
      );
      await c.query(
        'INSERT INTO hazards (user_id, hazard_type, severity, latitude, longitude, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'Open Manhole', 'critical', 17.3850, 78.4867, 'Open manhole without cover at Mehdipatnam — dangerous at night', 'pending']
      );
      await c.query(
        'INSERT INTO hazards (user_id, hazard_type, severity, latitude, longitude, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'Broken Road', 'medium', 17.4456, 78.3772, 'Broken road surface causing vehicle damage near HITEC City', 'pending']
      );
      console.log('✅ Seeded 3 demo hazards for champion account');
    }
  }

  console.log('\n📋 DEMO LOGIN CREDENTIALS (share with judges):');
  console.log('  Email   : demo@hazardalert.com');
  console.log('  Password: demo1234');
  console.log('  Tier    : 💎 Champion (350 civic points)');
  console.log('  Access  : Full Compensation Claim Generator unlocked');

  await c.end();
  process.exit(0);
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
