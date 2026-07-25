import { Router } from 'express';
import db from '../db.js';
import { optionalAuth, ADMIN_EMAIL } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

function canSeeAll(req) { return req.isAdmin || req.userEmail === ADMIN_EMAIL; }

// 获取历史记录列表
router.get('/', (req, res) => {
  try {
    const { type, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT a.id, a.type, a.created_at, a.overall_score, a.summary, a.status,
             a.device_id
      FROM analyses a
      WHERE 1 = 1
    `;
    const params = [];

    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }

    // 用户隔离：管理员看全部，普通登录用户看自己的，匿名看当前设备
    if (!canSeeAll(req)) {
      if (req.userId) {
        query += ' AND a.user_id = ?';
        params.push(req.userId);
      } else {
        query += ' AND a.device_id = ?';
        params.push(req.deviceId || '');
      }
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const records = db.prepare(query).all(...params);
    const countResult = db.prepare(
      'SELECT COUNT(*) as total FROM analyses WHERE 1 = 1' + (type ? ' AND type = ?' : ''),
    ).get(...(type ? [type] : []));

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
      'SELECT * FROM analyses WHERE id = ?'
    ).get(req.params.id);

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
    const existing = db.prepare('SELECT id, device_id FROM analyses WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: '记录不存在' });
    if (!canSeeAll(req) && existing.device_id !== (req.deviceId || '')) {
      return res.status(403).json({ error: '无权删除此记录' });
    }
    db.prepare('DELETE FROM analyses WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 清空所有记录
router.delete('/', (req, res) => {
  try {
    db.prepare('DELETE FROM suggestions WHERE analysis_id IN (SELECT id FROM analyses)').run();
    db.prepare('DELETE FROM analyses').run();

    res.json({ success: true, message: '已清空所有记录' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
