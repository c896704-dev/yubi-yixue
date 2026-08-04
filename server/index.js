import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import db from './db.js';
import { handleError } from './middleware/error-helper.js';
import { deviceMiddleware } from './middleware/device.js';
import { authMiddleware } from './middleware/auth.js';
import { generalLimiter, authLimiter, aiChatLimiter, analysisLimiter } from './middleware/rate-limiter.js';
import helmet from 'helmet';
import analyzeRouter from './routes/analyze.js';
import recordsRouter from './routes/records.js';
import settingsRouter from './routes/settings.js';
import authRouter from './routes/auth.js';
import divinationRouter from './routes/divination.js';
import compatRouter from './routes/compat.js';
import baziRouter from './routes/bazi.js';
import aiRouter from './routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3002', 'https://yubiyixue.xyz', 'https://www.yubiyixue.xyz'];

const app = express();
const PORT = process.env.PORT || 3002;

// 位于 nginx 反向代理之后：信任代理层 X-Forwarded-For，使 req.ip/限流按真实客户端 IP 生效
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(generalLimiter);
app.use(express.json({ limit: '5mb' }));
app.use(deviceMiddleware);

// Routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/analyze', analysisLimiter, analyzeRouter);
app.use('/api/records', recordsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/divination', divinationRouter);
app.use('/api/compat', compatRouter);
app.use('/api/bazi', baziRouter);
app.use('/api/ai', aiChatLimiter, aiRouter);

// Migration import (admin-only, import browser IndexedDB data)
app.post('/api/migrate/import', authMiddleware, async (req, res) => {
  try {
    const { baziRecords, divinationRecords, compatRecords } = req.body;

    if (!req.isAdmin) {
      return res.status(403).json({ error: '无迁移权限，请先登录管理员账号' });
    }
    const adminId = req.userId;

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
    handleError(res, e, '数据迁移');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database
initDatabase();

// HTTPS 强制（必须在静态资源与路由之前注册，否则永远不生效）
if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

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

app.listen(PORT, () => {
  console.log(`御笔易学服务端运行在 http://localhost:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('[WARN] 生产环境建议配置 HTTPS（反向代理 + TLS 证书）');
  }
});
