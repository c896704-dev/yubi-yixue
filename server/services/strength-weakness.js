/**
 * 优缺点生成引擎
 * 替代旧的 "改进建议" 模式，输出专业的优缺点分析
 */
import {
  CORNER_MEANINGS,
  DOOR_RULES,
  KITCHEN_RULES,
  BATHROOM_RULES,
  BEDROOM_RULES,
  LIVING_ROOM_RULES,
  BALCONY_RULES,
  OVERALL_STRENGTHS,
  OVERALL_WEAKNESSES,
  FLYING_STAR_COMBOS,
} from './fengshui-rules.js';

/**
 * 分析一套户型的优缺点
 */
export function analyzeStrengthsAndWeaknesses({
  rooms = [],
  ninePalace,
  flyingStar,
  features = {},
  orientation = 'south',
}) {
  const strengths = [];
  const weaknesses = [];

  // 1. 九宫格缺角分析
  const cornerResults = analyzeCorners(ninePalace);
  strengths.push(...cornerResults.strengths);
  weaknesses.push(...cornerResults.weaknesses);

  // 2. 各功能区分析
  for (const room of rooms) {
    const roomResults = analyzeRoom(room, rooms, features);
    strengths.push(...roomResults.strengths);
    weaknesses.push(...roomResults.weaknesses);
  }

  // 3. 户型整体分析
  const overallResults = analyzeOverall(rooms, features, orientation);
  strengths.push(...overallResults.strengths);
  weaknesses.push(...overallResults.weaknesses);

  // 4. 飞星组合分析（如果可用）
  if (flyingStar?.palaces) {
    const starResults = analyzeFlyingStarCombo(flyingStar);
    strengths.push(...starResults.strengths);
    weaknesses.push(...starResults.weaknesses);
  }

  // 5. 穿堂煞检测
  const chuantangResults = detectChuanTangSha(rooms, features);
  weaknesses.push(...chuantangResults);

  // 6. 去重 + 排序：按 impact 高→中→低
  const dedupedStrengths = deduplicate(strengths);
  const dedupedWeaknesses = deduplicate(weaknesses);
  const sortedStrengths = sortByImpact(dedupedStrengths);
  const sortedWeaknesses = sortByImpact(dedupedWeaknesses);

  return {
    strengths: sortedStrengths,
    weaknesses: sortedWeaknesses,
    strengthCount: sortedStrengths.length,
    weaknessCount: sortedWeaknesses.length,
  };
}

// ============================================================
// 九宫格缺角优缺点
// ============================================================
function analyzeCorners(ninePalace) {
  const strengths = [];
  const weaknesses = [];

  if (!ninePalace?.palaces) return { strengths, weaknesses };

  for (const palace of ninePalace.palaces) {
    if (palace.isCenter) continue;

    const meaning = CORNER_MEANINGS[palace.position];
    if (!meaning) continue;

    if (palace.missing) {
      const severity = palace.missingSeverity || '中';
      const impact = severity === '重' ? '高' : severity === '中' ? '中' : '低';
      // 取前2个缺点描述
      for (let i = 0; i < Math.min(2, meaning.weaknesses.length); i++) {
        weaknesses.push({
          item: `${palace.position}缺角（${severity}度）— ${meaning.weaknesses[i]}`,
          type: 'layout',
          impact,
          detail: `${meaning.family}方位缺角，${palace.missingReason || '面积不足'}`,
        });
      }
    } else if (palace.areaRatio >= 10) {
      // 该宫位面积充足，为优点
      strengths.push({
        item: `${palace.position}（${meaning.trigram}）宫位完整`,
        type: 'layout',
        impact: '中',
        detail: meaning.strengths[0] || `${meaning.family}运势有保障`,
      });
    }
  }

  return { strengths, weaknesses };
}

