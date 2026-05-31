import { Router } from 'express';
import db from '../db.js';
import { optionalAuth, ADMIN_EMAIL } from '../middleware/auth.js';

const router = Router();

// All record routes pass through optional auth (doesn't reject, but sets userId/isAdmin if token present)
router.use(optionalAuth);

function canSeeAll(req) {
  return req.isAdmin || req.userEmail === ADMIN_EMAIL;
}

/** 保存八字排盘记录 */
router.post('/records', (req, res) => {
  try {
    const { id, personData, resultData, label, aiInsight } = req.body;
    if (!id || !personData) return res.status(400).json({ error: '缺少必要字段' });

    const deviceId = req.deviceId || '';
    const userId = req.userId || null;
    const existing = db.prepare('SELECT id FROM bazi_records WHERE id = ?').get(id);

    if (existing) {
      // UPDATE 不改变 user_id（谁创建的永远归谁）
      db.prepare(`UPDATE bazi_records SET person_data=?, result_data=?, label=?, ai_insight=COALESCE(?, ai_insight), created_at=datetime('now') WHERE id=?`)
        .run(JSON.stringify(personData), resultData ? JSON.stringify(resultData) : null, label || '', aiInsight || null, id);
    } else {
      db.prepare(`INSERT INTO bazi_records (id, user_id, device_id, person_data, result_data, label, ai_insight)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(id, userId, deviceId, JSON.stringify(personData),
          resultData ? JSON.stringify(resultData) : null, label || '', aiInsight || null);
    }
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 获取八字记录（管理员看全部，普通用户看自己的） */
router.get('/records', (req, res) => {
  try {
    let records;
    if (canSeeAll(req)) {
      records = db.prepare('SELECT * FROM bazi_records ORDER BY created_at DESC').all();
    } else if (req.userId) {
      records = db.prepare('SELECT * FROM bazi_records WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    } else {
      const deviceId = req.deviceId || '';
      records = db.prepare('SELECT * FROM bazi_records WHERE device_id = ? ORDER BY created_at DESC').all(deviceId);
    }

    res.json({ records: records.map(r => ({
      id: r.id, personData: JSON.parse(r.person_data),
      resultData: r.result_data ? JSON.parse(r.result_data) : null,
      aiInsight: r.ai_insight || null,
      label: r.label, createdAt: r.created_at, userId: r.user_id,
    }))});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 删除八字记录（管理员可删任意，普通用户仅自己的） */
router.delete('/records/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id, user_id, device_id FROM bazi_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '记录未找到' });

    const isAdmin = canSeeAll(req);
    const isOwner = req.userId && existing.user_id === req.userId;
    const isDeviceOwner = !req.userId && existing.device_id === (req.deviceId || '');

    if (!isAdmin && !isOwner && !isDeviceOwner) {
      return res.status(403).json({ error: '无权删除此记录' });
    }

    db.prepare('DELETE FROM bazi_records WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
