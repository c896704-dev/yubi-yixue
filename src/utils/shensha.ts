/**
 * 神煞计算引擎 — 基于《渊海子平》神煞篇、《三命通会》神煞部分
 *
 * 计算天乙贵人、文昌、桃花、驿马、华盖、孤辰寡宿、红艳、阴差阳错等 26 种神煞
 * 采用三层次解读：基础含义 → 柱位修正 → 十神/五行组合修正
 */

import type { HeavenlyStem, EarthlyBranch } from '../constants'
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, STEM_ELEMENT } from '../constants'

// ============================================================
// 类型定义
// ============================================================

export type ShenShaType = '吉' | '凶' | '中性'

export interface ShenShaDetail {
  name: string
  type: ShenShaType
  basedOn: string
  pillar: string
  description: string
}

export interface ShenShaResult {
  all: ShenShaDetail[]
  byType: { 吉: ShenShaDetail[]; 凶: ShenShaDetail[]; 中性: ShenShaDetail[] }
  highlights: string[]
}

// ============================================================
// 1. 天乙贵人（以日干查）— 最吉之神
// ============================================================

const TIAN_YI: Record<HeavenlyStem, EarthlyBranch[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['午', '寅'],
}

// ============================================================
// 2. 天德贵人（以月支查天干）
// ============================================================

const TIAN_DE: Record<EarthlyBranch, string> = {
  '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛',
  '午': '亥', '未': '甲', '申': '癸', '酉': '寅',
  '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚',
}

// ============================================================
// 3. 月德贵人（以月支查天干）
// ============================================================

const YUE_DE: Record<EarthlyBranch, HeavenlyStem[]> = {
  '寅': ['丙'], '午': ['丙'], '戌': ['丙'],       // 寅午戌月在丙
  '申': ['壬'], '子': ['壬'], '辰': ['壬'],       // 申子辰月在壬
  '巳': ['庚'], '酉': ['庚'], '丑': ['庚'],       // 巳酉丑月在庚
  '亥': ['甲'], '卯': ['甲'], '未': ['甲'],       // 亥卯未月在甲
}

// ============================================================
// 4. 文昌贵人（以日干查）— 学业智慧
// ============================================================

const WEN_CHANG: Record<HeavenlyStem, EarthlyBranch> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
}

// ============================================================
// 5. 桃花/咸池（以年支或日支查）
// ============================================================

const TAO_HUA_MAP: Record<EarthlyBranch, EarthlyBranch> = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '巳': '午', '酉': '午', '丑': '午',
  '申': '酉', '子': '酉', '辰': '酉',
  '亥': '子', '卯': '子', '未': '子',
}

// ============================================================
// 6. 驿马（以年支或日支查）
// ============================================================

const YI_MA_MAP: Record<EarthlyBranch, EarthlyBranch> = {
  '寅': '申', '午': '申', '戌': '申',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '申': '寅', '子': '寅', '辰': '寅',
  '亥': '巳', '卯': '巳', '未': '巳',
}

// ============================================================
// 7. 华盖（以年支或日支查）
// ============================================================

const HUA_GAI_MAP: Record<EarthlyBranch, EarthlyBranch> = {
  '寅': '戌', '午': '戌', '戌': '戌',
  '巳': '丑', '酉': '丑', '丑': '丑',
  '申': '辰', '子': '辰', '辰': '辰',
  '亥': '未', '卯': '未', '未': '未',
}

// ============================================================
// 8-9. 孤辰寡宿（以年支查）
// ============================================================

const GU_CHEN: Record<EarthlyBranch, EarthlyBranch> = {
  '寅': '巳', '卯': '巳', '辰': '巳',
  '巳': '申', '午': '申', '未': '申',
  '申': '亥', '酉': '亥', '戌': '亥',
  '亥': '寅', '子': '寅', '丑': '寅',
}

const GUA_SU: Record<EarthlyBranch, EarthlyBranch> = {
  '寅': '丑', '卯': '丑', '辰': '丑',
  '巳': '辰', '午': '辰', '未': '辰',
  '申': '未', '酉': '未', '戌': '未',
  '亥': '戌', '子': '戌', '丑': '戌',
}

// ============================================================
// 10. 红艳煞（以日干查）
// ============================================================

