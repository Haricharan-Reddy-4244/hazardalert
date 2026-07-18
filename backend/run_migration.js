// run_migration.js — run from backend/ folder with: node run_migration.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  console.log('✅ Connected to database:', process.env.DB_NAME);

  // 1. Add title column to hazards if not exists
  const [cols] = await conn.query(`
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hazards' AND COLUMN_NAME = 'title'`);
  if (cols.length === 0) {
    await conn.query(`ALTER TABLE hazards ADD COLUMN title VARCHAR(255) NULL AFTER id`);
    console.log('✅ Added title column to hazards');
  } else {
    console.log('ℹ️  title column already exists in hazards — skipped');
  }

  // 2. Create verifications table
  await conn.query(`
        CREATE TABLE IF NOT EXISTS verifications (
            response_id   INT AUTO_INCREMENT PRIMARY KEY,
            hazard_id     INT NOT NULL,
            user_id       INT NOT NULL,
            response_type ENUM('confirm','reject') NOT NULL,
            photo_proof   TEXT NULL,
            video_proof   TEXT NULL,
            timestamp     DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (hazard_id) REFERENCES hazards(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
            UNIQUE KEY uniq_user_hazard (user_id, hazard_id)
        )
    `);
  console.log('✅ verifications table ready');

  // 2b. Safe ALTER — add any missing columns to existing verifications table
  const verifyColumns = [
    { name: 'response_type', def: "ENUM('confirm','reject') NOT NULL DEFAULT 'confirm'" },
    { name: 'photo_proof', def: 'TEXT NULL' },
    { name: 'video_proof', def: 'TEXT NULL' },
    { name: 'timestamp', def: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ];
  for (const col of verifyColumns) {
    const [existing] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'verifications' AND COLUMN_NAME = ?`,
      [col.name]
    );
    if (existing.length === 0) {
      await conn.query(`ALTER TABLE verifications ADD COLUMN ${col.name} ${col.def}`);
      console.log(`✅ Added column ${col.name} to verifications`);
    } else {
      console.log(`ℹ️  verifications.${col.name} already exists — skipped`);
    }
  }


  // 3. Create user_locations table (tracks each user's last GPS position)
  await conn.query(`
        CREATE TABLE IF NOT EXISTS user_locations (
            user_id    INT PRIMARY KEY,
            latitude   DECIMAL(10,8) NOT NULL,
            longitude  DECIMAL(11,8) NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
  console.log('✅ user_locations table ready');

  // 4. Create notifications table (proximity witness alerts)
  await conn.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            user_id    INT NOT NULL,
            hazard_id  INT NOT NULL,
            type       VARCHAR(60) NOT NULL DEFAULT 'proximity_verify',
            message    TEXT,
            read_at    DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
            FOREIGN KEY (hazard_id) REFERENCES hazards(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_user_hazard_notif (user_id, hazard_id, type)
        )
    `);
  console.log('✅ notifications table ready');

  // 5. Add escalation_level + updated_at to hazards table (safe checks)
  const [escalCol] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hazards' AND COLUMN_NAME = 'escalation_level'`
  );
  if (escalCol.length === 0) {
    await conn.query(`ALTER TABLE hazards ADD COLUMN escalation_level TINYINT DEFAULT 0`);
    console.log('✅ Added escalation_level to hazards');
  } else {
    console.log('ℹ️  escalation_level already exists — skipped');
  }

  const [updatedAtCol] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hazards' AND COLUMN_NAME = 'updated_at'`
  );
  if (updatedAtCol.length === 0) {
    await conn.query(`ALTER TABLE hazards ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    console.log('✅ Added updated_at to hazards');
  } else {
    console.log('ℹ️  updated_at already exists — skipped');
  }


  // 6. Create escalation_log table (tracks auto-escalation history)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS escalation_log (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      hazard_id    INT NOT NULL,
      from_level   TINYINT DEFAULT 0,
      to_level     TINYINT NOT NULL,
      level_name   VARCHAR(100),
      days_pending INT,
      escalated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hazard_id) REFERENCES hazards(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_hazard_level (hazard_id, to_level)
    )
  `);
  console.log('✅ escalation_log table ready');

  // 7. Create repair_verifications table (post-repair community check)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS repair_verifications (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      hazard_id  INT NOT NULL,
      user_id    INT NOT NULL,
      is_fixed   TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hazard_id) REFERENCES hazards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
      UNIQUE KEY uniq_repair_vote (hazard_id, user_id)
    )
  `);
  console.log('✅ repair_verifications table ready');

  // Confirm
  const [tables] = await conn.query('SHOW TABLES');
  console.log('📋 Tables in DB:', tables.map(r => Object.values(r)[0]).join(', '));

  await conn.end();
  console.log('🎉 Migration complete!');
}

migrate().catch(err => { console.error('❌ Migration failed:', err.message); process.exit(1); });