// ============================================================
// 单房间风水分析
// ============================================================
function analyzeRoom(room, allRooms, features) {
  const strengths = [];
  const weaknesses = [];
  const name = room.name || '';

  const normalizedName = normalizeRoomName(name);
  if (!normalizedName) return { strengths, weaknesses };

  const rules = getRoomRules(normalizedName);
  if (!rules) return { strengths, weaknesses };

  // 判断是否为主卧
  const isMaster = name.includes('主卧');

  // 检查优点条件
  for (const rule of rules.strengths) {
    // 这些规则仅适用于主卧
    if (rule.condition === '主卧>次卧' && !isMaster) continue;
    if (checkRoomCondition(rule.condition, room, allRooms, features)) {
      strengths.push({
        item: rule.item,
        type: 'layout',
        impact: rule.impact,
        detail: rule.detail,
      });
    }
  }

  // 检查缺点条件
  for (const rule of rules.weaknesses) {
    if (checkRoomCondition(rule.condition, room, allRooms, features)) {
      weaknesses.push({
        item: rule.item,
        type: 'layout',
        impact: rule.impact,
        detail: rule.detail,
      });
    }
  }

  return { strengths, weaknesses };
}

function normalizeRoomName(name) {
  const n = name.toLowerCase().replace(/[男女主次]/g, '');
  if (n.includes('大门') || n.includes('入户') || n.includes('玄关')) return '大门';
  if (n.includes('厨房')) return '厨房';
  if (n.includes('卫生') || n.includes('厕所') || n.includes('浴室') || n.includes('洗手间')) return '卫生间';
  if (n.includes('卧') || n.includes('主') || n.includes('次') || n.includes('客房')) return '卧室';
  if (n.includes('客厅') || n.includes('起居')) return '客厅';
  if (n.includes('阳台')) return '阳台';
  if (n.includes('餐厅')) return '餐厅';
  return null;
}

function getRoomRules(roomType) {
  const map = {
    '大门': DOOR_RULES,
    '厨房': KITCHEN_RULES,
    '卫生间': BATHROOM_RULES,
    '卧室': BEDROOM_RULES,
    '客厅': LIVING_ROOM_RULES,
    '阳台': BALCONY_RULES,
  };
  return map[roomType] || null;
}

/**
 * 简化版条件检查：根据房间的 position/features 做匹配
 */