const HONG_YAN: Record<HeavenlyStem, EarthlyBranch> = {
  '甲': '午', '乙': '午', '丙': '寅', '丁': '巳',
  '戊': '辰', '己': '辰', '庚': '戌', '辛': '酉',
  '壬': '子', '癸': '申',
}

// ============================================================
// 11. 阴差阳错日（特定日柱）
// ============================================================

const YIN_CHA_YANG_CUO: string[] = [
  '丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳',
  '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥',
]

// ============================================================
// 12. 十恶大败日
// ============================================================

const SHI_E_DA_BAI: string[] = [
  '甲辰', '乙巳', '壬申', '丙申', '丁亥', '庚辰',
  '戊戌', '癸亥', '辛巳', '己丑',
]

// ============================================================
// 13. 福星贵人（以日干查地支）
// ============================================================

const FU_XING: Record<HeavenlyStem, EarthlyBranch[]> = {
  '甲': ['寅', '子'], '丙': ['寅', '子'],
  '乙': ['卯', '丑'], '癸': ['卯', '丑'],
  '戊': ['申'], '己': ['未'], '丁': ['亥'],
  '庚': ['午'], '辛': ['巳'], '壬': ['辰'],
}

// ============================================================
// 14. 天厨贵人（以日干查地支）
// ============================================================

const TIAN_CHU: Record<HeavenlyStem, EarthlyBranch[]> = {
  '甲': ['巳'], '丙': ['巳'], '乙': ['午'], '丁': ['午'],
  '戊': ['申'], '己': ['申'], '庚': ['亥'], '辛': ['子'],
  '壬': ['寅'], '癸': ['寅'],
}

// ============================================================
// 15. 禄神（以日干查地支）
// ============================================================

const LU_SHEN: Record<HeavenlyStem, EarthlyBranch> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
  '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
  '壬': '亥', '癸': '子',
}

// ============================================================
// 16. 金舆（以日干查地支）
// ============================================================

const JIN_YU: Record<HeavenlyStem, EarthlyBranch> = {
  '甲': '辰', '乙': '巳', '丙': '午', '丁': '巳',
  '戊': '未', '己': '申', '庚': '戌', '辛': '亥',
  '壬': '寅', '癸': '卯',
}

// ============================================================
// 17. 将星（以年支/日支查地支）
// ============================================================

const JIANG_XING: Record<EarthlyBranch, EarthlyBranch> = {
  '寅': '午', '午': '午', '戌': '午',
  '巳': '酉', '酉': '酉', '丑': '酉',
  '申': '子', '子': '子', '辰': '子',
  '亥': '卯', '卯': '卯', '未': '卯',
}

// ============================================================
// 18. 学堂（以日干查地支）
// ============================================================

const XUE_TANG: Record<HeavenlyStem, EarthlyBranch> = {
  '甲': '亥', '乙': '子', '丙': '寅', '丁': '卯',
  '戊': '午', '己': '未', '庚': '巳', '辛': '丑',
  '壬': '申', '癸': '酉',
}

// ============================================================
// 19. 词馆（以日干查地支）
// ============================================================

const CI_GUAN: Record<HeavenlyStem, EarthlyBranch[]> = {
  '甲': ['巳'], '乙': ['巳'], '丙': ['亥'], '丁': ['亥'],
  '戊': ['寅'], '己': ['寅'], '庚': ['申'], '辛': ['申'],
  '壬': ['午'], '癸': ['午'],
}

// ============================================================
// 20. 劫煞（以年支查地支）
// ============================================================

const JIE_SHA: Record<EarthlyBranch, EarthlyBranch> = {
  '寅': '亥', '午': '亥', '戌': '亥',
  '巳': '寅', '酉': '寅', '丑': '寅',
  '申': '巳', '子': '巳', '辰': '巳',
  '亥': '申', '卯': '申', '未': '申',
}

// ============================================================
// 21. 灾煞（以年支查地支）
// ============================================================

const ZAI_SHA: Record<EarthlyBranch, EarthlyBranch> = {
  '寅': '子', '午': '子', '戌': '子',
  '巳': '卯', '酉': '卯', '丑': '卯',
  '申': '午', '子': '午', '辰': '午',
  '亥': '酉', '卯': '酉', '未': '酉',
}

// ============================================================
// 22. 空亡（以日柱干支查地支对）
// ============================================================

