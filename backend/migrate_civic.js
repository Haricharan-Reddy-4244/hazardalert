const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: parseInt(process.env.DB_PORT) === 4000 ? { rejectUnauthorized: false } : undefined
  });

  // 1. Add civic_points
  try {
    await c.query('ALTER TABLE users ADD COLUMN civic_points INT DEFAULT 0');
    console.log('✅ civic_points column added');
  } catch (e) {
    console.log('civic_points:', e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message);
  }

  // 2. Add trust_tier
  try {
    await c.query("ALTER TABLE users ADD COLUMN trust_tier VARCHAR(20) DEFAULT 'newcomer'");
    console.log('✅ trust_tier column added');
  } catch (e) {
    console.log('trust_tier:', e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message);
  }

  // 3. Create compensation_claims table
  await c.query(`
    CREATE TABLE IF NOT EXISTS compensation_claims (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      hazard_id INT,
      vehicle_type VARCHAR(50),
      damage_type VARCHAR(100),
      repair_cost DECIMAL(10,2),
      compensation_demanded DECIMAL(10,2),
      notice_text LONGTEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ compensation_claims table ready');

  // 4. Seed demo points for existing users
  await c.query(`
    UPDATE users
    SET civic_points = FLOOR(RAND() * 400) + 50
    WHERE civic_points = 0
  `);
  await c.query(`
    UPDATE users SET trust_tier =
      CASE
        WHEN civic_points >= 300 THEN 'champion'
        WHEN civic_points >= 150 THEN 'trusted'
        WHEN civic_points >= 50  THEN 'verified'
        ELSE 'newcomer'
      END
  `);
  console.log('✅ Demo civic points seeded');

  // 5. Add index for quick lookups
  try {
    await c.query('ALTER TABLE users ADD INDEX idx_civic_points (civic_points)');
    console.log('✅ Index on civic_points added');
  } catch (e) {
    console.log('Index:', e.code === 'ER_DUP_KEYNAME' ? 'already exists' : e.message);
  }

  const [users] = await c.query('SELECT trust_tier, COUNT(*) as cnt FROM users GROUP BY trust_tier');
  console.log('\n📊 User tier distribution:');
  users.forEach(u => console.log(`  ${u.trust_tier}: ${u.cnt} users`));

  await c.end();
  console.log('\n🎉 Migration complete!');
  process.exit(0);
})().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