function checkRoomCondition(condition, room, allRooms, features) {
  const pos = (room.position || '').toLowerCase();
  const allPositions = allRooms.map(r => (r.position || '').toLowerCase()).join(' ');

  const checks = {
    // 大门条件
    '位置吉方': () => pos.includes('南') || pos.includes('东南') || pos.includes('东'),
    '门前开阔': () => features.hasOpenEntrance === true,
    '有玄关': () => allRooms.some(r => (r.name || '').includes('玄关')),
    '大小适中': () => true, // 默认通过
    '门对电梯': () => false, // AI难以判断，需要额外信息
    '门对卫生间': () => checkDoorFacing(room, allRooms, '卫生间', features),
    '门对厨房': () => checkDoorFacing(room, allRooms, '厨房', features),
    '门对阳台': () => checkDoorToBalcony(room, allRooms, features),
    '门对卧室': () => checkDoorFacing(room, allRooms, '卧室', features),
    '门对走道': () => features.hasLongCorridor === true,
    '门对镜': () => false, // AI不可检测
    '横梁压门': () => features.beamNotes?.includes('门'),
    '无玄关': () => !allRooms.some(r => (r.name || '').includes('玄关')),

    // 厨房条件
    '在东/东南': () => pos.includes('东') || pos.includes('东南'),
    '在北': () => pos.includes('北') && !pos.includes('东北') && !pos.includes('西北'),
    '灶台有靠': () => features.stoveBackToWall !== false,
    '有窗': () => !features.noWindowRooms?.includes('厨房'),
    '灶水分离': () => features.stoveWaterSeparated !== false,
    '在西北': () => pos.includes('西北'),
    '在南': () => pos.includes('南'),
    '在中宫': () => pos.includes('中') || pos.includes('中央'),
    '无窗': () => features.noWindowRooms?.includes('厨房'),
    '灶台背窗': () => features.stoveBackToWindow === true,
    '灶对门': () => features.stoveFacingDoor === true,
    '灶紧邻水槽': () => features.stoveNearSink === true,
    '厨卫相邻': () => checkRoomAdjacency('厨房', '卫生间', allRooms),
    '横梁压灶': () => features.beamNotes?.includes('灶'),
    '地高于厅': () => false,
    '灶对冰箱': () => false,

    // 卫生间条件
    '在凶位': () => pos.includes('西北') || pos.includes('正西'),
    '门隐蔽': () => features.bathroomDoorHidden !== false,
    '干湿分离': () => features.dryWetSeparated === true,
    '在西南': () => pos.includes('西南'),
    '在东北': () => pos.includes('东北'),
    '门对大门': () => checkDoorFacing(room, allRooms, '大门', features),
    '门对卧室': () => checkDoorFacing(room, allRooms, '卧室', features),
    '门对餐厅': () => features.bathroomFacingDining === true,
    '在走廊尽头': () => features.bathroomAtCorridorEnd === true,
    '地面偏高': () => false,
    '在文昌位': () => pos.includes('东南'),

    // 卧室条件
    '方正': () => room.approximateArea > 10 && room.approximateArea < 25,
    '在吉位': () => pos.includes('西南') || pos.includes('西北') || pos.includes('东北'),
    '床头靠墙': () => features.bedHeadToWall !== false,
    '主卧>次卧': () => true,
    '在客厅后方': () => checkRoomBehind('卧室', '客厅', allRooms),
    '横梁压床': () => features.beamNotes?.includes('床'),
    '床头靠窗': () => features.bedHeadToWindow === true,
    '床头靠卫墙': () => features.bedHeadToBathroomWall === true,
    '过大': () => (parseFloat(room.approximateArea) || 0) > 30,
    '过小': () => (parseFloat(room.approximateArea) || 0) < 8,
    '门对镜': () => false,
    '床对镜': () => false,
    '卧室>客厅': () => checkRoomLargerThan('卧室', '客厅', allRooms),
    '吊灯压床': () => false,
    '门对卫生间': () => checkDoorFacing(room, allRooms, '卫生间', features),

    // 客厅条件
    '方正宽敞': () => true,
    '在前方': () => pos.includes('南') || pos.includes('前') || pos.includes('东南'),
    '采光好': () => !features.noWindowRooms?.includes('客厅'),
    '沙发靠墙': () => features.sofaBackToWall !== false,
    '南北通透': () => features.northSouthThrough === true,
    '阳台在南': () => checkBalconyDirection(allRooms, '南'),
    '采光差': () => features.noWindowRooms?.includes('客厅'),
    '沙发背门': () => features.sofaBackToDoor === true,
    '横梁压沙发': () => features.beamNotes?.includes('沙发'),
    '厅在西北大露台': () => pos.includes('西北'),
    '无玄关直通': () => !allRooms.some(r => (r.name || '').includes('玄关')),
    '不规则': () => features.isRegular === false,
    '狭长': () => features.isNarrow === true,

    // 阳台条件
    '在南': () => pos.includes('南'),
    '在东南': () => pos.includes('东南'),
    '视野开阔': () => true,
    '客厅带阳台': () => checkBalconyAttachedTo('客厅', allRooms),
    '在北': () => pos.includes('北') && !pos.includes('东北') && !pos.includes('西北'),
    '主卧带阳台': () => checkBalconyAttachedTo('卧室', allRooms),
    '杂物堆积': () => false,
    '直通大门': () => checkDoorToBalcony(
      allRooms.find(r => (r.name || '').includes('大门')), allRooms, features
    ),
    '门对阳台': () => false, // handled by 直通大门
  };

  const checkFn = checks[condition];
  return checkFn ? checkFn() : false;
}

// ============================================================
// 辅助检测函数
// ============================================================
function checkDoorFacing(doorRoom, allRooms, targetType, features) {
  if (!doorRoom) return false;
  const doorPos = doorRoom.position || '';
  const target = allRooms.find(r => {
    const name = r.name || '';
    return name.includes(targetType) || normalizeRoomName(name) === targetType;
  });
  if (!target) return false;
  const targetPos = target.position || '';

  // 检查是否在相对方向
  const opposites = {
    '东南': '西北', '西北': '东南',
    '正东': '正西', '正西': '正东',
    '正南': '正北', '正北': '正南',
    '西南': '东北', '东北': '西南',
  };

  return checkPositionOpposite(doorPos, targetPos, opposites);
}

