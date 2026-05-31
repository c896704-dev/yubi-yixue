import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'fengshui.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function addColumnSafely(table, column, definition) {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`) } catch {}
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      nickname TEXT,
      analysis_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('layout','location','comprehensive')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      input_data TEXT,
      overall_score INTEGER CHECK(overall_score >= 0 AND overall_score <= 100),
      summary TEXT,
      detail_data TEXT,
      ai_report TEXT,
      status TEXT DEFAULT 'completed' CHECK(status IN ('processing','completed','failed')),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      analysis_id TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('high','medium','low')),
      category TEXT NOT NULL CHECK(category IN ('layout','environment','energy','timely')),
      title TEXT NOT NULL,
      description TEXT,
      principle TEXT,
      solution TEXT,
      FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_device ON analyses(device_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_type ON analyses(type);
    CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at);
    CREATE INDEX IF NOT EXISTS idx_suggestions_analysis ON suggestions(analysis_id);

    -- User authentication tables
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bazi_records (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      device_id TEXT,
      person_data TEXT NOT NULL,
      result_data TEXT,
      label TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_bazi_records_user ON bazi_records(user_id);

    -- Divination records
    CREATE TABLE IF NOT EXISTS divination_records (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      device_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('liuyao', 'meihua')),
      method TEXT NOT NULL,
      question TEXT,
      hexagram_data TEXT NOT NULL,
      ai_interpretation TEXT,
      label TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_divination_user ON divination_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_divination_type ON divination_records(type);

    -- Compat records
    CREATE TABLE IF NOT EXISTS compat_records (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      device_id TEXT,
      male_data TEXT NOT NULL,
      female_data TEXT NOT NULL,
      result_data TEXT NOT NULL,
      ai_insight TEXT,
      label TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_compat_user ON compat_records(user_id);
  `);

  // Migrate existing tables that may be missing new columns
  addColumnSafely('bazi_records', 'device_id', 'TEXT');
  addColumnSafely('bazi_records', 'label', 'TEXT');
  addColumnSafely('bazi_records', 'ai_insight', 'TEXT');
  addColumnSafely('divination_records', 'device_id', 'TEXT');
  addColumnSafely('divination_records', 'label', 'TEXT');
  addColumnSafely('compat_records', 'device_id', 'TEXT');
  // Create indexes after migration (safe for new tables via IF NOT EXISTS, requires column to exist)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bazi_records_device ON bazi_records(device_id);
           CREATE INDEX IF NOT EXISTS idx_divination_device ON divination_records(device_id);
           CREATE INDEX IF NOT EXISTS idx_compat_device ON compat_records(device_id);`);
}

export default db;
