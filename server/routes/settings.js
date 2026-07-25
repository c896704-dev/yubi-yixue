import { Router } from 'express';
import db from '../db.js';

const router = Router();

// 更新设备信息
router.post('/device', (req, res) => {
  try {
    const { nickname } = req.body;
    db.prepare('UPDATE devices SET nickname = ? WHERE id = ?').run(nickname || null, req.deviceId);

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.deviceId);
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取设备信息
router.get('/device', (req, res) => {
  try {
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.deviceId);
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
