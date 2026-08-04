import crypto from 'crypto';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const SIGN_SECRET = process.env.DEVICE_SIGN_SECRET || process.env.JWT_SECRET || 'device-sign-dev';

function signDeviceId(id) {
  return crypto.createHmac('sha256', SIGN_SECRET).update(id).digest('hex').slice(0, 16);
}

export function deviceMiddleware(req, res, next) {
  const rawDeviceId = req.headers['x-device-id'];
  const deviceSign = req.headers['x-device-sign'];

  let deviceId;

  if (rawDeviceId && deviceSign) {
    const expectedSign = signDeviceId(rawDeviceId);
    if (deviceSign === expectedSign) {
      deviceId = rawDeviceId;
    }
  }

  if (!deviceId || !db.prepare('SELECT id FROM devices WHERE id = ?').get(deviceId)) {
    deviceId = uuidv4();
    db.prepare(
      'INSERT INTO devices (id, first_seen_at, last_seen_at) VALUES (?, datetime(\'now\'), datetime(\'now\'))'
    ).run(deviceId);
    // 防设备表无限膨胀：超过 5 万行时清理最久未活跃的 1 万行
    try {
      const { total } = db.prepare('SELECT COUNT(*) as total FROM devices').get();
      if (total > 50000) {
        db.prepare(
          'DELETE FROM devices WHERE id NOT IN (SELECT id FROM devices ORDER BY last_seen_at DESC LIMIT 40000)'
        ).run();
      }
    } catch { /* 清理失败不影响主流程 */ }
  } else {
    db.prepare(
      'UPDATE devices SET last_seen_at = datetime(\'now\') WHERE id = ?'
    ).run(deviceId);
  }

  req.deviceId = deviceId;
  res.setHeader('X-Device-Id', deviceId);
  res.setHeader('X-Device-Sign', signDeviceId(deviceId));
  next();
}
