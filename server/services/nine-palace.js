/**
 * 九宫格划分算法（修正版）
 * 精确缺角判断：凹陷深度 ≥ 1/3 且 缺角面积 ≥ 10%
 */
import { CORNER_MEANINGS } from './fengshui-rules.js';

const PALACE_CONFIG = [
  { position: '东南', trigram: '巽', element: '木' },
  { position: '正南', trigram: '离', element: '火' },
  { position: '西南', trigram: '坤', element: '土' },
  { position: '正东', trigram: '震', element: '木' },
  { position: '中宫', trigram: '中', element: '土', isCenter: true },
  { position: '正西', trigram: '兑', element: '金' },
  { position: '东北', trigram: '艮', element: '土' },
  { position: '正北', trigram: '坎', element: '水' },
  { position: '西北', trigram: '乾', element: '金' },
];

const ORIENTATION_MAP = {
  south: ['东南', '正南', '西南', '正东', '中宫', '正西', '东北', '正北', '西北'],
  north: ['西北', '正北', '东北', '正西', '中宫', '正东', '西南', '正南', '东南'],
  east:  ['东北', '正东', '东南', '正北', '中宫', '正南', '西北', '正西', '西南'],
  west:  ['西南', '正西', '西北', '正南', '中宫', '正北', '东南', '正东', '东北'],
  se:    ['正南', '西南', '正西', '东南', '中宫', '西北', '正东', '东北', '正北'],
  sw:    ['正西', '西北', '正北', '西南', '中宫', '东北', '正南', '东南', '正东'],
  ne:    ['正北', '东北', '正东', '西北', '中宫', '东南', '正西', '西南', '正南'],
  nw:    ['正东', '东南', '正南', '东北', '中宫', '西南', '正北', '西北', '正西'],
};

/**
 * 缺角判定（修正版核心算法）
 * @param {number} actualArea - 实际面积占比
 * @param {number} fullArea - 应有面积占比
 * @param {number} indentDepth - 凹陷深度
 * @param {number} sideLength - 该宫位边长
 * @param {number} totalArea - 户型总面积（用于大户型特殊判断）
 */
export function isMissingCorner(actualArea, fullArea, indentDepth, sideLength, totalArea = 100) {
  const missingRatio = fullArea > 0 ? (fullArea - actualArea) / fullArea : 0;
  const indentRatio = sideLength > 0 ? indentDepth / sideLength : 0;

  // 凹陷深度不足 1/3，不算缺角
  if (indentRatio < 0.33) {
    return { isMissing: false, severity: 'none', reason: '凹陷深度不足边长的1/3，不算缺角' };
  }

  // 微缺：缺角面积 < 10%（大户型需 ≥ 15%）
  const minRatio = totalArea > 200 ? 0.15 : 0.10;
  if (missingRatio < minRatio) {
    return { isMissing: false, severity: 'none', reason: `缺角面积小于${Math.round(minRatio * 100)}%，属于微缺可忽略` };
  }

  // 轻度缺角
  if (missingRatio < 0.20) {
    return { isMissing: true, severity: '轻', reason: `缺角面积${Math.round(missingRatio * 100)}%，属于轻度缺角` };
  }

  // 中度缺角
  if (missingRatio < 0.33) {
    return { isMissing: true, severity: '中', reason: `缺角面积${Math.round(missingRatio * 100)}%，属于中度缺角` };
  }

  // 严重缺角
  return { isMissing: true, severity: '重', reason: `缺角面积${Math.round(missingRatio * 100)}%，属于严重缺角` };
}

/**
 * 伪缺角排除规则
 */
function isPseudoMissing(layoutType, missingPosition, features = {}) {
  // L形但短边超过长边2/3 → 不算缺角，算不规则
  if (layoutType === 'L-shape' && features.shortToLongRatio > 0.67) {
    return { isPseudo: true, reason: 'L形布局且短边超过长边2/3，属于不规则户型而非缺角' };
  }

  // 缺角处为电梯井/公共管井 → 不算缺角
  if (features.isUtilityArea) {
    return { isPseudo: true, reason: '缺角处为公共设施（电梯井/管井），不计入缺角' };
  }

  // 内阳台内包后补齐 → 不算缺角
  if (features.hasEnclosedBalcony) {
    return { isPseudo: true, reason: '室内阳台内包后已补齐该区域' };
  }

  return { isPseudo: false };
}

/**
 * 分析九宫格
 * @param {Array} rooms - AI识别的房间列表
 * @param {string} orientation - 朝向
 * @param {Object} features - 户型特征（含layoutAnalysis）
 * @param {number} totalArea - 估算总面积
 */
