import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';

const ADMIN_EMAIL = 'cyh20101224@126.com';
const ADMIN_USERNAME = '管理员';
const ADMIN_PASSWORD = process.env.ADMIN_INIT_PASSWORD;

if (!ADMIN_PASSWORD) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] 生产环境首次运行必须设置 ADMIN_INIT_PASSWORD 环境变量');
    process.exit(1);
  }
  console.warn('[WARN] ADMIN_INIT_PASSWORD 未设置，使用开发默认密码。生产环境请务必配置！');
}

const effectivePassword = ADMIN_PASSWORD || 'admin123-dev-only';

initDatabase();

console.log('开始数据迁移...');

// 1. Ensure admin user exists
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
let adminId;

if (existingAdmin) {
  adminId = existingAdmin.id;
  console.log(`管理员用户已存在: ${ADMIN_EMAIL} (id=${adminId})`);
} else {
  adminId = uuidv4();
  const hash = bcrypt.hashSync(effectivePassword, 10);
  db.prepare('INSERT OR IGNORE INTO users (id, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run(adminId, ADMIN_EMAIL, ADMIN_USERNAME, hash, 'admin');
  console.log(`已创建管理员用户: ${ADMIN_EMAIL}（请立即修改密码）`);
}

// 2. Migrate all orphan records (user_id IS NULL) to admin
const baziOrphan = db.prepare('SELECT COUNT(*) as cnt FROM bazi_records WHERE user_id IS NULL').get().cnt;
db.prepare('UPDATE bazi_records SET user_id = ? WHERE user_id IS NULL').run(adminId);
console.log(`八字记录: 迁移 ${baziOrphan} 条匿名记录到管理员`);

const divOrphan = db.prepare('SELECT COUNT(*) as cnt FROM divination_records WHERE user_id IS NULL').get().cnt;
db.prepare('UPDATE divination_records SET user_id = ? WHERE user_id IS NULL').run(adminId);
console.log(`算卦记录: 迁移 ${divOrphan} 条匿名记录到管理员`);

const compatOrphan = db.prepare('SELECT COUNT(*) as cnt FROM compat_records WHERE user_id IS NULL').get().cnt;
db.prepare('UPDATE compat_records SET user_id = ? WHERE user_id IS NULL').run(adminId);
console.log(`合盘记录: 迁移 ${compatOrphan} 条匿名记录到管理员`);

// 3. Ensure indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_bazi_records_user ON bazi_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_divination_user ON divination_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_compat_user ON compat_records(user_id);
`);

const tBazi = db.prepare('SELECT COUNT(*) as cnt FROM bazi_records').get().cnt;
const tDiv = db.prepare('SELECT COUNT(*) as cnt FROM divination_records').get().cnt;
const tCompat = db.prepare('SELECT COUNT(*) as cnt FROM compat_records').get().cnt;

console.log(`\n迁移完成。管理员可见: 八字${tBazi}条 | 算卦${tDiv}条 | 合盘${tCompat}条`);
process.exit(0);
