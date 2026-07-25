import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export function deviceMiddleware(req, res, next) {
  let deviceId = req.headers['x-device-id'];

  if (!deviceId) {
    deviceId = uuidv4();
  }

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);

  if (!device) {
    db.prepare(
      'INSERT INTO devices (id, first_seen_at, last_seen_at) VALUES (?, datetime(\'now\'), datetime(\'now\'))'
    ).run(deviceId);
  } else {
    db.prepare(
      'UPDATE devices SET last_seen_at = datetime(\'now\') WHERE id = ?'
    ).run(deviceId);
  }

  req.deviceId = deviceId;
  next();
}
