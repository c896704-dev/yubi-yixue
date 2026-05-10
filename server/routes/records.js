import { Router } from 'express';
import db from '../db.js';

const router = Router();

// 获取历史记录列表
router.get('/', (req, res) => {
  try {
    const { type, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT a.id, a.type, a.created_at, a.overall_score, a.summary, a.status,
             a.device_id
      FROM analyses a
      WHERE a.device_id = ?
    `;
    const params = [req.deviceId];

    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const records = db.prepare(query).all(...params);
    const countResult = db.prepare(
      'SELECT COUNT(*) as total FROM analyses WHERE device_id = ?' + (type ? ' AND type = ?' : ''),
    ).get(...(type ? [req.deviceId, type] : [req.deviceId]));

    res.json({
      success: true,
      data: {
        records,
        total: countResult.total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单条记录详情
router.get('/:id', (req, res) => {
  try {
    const analysis = db.prepare(
      'SELECT * FROM analyses WHERE id = ? AND device_id = ?'
    ).get(req.params.id, req.deviceId);

    if (!analysis) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }

    const suggestions = db.prepare(
      'SELECT * FROM suggestions WHERE analysis_id = ? ORDER BY CASE priority WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END'
    ).all(req.params.id);

    res.json({
      success: true,
      data: {
        ...analysis,
        detail_data: analysis.detail_data ? JSON.parse(analysis.detail_data) : null,
        input_data: analysis.input_data ? JSON.parse(analysis.input_data) : null,
        suggestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除单条记录
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM analyses WHERE id = ? AND device_id = ?'
    ).run(req.params.id, req.deviceId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 清空所有记录
router.delete('/', (req, res) => {
  try {
    db.prepare('DELETE FROM suggestions WHERE analysis_id IN (SELECT id FROM analyses WHERE device_id = ?)').run(req.deviceId);
    db.prepare('DELETE FROM analyses WHERE device_id = ?').run(req.deviceId);

    res.json({ success: true, message: '已清空所有记录' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
