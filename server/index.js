import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { initDatabase } from './db.js';
import db from './db.js';
import { deviceMiddleware } from './middleware/device.js';
import { optionalAuth } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import analyzeRouter from './routes/analyze.js';
import recordsRouter from './routes/records.js';
import settingsRouter from './routes/settings.js';
import authRouter from './routes/auth.js';
import divinationRouter from './routes/divination.js';
import compatRouter from './routes/compat.js';
import baziRouter from './routes/bazi.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(deviceMiddleware);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/records', recordsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/divination', divinationRouter);
app.use('/api/compat', compatRouter);
app.use('/api/bazi', baziRouter);
app.use('/api/ai', aiRouter);

// Migration import (admin-only, import browser IndexedDB data)
app.post('/api/migrate/import', optionalAuth, async (req, res) => {
  try {
    const { baziRecords, divinationRecords, compatRecords } = req.body;

    // 校验管理员身份（JWT 或密码兜底）
    let adminId = null;
    // 优先用 JWT 登录态
    if (req.isAdmin) {
      adminId = req.userId;
    }
    // 如果没有 JWT，用密码兜底
    if (!adminId) {
      const token = process.env.ADMIN_MIGRATE_TOKEN || 'yubi-migrate-2024';
      if (req.body.adminPassword !== token) {
        return res.status(403).json({ error: '无迁移权限，请先登录管理员账号' });
      }
      const adminEmail = 'cyh20101224@126.com';
      let admin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
      if (!admin) {
        const { v4: uuidv4 } = await import('uuid');
        const bcrypt = await import('bcryptjs');
        const adminId2 = uuidv4();
        const hash = bcrypt.hashSync('admin123', 10);
        db.prepare('INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)')
          .run(adminId2, adminEmail, '管理员', hash);
        admin = { id: adminId2 };
      }
      adminId = admin.id;
    }

    let imported = { bazi: 0, divination: 0, compat: 0, skipped: 0 };

    // Import bazi records
    for (const r of (baziRecords || [])) {
      if (!r.person || !r.person.birthYear) { imported.skipped++; continue; }
      const id = r.id || String(Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
      const exists = db.prepare('SELECT id FROM bazi_records WHERE id = ?').get(id);
      if (exists) { imported.skipped++; continue; }
      db.prepare(`INSERT INTO bazi_records (id, user_id, person_data, result_data, label, ai_insight, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(id, adminId, JSON.stringify(r.person), r.resultData ? JSON.stringify(r.resultData) : null,
          r.label || '', r.aiInsight || null, new Date(r.createdAt || Date.now()).toISOString());
      imported.bazi++;
    }

    // Import divination records
    for (const r of (divinationRecords || [])) {
      if (!r.hexagramData) { imported.skipped++; continue; }
      const id = r.id || String(Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
      const exists = db.prepare('SELECT id FROM divination_records WHERE id = ?').get(id);
      if (exists) { imported.skipped++; continue; }
      db.prepare(`INSERT INTO divination_records (id, user_id, type, method, question, hexagram_data, ai_interpretation, label, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, adminId, r.type || 'liuyao', r.method || '', r.question || '',
          JSON.stringify(r.hexagramData), r.aiInterpretation || null, r.label || '',
          new Date(r.createdAt || Date.now()).toISOString());
      imported.divination++;
    }

    // Import compat records
    for (const r of (compatRecords || [])) {
      if (!r.malePerson || !r.femalePerson) { imported.skipped++; continue; }
      const id = r.id || String(Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
      const exists = db.prepare('SELECT id FROM compat_records WHERE id = ?').get(id);
      if (exists) { imported.skipped++; continue; }
      db.prepare(`INSERT INTO compat_records (id, user_id, male_data, female_data, result_data, ai_insight, label, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, adminId, JSON.stringify(r.malePerson), JSON.stringify(r.femalePerson),
          JSON.stringify(r.result || {}), r.aiInsight || null, r.label || '',
          new Date(r.createdAt || Date.now()).toISOString());
      imported.compat++;
    }

    res.json({ success: true, imported });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve public files and production build
const publicPath = path.join(__dirname, '..', 'public');
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(publicPath));
app.use(express.static(distPath));
app.get('*', (_req, res, next) => {
  // Don't catch API routes
  if (_req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Initialize database
initDatabase();

app.listen(PORT, () => {
  console.log(`御笔易学服务端运行在 http://localhost:${PORT}`);
});
