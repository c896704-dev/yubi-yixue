import { Router } from 'express';
import db from '../db.js';

const router = Router();

/** 保存算卦记录（device_id 兜底，不强制登录） */
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
    console.error('保存算卦记录失败:', error);
    res.status(500).json({ error: '保存失败' });
  }
});

/** 获取记录列表（device_id 或 user_id） */
router.get('/records', (req, res) => {
  try {
    const { type } = req.query;
    const deviceId = req.deviceId || '';
    let rows;
    if (req.userId) {
      const sql = type && ['liuyao','meihua'].includes(type )
        ? 'SELECT * FROM divination_records WHERE user_id = ? AND type = ? ORDER BY created_at DESC LIMIT 50'
        : 'SELECT * FROM divination_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';
      rows = db.prepare(sql).all(...(type ? [req.userId, type] : [req.userId]));
    } else {
      const sql = type && ['liuyao','meihua'].includes(type )
        ? 'SELECT * FROM divination_records WHERE device_id = ? AND type = ? ORDER BY created_at DESC LIMIT 50'
        : 'SELECT * FROM divination_records WHERE device_id = ? ORDER BY created_at DESC LIMIT 50';
      rows = db.prepare(sql).all(...(type ? [deviceId, type] : [deviceId]));
    }
    res.json({ success: true, records: rows.map(r => ({
      id: r.id, type: r.type, method: r.method, question: r.question,
      hexagramData: JSON.parse(r.hexagram_data), aiInterpretation: r.ai_interpretation,
      label: r.label, createdAt: new Date(r.created_at).getTime(),
    }))});
  } catch (error) {
    console.error('获取算卦记录失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/** 删除记录 */
router.delete('/records/:id', (req, res) => {
  try {
    const deviceId = req.deviceId || '';
    const result = db.prepare(
      req.userId
        ? 'DELETE FROM divination_records WHERE id = ? AND user_id = ?'
        : 'DELETE FROM divination_records WHERE id = ? AND device_id = ?'
    ).run(req.params.id, req.userId || deviceId);
    if (result.changes === 0) return res.status(404).json({ error: '记录不存在' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