const KONG_WANG_XUN: [HeavenlyStem[], EarthlyBranch[]][] = [
  [['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉']], // 甲子旬 → 戌亥空
  [['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], ['戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未']], // 甲戌旬 → 申酉空
  [['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳']], // 甲申旬 → 午未空
  [['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], ['午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯']], // 甲午旬 → 辰巳空
  [['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], ['辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']], // 甲辰旬 → 寅卯空
  [['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']], // 甲寅旬 → 子丑空
]

const KONG_WANG_RESULT: EarthlyBranch[][] = [
  ['戌', '亥'], ['申', '酉'], ['午', '未'], ['辰', '巳'], ['寅', '卯'], ['子', '丑'],
]

function getKongWang(dayStem: HeavenlyStem, dayBranch: EarthlyBranch): EarthlyBranch[] {
  const sIdx = HEAVENLY_STEMS.indexOf(dayStem)
  const bIdx = EARTHLY_BRANCHES.indexOf(dayBranch)
  for (let i = 0; i < KONG_WANG_XUN.length; i++) {
    const [stems, branches] = KONG_WANG_XUN[i]!
    const stemMatch = stems.indexOf(dayStem) >= 0
    const branchMatch = branches.indexOf(dayBranch) >= 0
    if (stemMatch && branchMatch) return KONG_WANG_RESULT[i]!
  }
  return []
}

// ============================================================
// 23. 羊刃（以日干查地支）
// ============================================================

const YANG_REN: Record<HeavenlyStem, EarthlyBranch> = {
  '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子',
  '乙': '辰', '丁': '未', '己': '未', '辛': '戌', '癸': '丑',
}

// ============================================================
// 24. 孤鸾煞（特定日柱）
// ============================================================

const GU_LUAN: string[] = [
  '乙巳', '丁巳', '辛亥', '戊申', '甲寅', '丙午', '戊午', '壬子',
]

// ============================================================
// 25. 四废日（以季节查）
// 春季(寅卯辰月)→庚申辛酉日；夏季(巳午未月)→壬子癸亥日
// 秋季(申酉戌月)→甲寅乙卯日；冬季(亥子丑月)→丙午丁巳日
// ============================================================

const SI_FEI_MAP: Record<EarthlyBranch, string[]> = {
  '寅': ['庚申', '辛酉'], '卯': ['庚申', '辛酉'], '辰': ['庚申', '辛酉'],
  '巳': ['壬子', '癸亥'], '午': ['壬子', '癸亥'], '未': ['壬子', '癸亥'],
  '申': ['甲寅', '乙卯'], '酉': ['甲寅', '乙卯'], '戌': ['甲寅', '乙卯'],
  '亥': ['丙午', '丁巳'], '子': ['丙午', '丁巳'], '丑': ['丙午', '丁巳'],
}

// ============================================================
// 26. 元辰/大耗（以年支+性别查）
// 阳年生男/阴年生女→冲前一位；阴年生男/阳年生女→冲后一位
// ============================================================

const CHONG_MAP: Record<EarthlyBranch, EarthlyBranch> = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
}

function getYuanChen(yearBranch: EarthlyBranch, yearStem: HeavenlyStem, gender: '男' | '女'): EarthlyBranch | null {
  const yangStems: HeavenlyStem[] = ['甲', '丙', '戊', '庚', '壬']
  const isYang = yangStems.includes(yearStem)
  const isYangMale = isYang && gender === '男'
  const isYinFemale = !isYang && gender === '女'

  const chongTarget = CHONG_MAP[yearBranch]!
  const cIdx = EARTHLY_BRANCHES.indexOf(chongTarget)

  if (isYangMale || isYinFemale) {
    // 冲前一位（顺时针前一位）
    return EARTHLY_BRANCHES[(cIdx + 11) % 12]!
  } else {
    // 冲后一位（逆时针后一位）
    return EARTHLY_BRANCHES[(cIdx + 1) % 12]!
  }
}

// ============================================================
// 三层次解读引擎
// ============================================================

/** 基础含义表 */
const BASE_DESC: Record<string, string> = {
  '天乙贵人': '天乙贵人入命，一生逢凶化吉，关键时刻总有贵人相助',
  '天德贵人': '天德贵人为月德之辅，心地仁慈，福泽深厚，能化解灾厄',
  '月德贵人': '月德贵人入命，性情温和，福气绵长，逢凶化吉之力仅次于天乙',
  '文昌贵人': '文昌入命，聪慧好学，文采出众，利学业考试',
  '桃花': '桃花入命，人缘好、有魅力，异性缘佳',
  '驿马': '马星入命，奔波走动多，宜外出发展，动中求财',
  '华盖': '华盖入命，聪明有才艺，与玄学、艺术、宗教有缘',
  '孤辰': '孤辰入命，性格偏内向独立，不善人际周旋',
  '寡宿': '寡宿入命，性格孤僻，社交圈窄，需主动经营人脉',
  '红艳煞': '红艳入命，相貌俊美，异性缘强',
  '阴差阳错': '阴差阳错日出生，婚姻多波折，夫妻沟通不畅，宜晚婚',
  '十恶大败': '十恶大败日出生，财运起伏大，不宜投机赌博，守财节俭为上',
  '福星贵人': '福星贵人入命，一生衣食无忧，福禄自足，不招凶祸',
  '天厨贵人': '天厨贵人入命，口福佳，饮食讲究，生活品质高',
  '禄神': '禄神入命，衣食丰足，得享现成之福',
  '金舆': '金舆贵人入命，有车马之福，出行便利，适合交通物流行业',
  '将星': '将星入命，有领导才能，意志坚定，适合管理岗位',
  '学堂': '学堂入命，学业天赋高，得师长喜爱，考试运佳',
  '词馆': '词馆入命，语言天赋佳，口才出众，宜从事文字或言语工作',
  '劫煞': '劫煞入命，易遭意外损失、小人是非，需防财物外借',
  '灾煞': '灾煞入命，易有病痛或意外之灾，需格外注意安全健康',
  '空亡': '空亡入命，对应领域易有虚浮不定、谋事难成之感',
  '元辰': '元辰/大耗入命，财运易耗散，需精打细算，不宜铺张',
  '羊刃': '羊刃入命，性格刚烈果断，但易冲动惹祸，需收敛锋芒',
  '孤鸾煞': '孤鸾煞入命，感情多波折，婚姻宫有克，宜晚婚或配命硬之人',
  '四废日': '四废日出生，对应季节能量不足，需后天加倍努力方能有成',
}

/** 柱位修正表 */
const PILLAR_FIX: Record<string, Record<string, string>> = {
  '天乙贵人': {
    '年支': '贵人在年，祖上或长辈中有助力之人',
    '月支': '贵人在月，平辈朋友或职场中易得助力',
    '日支': '贵人在日，配偶即是贵人，婚姻带来好运',
    '时支': '贵人在时，晚运亨通，子女或下属中有贵人',
  },
  '天德贵人': {
    '年支': '天德在年，祖德深厚，家族庇护力强',
    '月支': '天德在月，父母仁慈，成长环境优良',
    '日支': '天德在日，自身德行感召福报，婚姻和睦',
    '时支': '天德在时，晚年吉祥，子孙孝顺',
  },
  '月德贵人': {
    '年支': '月德在年，得长辈福荫，少运顺遂',
    '月支': '月德在月，事业有贵人扶持，同事关系融洽',
    '日支': '月德在日，自身福泽深厚，遇难呈祥',
    '时支': '月德在时，老年享福，后辈得力',
  },
  '文昌贵人': {
    '年支': '文昌在年，少年聪慧，读书时期出类拔萃',
    '月支': '文昌在月，青年时期学习动能强，考运佳',
    '日支': '文昌在日，终生好学，术业有专攻',
    '时支': '文昌在时，晚年仍保持学习热情，或子女学业出众',
  },
  '桃花': {
    '年支': '桃花在年，少年早熟，异性缘始于青春期',
    '月支': '桃花在月，青年时期异性缘最旺，恋爱机会多',
    '日支': '桃花在日，配偶相貌佳或有才艺，但需防婚姻中烂桃花',
    '时支': '桃花在时，晚年仍有感情生活，或子女异性缘强',
  },
  '驿马': {
    '年支': '马星在年，少年离家或求学远方',
    '月支': '马星在月，青年奔波，事业需常出差或变动',
    '日支': '马星在日，自身或配偶常奔波，婚姻聚少离多为况',
    '时支': '马星在时，晚年仍活跃，或子女远行他乡',
  },
  '华盖': {
    '年支': '华盖在年，少年孤高，不喜合群',
    '月支': '华盖在月，对神秘事物有浓厚兴趣',
    '日支': '华盖在日，自身偏内向孤傲，伴侣亦可能有孤僻倾向',
    '时支': '华盖在时，晚年潜心修行或艺术创作',
  },
  '孤辰': {
    '年支': '孤辰在年，少年孤独，不善交际', '月支': '孤辰在月，社交场合不自在',
    '日支': '孤辰在日，夫妻关系需多沟通以免冷暴力', '时支': '孤辰在时，晚年独居倾向',
  },
  '寡宿': {
    '年支': '寡宿在年，幼年情感需求易被忽视', '月支': '寡宿在月，人际关系被动',
    '日支': '寡宿在日，婚姻宜晚，早婚易生隔阂', '时支': '寡宿在时，老年需防孤独',
  },
  '红艳煞': {
    '年支': '红艳在年，少年早熟，容貌出众', '月支': '红艳在月，青年异性追逐者众',
    '日支': '红艳在日，配偶貌美，但需防感情是非', '时支': '红艳在时，晚年风韵犹存',
  },
  '禄神': {
    '年支': '禄神在年，祖业丰厚或少年得福', '月支': '禄神在月，事业稳定收入佳',
    '日支': '禄神在日，自身享福，配偶亦富足', '时支': '禄神在时，晚年衣食无忧',
  },
  '金舆': {
    '年支': '金舆在年，家世体面，出行讲究', '月支': '金舆在月，事业有机遇获得好车好房',
    '日支': '金舆在日，婚姻中物质条件好', '时支': '金舆在时，晚运安逸',
  },
  '将星': {
    '年支': '将星在年，少年领袖气质初显', '月支': '将星在月，职场有管理机遇',
    '日支': '将星在日，自身威权自带，配偶能干', '时支': '将星在时，晚年掌控力不减',
  },
  '学堂': {
    '年支': '学堂在年，幼时聪慧，读书基础扎实', '月支': '学堂在月，高考或大学阶段运势佳',
    '日支': '学堂在日，终身学习能力强', '时支': '学堂在时，可终身教育或培训他人',
  },
  '词馆': {
    '年支': '词馆在年，幼年口齿伶俐', '月支': '词馆在月，青年表达能力突出',
    '日支': '词馆在日，以口才或文笔立身', '时支': '词馆在时，晚年以言传身教影响后人',
  },
  '劫煞': {
    '年支': '劫煞在年，少运多变，家运有起伏', '月支': '劫煞在月，职场防小人',
    '日支': '劫煞在日，配偶关系需防外界干扰', '时支': '劫煞在时，晚年财务需稳健',
  },
  '灾煞': {
    '年支': '灾煞在年，青年时期需防意外', '月支': '灾煞在月，中年需注意健康和安全',
    '日支': '灾煞在日，自身或配偶易有病痛', '时支': '灾煞在时，晚年身体需格外养护',
  },
  '空亡': {
    '年支': '空亡在年，祖业根基有虚浮感', '月支': '空亡在月，事业发展易有空档期',
    '日支': '空亡在日，婚姻或自我认同有不确定感', '时支': '空亡在时，晚年计划多变难定',
  },
  '羊刃': {
    '年支': '羊刃在年，少年性格刚烈', '月支': '羊刃在月，职场竞争意识强',
    '日支': '羊刃在日，自身决断力强但易感情用事，配偶性格亦刚', '时支': '羊刃在时，晚年强势不减',
  },
  '元辰': {
    '年支': '大耗在年，早年家境或有不稳', '月支': '大耗在月，中年消费欲望强',
    '日支': '大耗在日，夫妻之间财务需透明', '时支': '大耗在时，晚年开销需规划',
  },
}

/** 五行/十神组合修正 */
function getElementFix(name: string, context: ShenShaContext): string {
  const { dayMaster, monthGod, favorableElements, unfavorableElements } = context
  const dmElem = STEM_ELEMENT[dayMaster]

  switch (name) {
    case '驿马':
      if (favorableElements.includes(dmElem)) return '马星带吉，动中求财，奔波反而有利可图'
      if (unfavorableElements.includes(dmElem)) return '马星带忌，劳碌奔波，宜静不宜动'
      return ''
    case '桃花':
      if (monthGod === '食神' || monthGod === '伤官') return '桃花+食伤，艺术魅力出众，品位不俗'
      if (monthGod === '比肩' || monthGod === '劫财') return '桃花+比劫，人缘好但情敌亦多，需注意感情竞争'
      if (favorableElements.includes('水')) return '桃花带水，情感滋润，异性多为贵人'
      return ''
    case '文昌贵人':
      if (favorableElements.includes(dmElem)) return '文昌为用，聪慧过人，学业考试如有神助'
      return ''
    case '华盖':
      if (unfavorableElements.includes('火') || unfavorableElements.includes('水')) return '华盖偏印特性加重，聪慧但偏孤僻，需主动社交'
      if (favorableElements.includes(dmElem)) return '华盖为用，才华横溢，在专业领域可成顶尖人物'
      return ''
    case '红艳煞':
      if (monthGod === '伤官') return '红艳+伤官，才貌双全但情路波折，需收敛锋芒'
      return ''
    case '羊刃':
      if (favorableElements.includes(dmElem)) return '羊刃驾杀为用，魄力非凡，适合进取型事业'
      if (unfavorableElements.includes(dmElem)) return '羊刃为忌，性格偏激冲动，需修身养性，防与人冲突'
      return ''
    case '劫煞':
      if (favorableElements.includes('金')) return '劫煞带金，虽有波折但反成磨砺，愈挫愈勇'
      return ''
    case '将星':
      if (favorableElements.includes(dmElem)) return '将星为用，领导才能得发挥，仕途或管理岗位有成'
      return ''
    case '空亡':
      if (favorableElements.includes(dmElem)) return '空亡为用，反主出世之才，宜学术、玄学、艺术领域'
      return ''
    case '禄神':
      if (unfavorableElements.includes(dmElem)) return '禄神为忌，安于现状反为束缚，需主动求变'
      return ''
    default:
      return ''
  }
}

/** 构建三层次神煞解读 */
function buildShenShaDesc(name: string, pillar: string, context: ShenShaContext): string {
  const base = BASE_DESC[name] || ''
  const pillarEntry = PILLAR_FIX[name]
  const posFix = pillarEntry?.[pillar] || ''
  const elemFix = getElementFix(name, context)
  const parts = [base, posFix, elemFix].filter(Boolean)
  return parts.join('；')
}

// ============================================================
// 神煞计算主函数
// ============================================================

interface ShenShaContext {
  dayMaster: HeavenlyStem
  monthGod: string
  favorableElements: string[]
  unfavorableElements: string[]
  gender?: '男' | '女'
}

export function calculateShenSha(
  dayStem: HeavenlyStem,
  yearStem: HeavenlyStem,
  yearBranch: EarthlyBranch,
  monthBranch: EarthlyBranch,
  dayBranch: EarthlyBranch,
  hourBranch: EarthlyBranch,
  dayGanZhi: string,
  context?: ShenShaContext,
): ShenShaResult {
  const all: ShenShaDetail[] = []
  const pillars = { 年支: yearBranch, 月支: monthBranch, 日支: dayBranch, 时支: hourBranch }
  const gender = context?.gender || '男'

  function addIf(name: string, type: ShenShaType, basedOn: string, label: string): void {
    const desc = context ? buildShenShaDesc(name, label, context) : BASE_DESC[name] || ''
    all.push({ name, type, basedOn, pillar: label, description: desc })
  }

  // === 吉神 ===

  // 1. 天乙贵人（日干查）
  const tianYiBranches = TIAN_YI[dayStem] || []
  for (const [label, branch] of Object.entries(pillars)) {
    if (tianYiBranches.includes(branch)) addIf('天乙贵人', '吉', `日干${dayStem}`, label)
  }

  // 2. 天德贵人（月支查天干，命局整体层面）
  const tianDeStem = TIAN_DE[monthBranch]
  if (tianDeStem) {
    // 天德是命局整体神煞，基于月令查看天干是否出现
    const desc = context ? buildShenShaDesc('天德贵人', '月支', context) : BASE_DESC['天德贵人'] || ''
    all.push({ name: '天德贵人', type: '吉', basedOn: `月支${monthBranch}→天干${tianDeStem}`, pillar: '全局', description: desc })
  }

  // 3. 月德贵人（月支查天干，命局整体层面）
  const yueDeStems = YUE_DE[monthBranch] || []
  if (yueDeStems.length > 0) {
    const desc = context ? buildShenShaDesc('月德贵人', '月支', context) : BASE_DESC['月德贵人'] || ''
    all.push({ name: '月德贵人', type: '吉', basedOn: `月支${monthBranch}`, pillar: '全局', description: desc })
  }

  // 4. 文昌贵人（日干查）
  const wenChangBranch = WEN_CHANG[dayStem]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === wenChangBranch) addIf('文昌贵人', '吉', `日干${dayStem}`, label)
  }

  // 5. 福星贵人（日干查）
  const fuXingBranches = FU_XING[dayStem] || []
  for (const [label, branch] of Object.entries(pillars)) {
    if (fuXingBranches.includes(branch)) addIf('福星贵人', '吉', `日干${dayStem}`, label)
  }

  // 6. 天厨贵人（日干查）
  const tianChuBranches = TIAN_CHU[dayStem] || []
  for (const [label, branch] of Object.entries(pillars)) {
    if (tianChuBranches.includes(branch)) addIf('天厨贵人', '吉', `日干${dayStem}`, label)
  }

  // 7. 禄神（日干查）
  const luShenBranch = LU_SHEN[dayStem]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === luShenBranch) addIf('禄神', '吉', `日干${dayStem}`, label)
  }

  // 8. 金舆（日干查）
  const jinYuBranch = JIN_YU[dayStem]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === jinYuBranch) addIf('金舆', '吉', `日干${dayStem}`, label)
  }

  // 9. 将星（日支查）
  const jiangXingBranch = JIANG_XING[dayBranch]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === jiangXingBranch) addIf('将星', '吉', `日支${dayBranch}`, label)
  }

  // 10. 学堂（日干查）
  const xueTangBranch = XUE_TANG[dayStem]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === xueTangBranch) addIf('学堂', '吉', `日干${dayStem}`, label)
  }

  // 11. 词馆（日干查）
  const ciGuanBranches = CI_GUAN[dayStem] || []
  for (const [label, branch] of Object.entries(pillars)) {
    if (ciGuanBranches.includes(branch)) addIf('词馆', '吉', `日干${dayStem}`, label)
  }

  // === 中性 ===

  // 12. 桃花（日支查）
  const taoHuaBranch = TAO_HUA_MAP[dayBranch]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === taoHuaBranch) addIf('桃花', '中性', `日支${dayBranch}`, label)
  }

  // 13. 驿马（年支查）
  const yiMaBranch = YI_MA_MAP[yearBranch]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === yiMaBranch) addIf('驿马', '中性', `年支${yearBranch}`, label)
  }

  // 14. 华盖（日支查）
  const huaGaiBranch = HUA_GAI_MAP[dayBranch]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === huaGaiBranch) addIf('华盖', '中性', `日支${dayBranch}`, label)
  }

  // 15. 红艳煞（日干查）
  const hongYanBranch = HONG_YAN[dayStem]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === hongYanBranch) addIf('红艳煞', '中性', `日干${dayStem}`, label)
  }

  // === 凶煞 ===

  // 16. 孤辰（年支查）
  const guChenBranch = GU_CHEN[yearBranch]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === guChenBranch) addIf('孤辰', '凶', `年支${yearBranch}`, label)
  }

  // 17. 寡宿（年支查）
  const guaSuBranch = GUA_SU[yearBranch]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === guaSuBranch) addIf('寡宿', '凶', `年支${yearBranch}`, label)
  }

  // 18. 阴差阳错日
  if (YIN_CHA_YANG_CUO.includes(dayGanZhi)) {
    addIf('阴差阳错', '凶', `日柱${dayGanZhi}`, '日柱')
  }

  // 19. 十恶大败日
  if (SHI_E_DA_BAI.includes(dayGanZhi)) {
    addIf('十恶大败', '凶', `日柱${dayGanZhi}`, '日柱')
  }

  // 20. 劫煞（年支查）
  const jieShaBranch = JIE_SHA[yearBranch]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === jieShaBranch) addIf('劫煞', '凶', `年支${yearBranch}`, label)
  }

  // 21. 灾煞（年支查）
  const zaiShaBranch = ZAI_SHA[yearBranch]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === zaiShaBranch) addIf('灾煞', '凶', `年支${yearBranch}`, label)
  }

  // 22. 空亡（日柱查）
  const kongWangBranches = getKongWang(dayStem, dayBranch)
  for (const [label, branch] of Object.entries(pillars)) {
    if (kongWangBranches.includes(branch)) addIf('空亡', '凶', `日柱${dayStem}${dayBranch}`, label)
  }

  // 23. 羊刃（日干查）
  const yangRenBranch = YANG_REN[dayStem]
  for (const [label, branch] of Object.entries(pillars)) {
    if (branch === yangRenBranch) addIf('羊刃', '凶', `日干${dayStem}`, label)
  }

  // 24. 元辰/大耗（年支+性别查）
  const yuanChenBranch = getYuanChen(yearBranch, yearStem, gender as '男' | '女')
  if (yuanChenBranch) {
    for (const [label, branch] of Object.entries(pillars)) {
      if (branch === yuanChenBranch) addIf('元辰', '凶', `年支${yearBranch}`, label)
    }
  }

  // 25. 孤鸾煞（日柱查）
  if (GU_LUAN.includes(dayGanZhi)) {
    addIf('孤鸾煞', '凶', `日柱${dayGanZhi}`, '日柱')
  }

  // 26. 四废日（月支查）
  const siFeiDays = SI_FEI_MAP[monthBranch] || []
  if (siFeiDays.includes(dayGanZhi)) {
    addIf('四废日', '凶', `月支${monthBranch}`, '日柱')
  }

  // 分组
  const byType = { '吉': [] as ShenShaDetail[], '凶': [] as ShenShaDetail[], '中性': [] as ShenShaDetail[] }
  for (const s of all) {
    byType[s.type].push(s)
  }

  // 重点提取
  const highlights: string[] = []
  const tianYis = all.filter(s => s.name === '天乙贵人')
  if (tianYis.length > 0) highlights.push(`${tianYis.length}重天乙贵人入命，得天独厚，遇难成祥`)
  const taoHuas = all.filter(s => s.name === '桃花')
  if (taoHuas.length >= 2) highlights.push('桃花多见，异性缘旺，需注意感情专一')
  if (all.some(s => s.name === '文昌贵人')) highlights.push('文昌入命，学业天赋出众')
  if (all.some(s => s.name === '学堂')) highlights.push('学堂入命，读书阶段运势佳，得师长喜爱')
  if (all.some(s => s.name === '词馆')) highlights.push('词馆入命，语言表达能力突出')
  if (all.some(s => s.name === '阴差阳错')) highlights.push('阴差阳错日出生，婚姻宜晚不宜早')
  if (all.some(s => s.name === '十恶大败')) highlights.push('十恶大败日出生，理财需格外谨慎')
  if (all.some(s => s.name === '华盖')) highlights.push('华盖入命，与玄学、宗教、艺术有深厚缘分')
  if (all.some(s => s.name === '将星')) highlights.push('将星入命，有统御之才，适合领导岗位')
  if (all.some(s => s.name === '禄神')) highlights.push('禄神入命，衣食丰足，得享现成之福')
  if (all.some(s => s.name === '羊刃')) highlights.push('羊刃入命，性情刚烈果断，但需防冲动惹祸')
  if (all.some(s => s.name === '孤鸾煞')) highlights.push('孤鸾煞入命，婚姻宫有克，感情需多经营')
  const guaCount = all.filter(s => s.name === '孤辰' || s.name === '寡宿').length
  if (guaCount > 0) highlights.push('孤辰寡宿入命，需主动经营人际关系')
  if (all.some(s => s.name === '驿马')) highlights.push('驿马星动，一生奔波，宜动中求发展')
  if (all.some(s => s.name === '劫煞')) highlights.push('劫煞入命，需防小人暗算和意外破财')
  if (all.some(s => s.name === '空亡')) highlights.push('空亡入命，对应领域易有虚浮不定之感')
  if (all.some(s => s.name === '福星贵人')) highlights.push('福星贵人入命，一生少有大灾大难')
  if (all.some(s => s.name === '天德贵人') || all.some(s => s.name === '月德贵人')) {
    highlights.push('天月二德护身，逢凶化吉之力强')
  }

  return { all, byType, highlights }
}
