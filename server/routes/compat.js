import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

/** 保存合盘记录 */
router.post('/records', authMiddleware, (req, res) => {
  try {
    const { id, maleData, femaleData, resultData, aiInsight, label } = req.body;
    if (!id || !maleData || !femaleData || !resultData || !label) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const existing = db.prepare('SELECT id FROM compat_records WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (existing) {
      db.prepare(`
        UPDATE compat_records SET male_data = ?, female_data = ?, result_data = ?, ai_insight = ?, label = ?
        WHERE id = ? AND user_id = ?
      `).run(
        JSON.stringify(maleData), JSON.stringify(femaleData),
        JSON.stringify(resultData), aiInsight || null, label, id, req.userId,
      );
    } else {
      const conflicting = db.prepare('SELECT id FROM compat_records WHERE id = ?').get(id);
      if (conflicting) {
        return res.status(409).json({ error: '记录 ID 已存在' });
      }

      db.prepare(`
        INSERT INTO compat_records (id, user_id, male_data, female_data, result_data, ai_insight, label)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, req.userId,
        JSON.stringify(maleData), JSON.stringify(femaleData),
        JSON.stringify(resultData), aiInsight || null, label,
      );
    }

    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 获取当前用户的合盘记录列表 */
router.get('/records', authMiddleware, (req, res) => {
  try {
    const records = db.prepare(
      'SELECT * FROM compat_records WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.userId);

    res.json({
      records: records.map(r => ({
        id: r.id,
        maleData: JSON.parse(r.male_data),
        femaleData: JSON.parse(r.female_data),
        resultData: JSON.parse(r.result_data),
        aiInsight: r.ai_insight,
        label: r.label,
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 删除合盘记录 */
router.delete('/records/:id', authMiddleware, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM compat_records WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: '记录未找到' });

    db.prepare('DELETE FROM compat_records WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