export function analyzeNinePalace(rooms = [], orientation = 'south', features = {}, totalArea = 100) {
  const order = ORIENTATION_MAP[orientation] || ORIENTATION_MAP.south;
  const palaces = [];
  const missingCorners = [];

  for (let i = 0; i < 9; i++) {
    const posName = order[i];
    const config = PALACE_CONFIG.find(p => p.position === posName);

    // 中宫不参与缺角判断
    if (config.isCenter) {
      palaces.push({
        position: '中宫',
        trigram: '中',
        element: '土',
        isCenter: true,
        rooms: findRoomsInPalace(rooms, '中宫'),
        areaRatio: 100,
        missing: false,
        score: 70,
      });
      continue;
    }

    // 查找该宫位内的房间
    const roomsInPalace = findRoomsInPalace(rooms, posName);
    const actualArea = calculateAreaRatio(roomsInPalace);
    const fullArea = 100 / 9; // 每个宫位的应有面积占比 (≈11%)

    // 从AI数据中获取缺角信息
    const aiSaysMissing = features.missingCornerPositions?.includes(posName) || false;
    const indentInfo = features.indentInfo || {};

    // 缺角判定：
    // - 只信任 AI 的 explicit 标记（missingCornerPositions 或 indentInfo）
    // - 不从房间数据推断（容易误判）
    let indentDepth = 0;
    let isActuallyMissing = false;
    let missingSeverity = null;
    let missingReason = null;

    if (aiSaysMissing || indentInfo[posName] !== undefined) {
      indentDepth = indentInfo[posName] || 0.4;
      const missingResult = isMissingCorner(actualArea, fullArea, indentDepth, 1, totalArea);
      const pseudoCheck = isPseudoMissing(features.layoutType, posName, features);
      isActuallyMissing = missingResult.isMissing && !pseudoCheck.isPseudo;
      if (isActuallyMissing) {
        missingSeverity = missingResult.severity;
        missingReason = pseudoCheck.isPseudo ? pseudoCheck.reason : missingResult.reason;
      }
    }

    if (isActuallyMissing) {
      missingCorners.push({
        position: posName,
        severity: missingSeverity,
        reason: missingReason,
      });
    }

    // 获取该方位对应的优缺点
    const cornerMeaning = CORNER_MEANINGS[posName];

    palaces.push({
      position: posName,
      trigram: config.trigram,
      element: config.element,
      rooms: roomsInPalace.map(r => r.name || r),
      areaRatio: Math.round(actualArea * 100),
      fullAreaRatio: Math.round(fullArea * 100),
      missing: isActuallyMissing,
      missingSeverity: isActuallyMissing ? missingSeverity : null,
      missingReason: isActuallyMissing ? missingReason : null,
      pseudoMissing: false,
      pseudoReason: null,
      cornerMeaning,
      score: calculatePalaceScore(config, roomsInPalace, isActuallyMissing, missingSeverity),
    });
  }

  return {
    palaces,
    missingCorners,
    orientation,
  };
}

function findRoomsInPalace(rooms, position) {
  if (!rooms || rooms.length === 0) return [];

  // 更丰富的关键词匹配，支持 AI 返回的各种方位表述
  const posKeywords = {
    '西北': ['西北', 'nw', '西偏北', '北偏西'],
    '正北': ['正北', '北部', '北面', '北侧', 'north', '北方'],
    '东北': ['东北', 'ne', '东偏北', '北偏东'],
    '正西': ['正西', '西部', '西面', '西侧', 'west', '西方'],
    '中宫': ['中央', '中间', 'center', '中部', '中区', '正中', '核心'],
    '正东': ['正东', '东部', '东面', '东侧', 'east', '东方'],
    '西南': ['西南', 'sw', '西偏南', '南偏西'],
    '正南': ['正南', '南部', '南面', '南侧', 'south', '南方'],
    '东南': ['东南', 'se', '东偏南', '南偏东'],
  };

  // 为避免歧义（如"东北"同时匹配"东"和"北"），按关键词长度从长到短检查
  const keywords = posKeywords[position] || [];
  const sorted = [...keywords].sort((a, b) => b.length - a.length);

  return rooms.filter(room => {
    const roomPos = (room.position || '').toLowerCase();
    // 先按精确方位关键词匹配
    for (const kw of sorted) {
      if (roomPos.includes(kw.toLowerCase())) {
        // 排除歧义：若匹配"东"但实际是"东北"或"东南"，则不属于"正东"
        if (position === '正东' && (roomPos.includes('东北') || roomPos.includes('东南'))) {
          return false;
        }
        if (position === '正西' && (roomPos.includes('西北') || roomPos.includes('西南'))) {
          return false;
        }
        if (position === '正南' && (roomPos.includes('西南') || roomPos.includes('东南'))) {
          return false;
        }
        if (position === '正北' && (roomPos.includes('西北') || roomPos.includes('东北'))) {
          return false;
        }
        return true;
      }
    }
    return false;
  });
}

function calculateAreaRatio(rooms) {
  if (!rooms || rooms.length === 0) return 0;
  const total = rooms.reduce((sum, r) => {
    const area = parseFloat(r.approximateArea) || parseFloat(r.area) || 0;
    return sum + area;
  }, 0);
  return Math.min(total / 100, 1);
}

function calculatePalaceScore(config, rooms, isMissing, severity) {
  let score = 75;

  if (isMissing) {
    const penalty = { '轻': 10, '中': 20, '重': 35 };
    score -= penalty[severity] || 15;
  }

  if (rooms.length === 0) score -= 8;

  // 中宫有卫生间或其他不利房间
  if (config.position === '中宫') {
    const roomNames = rooms.map(r => r.name || r).join(',');
    if (roomNames.includes('卫生间') || roomNames.includes('厕所')) {
      score -= 40; // 厕占中宫是严重问题
    }
    if (roomNames.includes('厨房')) {
      score -= 25;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export default { analyzeNinePalace, isMissingCorner, PALACE_CONFIG };
