import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6位' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: '该邮箱已注册' });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(
      'INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)'
    ).run(id, email, username, passwordHash);

    const token = jwt.sign({ userId: id, email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      data: {
        token,
        user: { id, email, username },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '请填写邮箱和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, username: user.username },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, username, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export default router;
