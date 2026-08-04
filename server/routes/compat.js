import { Router } from 'express';
import db from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { handleError } from '../middleware/error-helper.js';

const router = Router();
router.use(optionalAuth);

function canSeeAll(req) { return req.isAdmin; }

/** Save (always works) */
router.post('/records', (req, res) => {
  try {
    const { id, maleData, femaleData, resultData, aiInsight, label } = req.body;
    if (!id || !maleData || !femaleData || !resultData || !label) return res.status(400).json({ error: '缺少必要字段' });

    const deviceId = req.deviceId || '';
    const existing = db.prepare('SELECT id, user_id, device_id FROM compat_records WHERE id = ?').get(id);
    if (existing) {
      // IDOR 防护：UPDATE 前校验归属——管理员、记录创建者或设备所有者方可更新
      const isAdmin = canSeeAll(req);
      const isOwner = req.userId && existing.user_id === req.userId;
      const isDeviceOwner = !req.userId && existing.device_id === deviceId;
      if (!isAdmin && !isOwner && !isDeviceOwner) {
        return res.status(403).json({ error: '无权修改此记录' });
      }
      // UPDATE 不改变 user_id（谁创建的归谁）
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
    handleError(res, e, '保存合盘记录');
  }
});

/** Get (admin sees all, normal users see own) */
router.get('/records', (req, res) => {
  try {
    let records;
    if (canSeeAll(req)) {
      records = db.prepare('SELECT * FROM compat_records ORDER BY created_at DESC').all();
    } else if (req.userId) {
      records = db.prepare('SELECT * FROM compat_records WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    } else {
      records = db.prepare('SELECT * FROM compat_records WHERE device_id = ? ORDER BY created_at DESC').all(req.deviceId || '');
    }

    res.json({ records: records.map(r => ({
      id: r.id, maleData: JSON.parse(r.male_data), femaleData: JSON.parse(r.female_data),
      resultData: JSON.parse(r.result_data), aiInsight: r.ai_insight, label: r.label,
      createdAt: r.created_at, userId: r.user_id,
    }))});
  } catch (e) {
    handleError(res, e, '获取合盘记录');
  }
});

/** Delete (admin can delete any) */
router.delete('/records/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id, user_id, device_id FROM compat_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '记录未找到' });

    const isAdmin = canSeeAll(req);
    const isOwner = req.userId && existing.user_id === req.userId;
    const isDeviceOwner = !req.userId && existing.device_id === (req.deviceId || '');
    if (!isAdmin && !isOwner && !isDeviceOwner) return res.status(403).json({ error: '无权删除' });

    db.prepare('DELETE FROM compat_records WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    handleError(res, e, '删除合盘记录');
  }
});

export default router;
