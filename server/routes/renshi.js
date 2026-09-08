import { Router } from 'express';
import db from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

/** Save (upsert)：管理员/创建者/设备所有者可改；登录用户写入 user_id，匿名写入 device_id。
 *  ai_insight / trajectory_insight 用 COALESCE 保护——POST 不带该字段时不清空（双 AI 各走各的 PATCH 字段级更新） */
router.post('/records', (req, res) => {
  try {
    const { id, person, resultData, aiInsight, trajectoryInsight, label, createdAt } = req.body;
    if (!id || !person || !person.birthYear) return res.status(400).json({ error: '缺少必填字段' });

    const deviceId = req.deviceId || '';
    const existing = db.prepare('SELECT id, user_id, device_id FROM renshi_records WHERE id = ?').get(id);
    if (existing) {
      const isOwner = req.userId && existing.user_id === req.userId;
      const isDeviceOwner = !req.userId && existing.device_id === deviceId;
      if (!req.isAdmin && !isOwner && !isDeviceOwner) return res.status(403).json({ error: '无权修改此记录' });
      db.prepare(`UPDATE renshi_records SET person_data=?, result_data=?, label=?, created_at=?,
          ai_insight=COALESCE(?, ai_insight), trajectory_insight=COALESCE(?, trajectory_insight) WHERE id=?`)
        .run(JSON.stringify(person), resultData ? JSON.stringify(resultData) : null,
          label || '', createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
          aiInsight ?? null, trajectoryInsight ?? null, id);
    } else {
      db.prepare(`INSERT INTO renshi_records (id, user_id, device_id, person_data, result_data, ai_insight, trajectory_insight, label, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, req.userId || null, deviceId, JSON.stringify(person),
          resultData ? JSON.stringify(resultData) : null, aiInsight || null, trajectoryInsight || null, label || '',
          createdAt ? new Date(createdAt).toISOString() : new Date().toISOString());
    }
    res.json({ success: true, id });
  } catch (error) {
    console.error('Save renshi failed:', error);
    res.status(500).json({ error: '保存失败' });
  }
});

/** AI 解读按字段写（列名白名单映射，绝不拼接请求值）：识人解读与轨迹解读并发完成互不覆盖 */
const AI_COLUMN = { aiInsight: 'ai_insight', trajectoryInsight: 'trajectory_insight' };
router.patch('/records/:id/ai', (req, res) => {
  try {
    const { field, text } = req.body;
    const col = AI_COLUMN[field];
    if (!col) return res.status(400).json({ error: '非法字段' });
    if (typeof text !== 'string') return res.status(400).json({ error: '缺少内容' });
    const existing = db.prepare('SELECT id, user_id, device_id FROM renshi_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '记录不存在' });
    const isOwner = req.userId && existing.user_id === req.userId;
    const isDeviceOwner = !req.userId && existing.device_id === (req.deviceId || '');
    if (!req.isAdmin && !isOwner && !isDeviceOwner) return res.status(403).json({ error: '无权修改此记录' });
    db.prepare(`UPDATE renshi_records SET ${col}=? WHERE id=?`).run(text, req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Patch renshi ai failed:', error);
    res.status(500).json({ error: '保存失败' });
  }
});

/** Get：管理员全部；登录用户 own + 匿名公共记录（跨设备一致）；未登录按设备 */
router.get('/records', (req, res) => {
  try {
    let sql = 'SELECT * FROM renshi_records';
    const params = [];
    if (!req.isAdmin) {
      if (req.userId) {
        sql += ' WHERE user_id = ? OR user_id IS NULL';
        params.push(req.userId);
      } else {
        sql += ' WHERE device_id = ?';
        params.push(req.deviceId || '');
      }
    }
    sql += ' ORDER BY created_at DESC LIMIT 200';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, records: rows.map(r => ({
      id: r.id, person: JSON.parse(r.person_data),
      resultData: r.result_data ? JSON.parse(r.result_data) : null,
      aiInsight: r.ai_insight, trajectoryInsight: r.trajectory_insight ?? null, label: r.label,
      createdAt: new Date(r.created_at).getTime(),
    })) });
  } catch (error) {
    console.error('Get renshi failed:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/** Delete：管理员/创建者/设备所有者 */
router.delete('/records/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id, user_id, device_id FROM renshi_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '记录不存在' });
    const isOwner = req.userId && existing.user_id === req.userId;
    const isDeviceOwner = !req.userId && existing.device_id === (req.deviceId || '');
    if (!req.isAdmin && !isOwner && !isDeviceOwner) return res.status(403).json({ error: '无权删除' });
    db.prepare('DELETE FROM renshi_records WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
