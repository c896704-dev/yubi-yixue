import { Router } from 'express';
import db from '../db.js';
import { optionalAuth, authMiddleware } from '../middleware/auth.js';
import { handleError } from '../middleware/error-helper.js';

const router = Router();
router.use(optionalAuth);

function canSeeAll(req) { return req.isAdmin; }

// 获取历史记录列表
router.get('/', (req, res) => {
  try {
    // limit/offset 钳制，防止 LIMIT -5 / NaN 造成全量返回或 500
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20))
    const offset = Math.max(0, Number(req.query.offset) || 0)
    const type = req.query.type

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
    params.push(limit, offset);

    const records = db.prepare(query).all(...params);
    // count 与列表同条件（防止匿名设备得知全库记录总数）
    const countQuery = `
      SELECT COUNT(*) as total FROM analyses a
      WHERE 1 = 1
      ${type ? ' AND a.type = ?' : ''}
      ${!canSeeAll(req) ? (req.userId ? ' AND a.user_id = ?' : ' AND a.device_id = ?') : ''}
    `;
    const countParams = []
    if (type) countParams.push(type)
    if (!canSeeAll(req)) countParams.push(req.userId || req.deviceId || '')
    const countResult = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: {
        records,
        total: countResult.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('[获取风水记录]', error);
    res.status(500).json({ success: false, error: '获取记录失败，请稍后重试' });
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

    const isAdmin = canSeeAll(req);
    const isOwner = req.userId && analysis.user_id === req.userId;
    const isDeviceOwner = !req.userId && analysis.device_id === (req.deviceId || '');
    if (!isAdmin && !isOwner && !isDeviceOwner) {
      return res.status(403).json({ error: '无权查看此记录' });
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
    console.error('[获取风水记录详情]', error);
    res.status(500).json({ success: false, error: '获取记录详情失败，请稍后重试' });
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
    handleError(res, error, '删除记录');
  }
});

// 清空所有记录（仅管理员）
router.delete('/', authMiddleware, (req, res) => {
  try {
    if (!canSeeAll(req)) {
      return res.status(403).json({ error: '仅管理员可清空所有记录' });
    }
    db.prepare('DELETE FROM suggestions WHERE analysis_id IN (SELECT id FROM analyses)').run();
    db.prepare('DELETE FROM analyses').run();

    res.json({ success: true, message: '已清空所有记录' });
  } catch (error) {
    handleError(res, error, '获取记录详情');
  }
});

export default router;
