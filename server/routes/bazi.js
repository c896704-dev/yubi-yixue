import { Router } from 'express';
import db from '../db.js';

const router = Router();

/** 保存八字排盘记录（device_id 标识，不强制登录） */
router.post('/records', (req, res) => {
  try {
    const { id, personData, resultData, label } = req.body;
    if (!id || !personData) return res.status(400).json({ error: '缺少必要字段' });

    const deviceId = req.deviceId || '';
    const existing = db.prepare('SELECT id FROM bazi_records WHERE id = ?').get(id);

    if (existing) {
      db.prepare(`UPDATE bazi_records SET person_data=?, result_data=?, label=?, created_at=datetime('now') WHERE id=?`)
        .run(JSON.stringify(personData), resultData ? JSON.stringify(resultData) : null, label || '', id);
    } else {
      db.prepare(`INSERT INTO bazi_records (id, user_id, device_id, person_data, result_data, label)
        VALUES (?, ?, ?, ?, ?, ?)`)
        .run(id, req.userId || null, deviceId, JSON.stringify(personData),
          resultData ? JSON.stringify(resultData) : null, label || '');
    }
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 获取八字记录（按 device_id 或 user_id） */
router.get('/records', (req, res) => {
  try {
    const deviceId = req.deviceId || '';
    let records;
    if (req.userId) {
      records = db.prepare('SELECT * FROM bazi_records WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    } else {
      records = db.prepare('SELECT * FROM bazi_records WHERE device_id = ? ORDER BY created_at DESC').all(deviceId);
    }

    res.json({ records: records.map(r => ({
      id: r.id, personData: JSON.parse(r.person_data),
      resultData: r.result_data ? JSON.parse(r.result_data) : null,
      label: r.label, createdAt: r.created_at,
    }))});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 删除八字记录 */
router.delete('/records/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM bazi_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '记录未找到' });
    db.prepare('DELETE FROM bazi_records WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
