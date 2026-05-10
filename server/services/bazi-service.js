/**
 * 八字五行计算服务
 * 基础五行归类 + 房屋匹配度
 */

// 生肖五行对照表
const ANIMAL_ELEMENT = {
  '鼠': '水', '牛': '土', '虎': '木', '兔': '木',
  '龙': '土', '蛇': '火', '马': '火', '羊': '土',
  '猴': '金', '鸡': '金', '狗': '土', '猪': '水',
};

// 年份 → 生肖
function getAnimal(year) {
  const animals = ['猴', '鸡', '狗', '猪', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊'];
  return animals[year % 12];
}

// 方位五行
const DIRECTION_ELEMENT = {
  '东': '木', '东南': '木', '南': '火',
  '西': '金', '西北': '金', '北': '水',
  '东北': '土', '西南': '土', '中': '土',
  'east': '木', 'se': '木', 'south': '火',
  'west': '金', 'nw': '金', 'north': '水',
  'ne': '土', 'sw': '土',
};

// 房间类型五行
const ROOM_ELEMENT = {
  '厨房': '火', '卫生间': '水', '厕所': '水', '浴室': '水',
  '卧室': '土', '主卧': '土', '次卧': '土', '书房': '火',
  '客厅': '木', '起居室': '木', '阳台': '金',
  '大门': '金', '入户': '金', '玄关': '土',
  '餐厅': '土', '走廊': '水', '储物': '土',
};

// 五行相生相克
const GENERATES = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const CONTROLS = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
const GENERATED_BY = { '火': '木', '土': '火', '金': '土', '水': '金', '木': '水' };

/**
 * 根据出生年份获取属相和五行
 */
export function getBirthInfo(year) {
  const animal = getAnimal(year);
  const element = ANIMAL_ELEMENT[animal];
  return { animal, element };
}

/**
 * 五行匹配度计算
 * @param {string} personElement - 房主年柱五行
 * @param {string} houseElement - 房屋/方位/房间五行
 * @returns {{ level: string, description: string, score: number }}
 */
export function getElementCompatibility(personElement, houseElement) {
  if (!personElement || !houseElement) {
    return { level: 'unknown', description: '无法判断', score: 50 };
  }

  if (personElement === houseElement) {
    return { level: 'neutral_good', description: '比和（相同）— 五行相同，彼此不冲突，中等吉', score: 65 };
  }
  if (GENERATES[personElement] === houseElement) {
    return { level: 'good', description: '相生（我生）— 房主泄秀于此，平安吉顺', score: 75 };
  }
  if (GENERATED_BY[personElement] === houseElement) {
    return { level: 'great', description: '相生（生我）— 房屋旺房主，大吉之象', score: 90 };
  }
  if (CONTROLS[personElement] === houseElement) {
    return { level: 'neutral', description: '相克（我克）— 房主能掌控此局，中平', score: 55 };
  }
  if (CONTROLS[houseElement] === personElement) {
    return { level: 'bad', description: '相克（克我）— 房屋气场压制房主，需调和', score: 25 };
  }
  return { level: 'unknown', description: '无法判断', score: 50 };
}

/**
 * 获取房屋朝向的五行
 */
export function getOrientationElement(orientation) {
  const map = {
    south: '火', north: '水', east: '木', west: '金',
    se: '木', ne: '土', sw: '土', nw: '金',
  };
  return map[orientation?.toLowerCase()] || '土';
}

/**
 * 获取房间的五行
 */
export function getRoomElement(roomName) {
  for (const [key, element] of Object.entries(ROOM_ELEMENT)) {
    if (roomName.includes(key)) return element;
  }
  return null;
}

/**
 * 获取方位的五行
 */
export function getDirectionElement(position) {
  for (const [key, element] of Object.entries(DIRECTION_ELEMENT)) {
    if (position.includes(key)) return element;
  }
  return null;
}

/**
 * 分析房主属相与房屋各维度的五行匹配度
 */
export function analyzeBaziMatch(year, orientation, rooms, ninePalace) {
  const birthInfo = getBirthInfo(year);
  const personElement = birthInfo.element;

  const matches = [];

  // 1. 朝向匹配
  const orientElement = getOrientationElement(orientation);
  const orientMatch = getElementCompatibility(personElement, orientElement);
  matches.push({
    type: 'orientation',
    label: `房屋朝向（${orientation}，属${orientElement}）`,
    element: orientElement,
    ...orientMatch,
  });

  // 2. 各房间匹配
  if (rooms && rooms.length > 0) {
    for (const room of rooms) {
      const roomElem = getRoomElement(room.name || '');
      if (!roomElem) continue;

      const posElem = getDirectionElement(room.position || '');
      const match = getElementCompatibility(personElement, roomElem);

      matches.push({
        type: 'room',
        label: `${room.name || '房间'}（${room.position || '未知位置'}，属${roomElem}）`,
        element: roomElem,
        positionElement: posElem,
        ...match,
      });
    }
  }

  // 3. 九宫格各宫位匹配
  if (ninePalace?.palaces) {
    for (const palace of ninePalace.palaces) {
      if (palace.isCenter) continue;
      const dirElem = DIRECTION_ELEMENT[palace.position] || '土';
      const match = getElementCompatibility(personElement, dirElem);

      matches.push({
        type: 'palace',
        label: `${palace.position}宫位（${palace.trigram}卦，属${dirElem}）`,
        element: dirElem,
        ...match,
      });
    }
  }

  // 4. 综合匹配分
  const scores = matches.map(m => m.score);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 50;

  const greatMatches = matches.filter(m => m.level === 'great');
  const badMatches = matches.filter(m => m.level === 'bad');

  return {
    birthInfo,
    personElement,
    personAnimal: birthInfo.animal,
    matches,
    avgScore,
    greatCount: greatMatches.length,
    badCount: badMatches.length,
    summary: generateBaziSummary(avgScore, greatMatches, badMatches, personElement, orientElement),
  };
}

function generateBaziSummary(avgScore, greatMatches, badMatches, personElement, orientElement) {
  if (avgScore >= 80) {
    return `此房五行与房主（属${personElement}）高度契合，朝向属${orientElement}旺房主，多维度匹配良好，是房主的理想居所。`;
  }
  if (avgScore >= 65) {
    return `此房五行与房主（属${personElement}）基本匹配，${badMatches.length > 0 ? `需注意${badMatches.length}处相克关系` : '无明显冲克'}，整体可居。`;
  }
  if (avgScore >= 50) {
    return `此房五行与房主（属${personElement}）匹配度一般，${badMatches.length > 0 ? `存在${badMatches.length}处相克关系` : ''}，建议通过装修布局调和。`;
  }
  return `此房五行与房主（属${personElement}）匹配较差，${badMatches.length > 0 ? `多处相克` : ''}气场不合，需要重点调和。`;
}

export default {
  getBirthInfo,
  getElementCompatibility,
  getOrientationElement,
  getRoomElement,
  getDirectionElement,
  analyzeBaziMatch,
  DIRECTION_ELEMENT,
  ROOM_ELEMENT,
};
