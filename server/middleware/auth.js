import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = 'yubi-yixue-secret-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

const ADMIN_EMAIL = 'cyh20101224@126.com';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.isAdmin = payload.email === ADMIN_EMAIL;
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      req.userId = payload.userId;
      req.userEmail = payload.email;
      req.isAdmin = payload.email === ADMIN_EMAIL;
    } catch { /* token invalid, proceed as anonymous */ }
  }
  next();
}

export { JWT_SECRET, ADMIN_EMAIL };