function checkDoorToBalcony(doorRoom, allRooms, features) {
  if (!doorRoom) return false;
  const balcony = allRooms.find(r => (r.name || '').includes('阳台'));
  if (!balcony) return false;

  const doorPos = doorRoom.position || '';
  const balPos = balcony.position || '';

  // 检查大门和阳台是否在南北或东西直线上
  const alignedPairs = [
    ['南', '北'], ['东', '西'],
    ['东南', '西北'], ['西南', '东北'],
  ];

  for (const [a, b] of alignedPairs) {
    if (doorPos.includes(a) && balPos.includes(b)) return true;
    if (doorPos.includes(b) && balPos.includes(a)) return true;
  }

  return features.hasChuanTangSha === true;
}

function checkPositionOpposite(pos1, pos2, opposites) {
  for (const [p1, p2] of Object.entries(opposites)) {
    if (pos1.includes(p1) && pos2.includes(p2)) return true;
  }
  return false;
}

function checkRoomAdjacency(type1, type2, allRooms) {
  const room1 = allRooms.find(r => (r.name || '').includes(type1));
  const room2 = allRooms.find(r => (r.name || '').includes(type2));
  if (!room1 || !room2) return false;

  // 检查相邻的方位关系
  const adjacentPairs = [
    ['东南', '正南'], ['正南', '西南'], ['西南', '正西'],
    ['正西', '西北'], ['西北', '正北'], ['正北', '东北'],
    ['东北', '正东'], ['正东', '东南'],
  ];

  const pos1 = (room1.position || '').toLowerCase();
  const pos2 = (room2.position || '').toLowerCase();

  for (const [a, b] of adjacentPairs) {
    if (pos1.includes(a) && pos2.includes(b)) return true;
    if (pos2.includes(a) && pos1.includes(b)) return true;
  }

  return false;
}

function checkRoomBehind(roomType, behindType, allRooms) {
  const room = allRooms.find(r => (r.name || '').includes(roomType));
  const behind = allRooms.find(r => (r.name || '').includes(behindType));
  if (!room || !behind) return false;

  const pos = room.position || '';
  const bPos = behind.position || '';
  return pos.includes('后') || pos.includes('北') || pos.includes('西') ||
         bPos.includes('前') || bPos.includes('南') || bPos.includes('东');
}

function checkRoomLargerThan(type1, type2, allRooms) {
  const room1 = allRooms.find(r => (r.name || '').includes(type1));
  const room2 = allRooms.find(r => (r.name || '').includes(type2));
  if (!room1 || !room2) return false;
  return (parseFloat(room1.approximateArea) || 0) > (parseFloat(room2.approximateArea) || 0);
}

function checkBalconyDirection(allRooms, direction) {
  const balcony = allRooms.find(r => (r.name || '').includes('阳台'));
  if (!balcony) return false;
  return (balcony.position || '').toLowerCase().includes(direction.toLowerCase());
}

function checkBalconyAttachedTo(roomType, allRooms) {
  const room = allRooms.find(r => {
    const name = r.name || '';
    return name.includes(roomType) || normalizeRoomName(name) === roomType;
  });
  if (!room) return false;
  const pos = room.position || '';
  const balcony = allRooms.find(r => (r.name || '').includes('阳台'));
  if (!balcony) return false;
  return pos.includes((balcony.position || '').toLowerCase()) ||
         (balcony.position || '').toLowerCase().includes(pos);
}

