import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] 生产环境必须设置 JWT_SECRET 环境变量，应用拒绝启动');
    process.exit(1);
  }
  console.warn('[WARN] JWT_SECRET 未设置，当前使用开发临时密钥。生产环境请务必配置！');
}

const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'yubi-yixue-dev-only-temp-secret';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, EFFECTIVE_JWT_SECRET);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.isAdmin = payload.role === 'admin';
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), EFFECTIVE_JWT_SECRET);
      req.userId = payload.userId;
      req.userEmail = payload.email;
      req.isAdmin = payload.role === 'admin';
    } catch { /* token invalid, proceed as anonymous */ }
  }
  next();
}

export { EFFECTIVE_JWT_SECRET as JWT_SECRET };
