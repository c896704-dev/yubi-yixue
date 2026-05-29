import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

/** 保存合盘记录（device_id 兜底） */
router.post('/records', (req, res) => {
  try {
    const { id, maleData, femaleData, resultData, aiInsight, label } = req.body;
    if (!id || !maleData || !femaleData || !resultData || !label) {
      return res.status(400).json({ error: '缺少必要字段' });
    }
    const deviceId = req.deviceId || '';

    const existing = db.prepare('SELECT id FROM compat_records WHERE id = ?').get(id);
    if (existing) {
      db.prepare(`UPDATE compat_records SET male_data=?, female_data=?, result_data=?, ai_insight=?, label=? WHERE id=?`)
        .run(JSON.stringify(maleData), JSON.stringify(femaleData), JSON.stringify(resultData), aiInsight || null, label, id);
    } else {
      db.prepare(`INSERT INTO compat_records (id, user_id, device_id, male_data, female_data, result_data, ai_insight, label)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, req.userId || null, deviceId, JSON.stringify(maleData), JSON.stringify(femaleData),
          JSON.stringify(resultData), aiInsight || null, label);
    }
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 获取合盘记录（device_id 或 user_id） */
router.get('/records', (req, res) => {
  try {
    const deviceId = req.deviceId || '';
    const records = req.userId
      ? db.prepare('SELECT * FROM compat_records WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
      : db.prepare('SELECT * FROM compat_records WHERE device_id = ? ORDER BY created_at DESC').all(deviceId);

    res.json({ records: records.map(r => ({
      id: r.id, maleData: JSON.parse(r.male_data), femaleData: JSON.parse(r.female_data),
      resultData: JSON.parse(r.result_data), aiInsight: r.ai_insight, label: r.label, createdAt: r.created_at,
    }))});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 删除合盘记录 */
router.delete('/records/:id', (req, res) => {
  try {
    const deviceId = req.deviceId || '';
    const existing = db.prepare('SELECT id FROM compat_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '记录未找到' });
    db.prepare('DELETE FROM compat_records WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