// ============================================================
// 户型整体分析
// ============================================================
function analyzeOverall(rooms, features, orientation) {
  const strengths = [];
  const weaknesses = [];

  // 南北通透
  const hasNorthRoom = rooms.some(r => (r.position || '').toLowerCase().includes('北'));
  const hasSouthRoom = rooms.some(r => (r.position || '').toLowerCase().includes('南'));
  const isNorthSouthThrough = hasNorthRoom && hasSouthRoom && features.northSouthThrough !== false;

  if (isNorthSouthThrough) {
    strengths.push({
      item: OVERALL_STRENGTHS.high[0].item,
      type: 'layout',
      impact: '高',
      detail: OVERALL_STRENGTHS.high[0].detail,
    });
  }

  // 户型方正检查
  if (features.isRegular !== false) {
    strengths.push({
      item: OVERALL_STRENGTHS.high[1].item,
      type: 'layout',
      impact: '高',
      detail: OVERALL_STRENGTHS.high[1].detail,
    });
  }

  // 全明设计
  const noWindowRooms = features.noWindowRooms || [];
  if (noWindowRooms.length === 0) {
    strengths.push({
      item: OVERALL_STRENGTHS.high[3].item,
      type: 'layout',
      impact: '高',
      detail: OVERALL_STRENGTHS.high[3].detail,
    });
  } else {
    for (const room of noWindowRooms) {
      const isBathroom = room.includes('卫生') || room.includes('厕所');
      weaknesses.push({
        item: isBathroom
          ? OVERALL_WEAKNESSES.moderate[1].item
          : `有暗间（${room}无窗）`,
        type: 'layout',
        impact: isBathroom ? '中' : '低',
        detail: isBathroom
          ? OVERALL_WEAKNESSES.moderate[1].detail
          : `${room}无窗户，阴气偏重，不利健康`,
      });
    }
  }

  // 有玄关
  const hasGenkan = rooms.some(r => (r.name || '').includes('玄关'));
  if (hasGenkan) {
    strengths.push({
      item: OVERALL_STRENGTHS.high[4].item,
      type: 'layout',
      impact: '高',
      detail: OVERALL_STRENGTHS.high[4].detail,
    });
  } else {
    weaknesses.push({
      item: OVERALL_WEAKNESSES.minor[2].item,
      type: 'layout',
      impact: '低',
      detail: OVERALL_WEAKNESSES.minor[2].detail,
    });
  }

  // 进深比检查
  if (features.depthWidthRatio > 2) {
    weaknesses.push({
      item: OVERALL_WEAKNESSES.minor[5].item,
      type: 'layout',
      impact: '低',
      detail: OVERALL_WEAKNESSES.minor[5].detail,
    });
  }

  return { strengths, weaknesses };
}

// ============================================================
// 穿堂煞检测
// ============================================================
function detectChuanTangSha(rooms, features) {
  const weaknesses = [];

  if (features.hasChuanTangSha) {
    weaknesses.push({
      item: '大门直通阳台/窗户（穿堂煞）',
      type: 'layout',
      impact: '高',
      detail: '前通后通、人财两空。气从大门进入后直冲阳台/窗户而出，无法在室内停留积聚，不利于聚财和人丁',
    });
  }

  return weaknesses;
}

// ============================================================
// 飞星组合分析
// ============================================================
function analyzeFlyingStarCombo(flyingStar) {
  const strengths = [];
  const weaknesses = [];

  if (!flyingStar?.palaces) return { strengths, weaknesses };

  for (const palace of flyingStar.palaces) {
    const key1 = `${palace.periodStar}-${palace.mountainStar}`;
    const key2 = `${palace.periodStar}-${palace.facingStar}`;
    const key3 = `${palace.mountainStar}-${palace.facingStar}`;

    for (const key of [key1, key2, key3]) {
      const combo = FLYING_STAR_COMBOS[key];
      if (!combo) continue;

      if (combo.judgment === 'great_auspicious' || combo.judgment === 'auspicious') {
        strengths.push({
          item: `${palace.position}：${combo.name}（${combo.detail}）`,
          type: 'energy',
          impact: combo.judgment === 'great_auspicious' ? '高' : '中',
          detail: `运星${palace.periodStar}与相关星组合形成${combo.name}`,
        });
      } else if (combo.judgment === 'great_inauspicious' || combo.judgment === 'inauspicious') {
        weaknesses.push({
          item: `${palace.position}：${combo.name}（${combo.detail}）`,
          type: 'energy',
          impact: combo.judgment === 'great_inauspicious' ? '高' : '中',
          detail: `运星${palace.periodStar}与相关星组合形成${combo.name}`,
        });
      }
    }
  }

  return { strengths, weaknesses };
}

// ============================================================
// 工具函数
// ============================================================
function sortByImpact(items) {
  const order = { '高': 0, '中': 1, '低': 2 };
  return items.sort((a, b) => (order[a.impact] || 1) - (order[b.impact] || 1));
}

function deduplicate(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.item;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default { analyzeStrengthsAndWeaknesses };
