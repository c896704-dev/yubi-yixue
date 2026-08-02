import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return res.status(400).json({ error: '请填写所有必填字段' });
    if (password.length < 8) return res.status(400).json({ error: '密码至少需要8位' });

    const passwordChecks = [
      { test: /[a-zA-Z]/.test(password), msg: '密码需包含至少一个英文字母' },
      { test: /[0-9]/.test(password), msg: '密码需包含至少一个数字' },
    ];
    for (const check of passwordChecks) {
      if (!check.test) return res.status(400).json({ error: check.msg });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: '请输入有效的邮箱地址' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: '该邮箱已注册' });

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id, email, username, passwordHash, 'user');

    const token = jwt.sign({ userId: id, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user: { id, email, username, isAdmin: false } } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: '请填写邮箱和密码' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: '邮箱或密码错误' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: '邮箱或密码错误' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, username: user.username, isAdmin: (user.role || 'user') === 'admin' } } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, username, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ success: true, data: { user: { ...user, isAdmin: (user.role || 'user') === 'admin' } } });
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export default router;
