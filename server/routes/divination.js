import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/** POST /api/divination/records — 保存算卦记录 */
router.post('/records', authMiddleware, (req, res) => {
  try {
    const { id, type, method, question, hexagramData, aiInterpretation, createdAt } = req.body;
    if (!id || !type || !method || !hexagramData) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    if (!['liuyao', 'meihua'].includes(type)) {
      return res.status(400).json({ error: '无效的算卦类型' });
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO divination_records (id, user_id, type, method, question, hexagram_data, ai_interpretation, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      req.userId,
      type,
      method,
      question || null,
      JSON.stringify(hexagramData),
      aiInterpretation || null,
      createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('保存算卦记录失败:', error);
    res.status(500).json({ error: '保存失败' });
  }
});

/** GET /api/divination/records — 获取记录列表 */
router.get('/records', authMiddleware, (req, res) => {
  try {
    const { type } = req.query;
    let stmt;
    if (type && ['liuyao', 'meihua'].includes(type)) {
      stmt = db.prepare(
        'SELECT * FROM divination_records WHERE user_id = ? AND type = ? ORDER BY created_at DESC LIMIT 50'
      );
      stmt.bind(req.userId, type);
    } else {
      stmt = db.prepare(
        'SELECT * FROM divination_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
      );
      stmt.bind(req.userId);
    }
    const rows = stmt.all();
    const records = rows.map(row => ({
      ...row,
      hexagramData: JSON.parse(row.hexagram_data),
      createdAt: new Date(row.created_at).getTime(),
    }));
    res.json({ success: true, records });
  } catch (error) {
    console.error('获取算卦记录失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/** DELETE /api/divination/records/:id — 删除记录 */
router.delete('/records/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM divination_records WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, req.userId);
    if (result.changes === 0) {
      return res.status(404).json({ error: '记录不存在或无权删除' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('删除算卦记录失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
