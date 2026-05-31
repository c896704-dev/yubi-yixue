import { Router } from 'express';
import db from '../db.js';
import { optionalAuth, ADMIN_EMAIL } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

function canSeeAll(req) { return req.isAdmin || req.userEmail === ADMIN_EMAIL; }

/** Save (always works) */
router.post('/records', (req, res) => {
  try {
    const { id, type, method, question, hexagramData, aiInterpretation, label, createdAt } = req.body;
    if (!id || !type || !method || !hexagramData) return res.status(400).json({ error: '缺少必填字段' });
    if (!['liuyao', 'meihua'].includes(type)) return res.status(400).json({ error: '无效的算卦类型' });

    const deviceId = req.deviceId || '';
    db.prepare(`INSERT OR REPLACE INTO divination_records
      (id, user_id, device_id, type, method, question, hexagram_data, ai_interpretation, label, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, req.userId || null, deviceId, type, method, question || null,
        JSON.stringify(hexagramData), aiInterpretation || null, label || '',
        createdAt ? new Date(createdAt).toISOString() : new Date().toISOString());
    res.json({ success: true, id });
  } catch (error) {
    console.error('Save divination failed:', error);
    res.status(500).json({ error: '保存失败' });
  }
});

/** Get (admin sees all, normal users see own) */
router.get('/records', (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM divination_records';
    const params = [];

    if (!canSeeAll(req)) {
      if (req.userId) {
        sql += ' WHERE user_id = ?';
        params.push(req.userId);
      } else {
        sql += ' WHERE device_id = ?';
        params.push(req.deviceId || '');
      }
      if (type && ['liuyao','meihua'].includes(type)) {
        sql += ' AND type = ?';
        params.push(type);
      }
    } else {
      if (type && ['liuyao','meihua'].includes(type)) {
        sql += ' WHERE type = ?';
        params.push(type);
      }
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, records: rows.map(r => ({
      id: r.id, type: r.type, method: r.method, question: r.question,
      hexagramData: JSON.parse(r.hexagram_data), aiInterpretation: r.ai_interpretation,
      label: r.label, createdAt: new Date(r.created_at).getTime(), userId: r.user_id,
    }))});
  } catch (error) {
    console.error('Get divination failed:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/** Delete (admin can delete any) */
router.delete('/records/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id, user_id, device_id FROM divination_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '记录不存在' });

    const isAdmin = canSeeAll(req);
    const isOwner = req.userId && existing.user_id === req.userId;
    const isDeviceOwner = !req.userId && existing.device_id === (req.deviceId || '');
    if (!isAdmin && !isOwner && !isDeviceOwner) return res.status(403).json({ error: '无权删除' });

    db.prepare('DELETE FROM divination_records WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
