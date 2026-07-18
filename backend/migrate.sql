-- ──────────────────────────────────────────────────────────────
-- HazardAlert AI Intelligence Platform — Database Migration
-- Run once against hazard_reporting_db
-- ──────────────────────────────────────────────────────────────

-- 1. Add title column to hazards (safe if already exists)
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'hazards'
   AND COLUMN_NAME = 'title') = 0,
  'ALTER TABLE hazards ADD COLUMN title VARCHAR(255) NULL AFTER id',
  'SELECT "title column already exists" AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Create verifications table
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
);

-- Confirm tables
SHOW TABLES;
DESCRIBE verifications;
