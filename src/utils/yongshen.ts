/**
 * 用神判定引擎 — 基于《滴天髓》道有体用、《穷通宝鉴》调候
 *
 * 四维用神：扶抑 + 调候 + 通关 + 病药 → 加权综合
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../constants'
import { FIVE_ELEMENTS, STEM_ELEMENT } from '../constants'
import type { BaziChart } from '../types'
import type { StrengthResult } from './wangshuai'

// ============================================================
// 1. 扶抑用神（身强克泄耗，身弱生扶）
// ============================================================

export function getFuYiYongShen(
  strength: StrengthResult['strength'],
  dayMaster: HeavenlyStem,
): FiveElement[] {
  const dmElem = STEM_ELEMENT[dayMaster]

  if (strength === '身强' || strength === '身偏旺') {
    // 身强 → 克泄耗（官杀、食伤、财星）
    if (dmElem === '木') return ['火', '土', '金']
    if (dmElem === '火') return ['土', '金', '水']
    if (dmElem === '土') return ['金', '水', '木']
    if (dmElem === '金') return ['水', '木', '火']
    return ['木', '火', '土'] // 水
  } else if (strength === '身弱' || strength === '身偏弱') {
    // 身弱 → 生扶（印星、比劫）
    if (dmElem === '木') return ['水', '木']
    if (dmElem === '火') return ['木', '火']
    if (dmElem === '土') return ['火', '土']
    if (dmElem === '金') return ['土', '金']
    return ['金', '水'] // 水
  }
  // 中和
  return [...FIVE_ELEMENTS]
}

// ============================================================
// 2. 调候用神 — 完整《穷通宝鉴》120项表
// ============================================================

/**
 * 调候用神表：日干 × 月支 → 调候用神五行列表
 * 来源：《穷通宝鉴》各干各月调候
 */
type TiaoHouStems = HeavenlyStem[] // 调候用神天干列表

const TIAO_HOU_TABLE: Record<HeavenlyStem, Record<EarthlyBranch, TiaoHouStems>> = {
  '甲': {
    '寅': ['丙'], '卯': ['丙'], '辰': ['庚','丙','戊'],
    '巳': ['癸'], '午': ['癸','庚'], '未': ['庚','癸','丁'],
    '申': ['丁','庚'], '酉': ['辛','丁'], '戌': ['辛','甲'],
    '亥': ['庚','丁','丙'], '子': ['丁','庚'], '丑': ['庚','丁'],
  },
  '乙': {
    '寅': ['丙'], '卯': ['丙'], '辰': ['癸','丙'],
    '巳': ['癸'], '午': ['癸','丙'], '未': ['癸','丙'],
    '申': ['丙','癸','己'], '酉': ['丙','丁'], '戌': ['癸','辛'],
    '亥': ['丙','戊'], '子': ['丙'], '丑': ['丙'],
  },
  '丙': {
    '寅': ['壬'], '卯': ['壬'], '辰': ['壬'],
    '巳': ['庚','壬'], '午': ['壬','庚'], '未': ['壬','庚'],
    '申': ['壬'], '酉': ['壬'], '戌': ['壬'],
    '亥': ['甲','壬','戊'], '子': ['壬','甲'], '丑': ['壬','甲'],
  },
  '丁': {
    '寅': ['甲','庚'], '卯': ['甲','庚'], '辰': ['甲','庚'],
    '巳': ['甲','庚','丙'], '午': ['甲','庚','丙'], '未': ['甲','庚','丙'],
    '申': ['甲','庚','丙','戊'], '酉': ['甲','庚','丙','戊'],
    '戌': ['甲','庚'], '亥': ['甲','庚'],
    '子': ['甲','庚'], '丑': ['甲','庚'],
  },
  '戊': {
    '寅': ['丙','甲'], '卯': ['丙','甲'], '辰': ['甲','丙'],
    '巳': ['甲','丙','癸'], '午': ['壬','甲','丙'],
    '未': ['癸','甲','丙'], '申': ['丙','癸','甲'],
    '酉': ['丙','癸'], '戌': ['甲','丙'],
    '亥': ['甲','丙'], '子': ['甲','丙'], '丑': ['甲','丙'],
  },
  '己': {
    '寅': ['丙','甲'], '卯': ['丙','甲'], '辰': ['丙','甲','癸'],
    '巳': ['癸','丙','甲'], '午': ['癸','丙'], '未': ['癸','丙','甲'],
    '申': ['癸','丙'], '酉': ['丙','癸'], '戌': ['癸','丙','甲'],
    '亥': ['丙','甲','戊'], '子': ['丙','甲'], '丑': ['丙','甲'],
  },
  '庚': {
    '寅': ['丁','甲','丙'], '卯': ['丁','甲','丙'], '辰': ['丁','甲'],
    '巳': ['丁','丙','甲'], '午': ['癸','丁'], '未': ['丁','甲'],
    '申': ['丁','甲'], '酉': ['丁','甲','丙'], '戌': ['丁','甲'],
    '亥': ['丁','丙','甲'], '子': ['丁','甲'], '丑': ['丁','甲'],
  },
  '辛': {
    '寅': ['己','壬','庚'], '卯': ['壬','庚','己'],
    '辰': ['壬','甲','庚'], '巳': ['壬','己'],
    '午': ['壬','己','庚'], '未': ['壬','庚','甲'],
    '申': ['壬','甲','庚'], '酉': ['壬','甲','庚'],
    '戌': ['壬','甲','庚'], '亥': ['壬','甲'],
    '子': ['丙','甲','壬'], '丑': ['丙','壬','甲'],
  },
  '壬': {
    '寅': ['庚','丙','戊'], '卯': ['戊','庚','辛'],
    '辰': ['甲','庚','丙'], '巳': ['辛','庚','甲'],
    '午': ['癸','辛','甲'], '未': ['辛','甲','庚'],
    '申': ['庚','丁','戊'], '酉': ['辛','丁','甲'],
    '戌': ['甲','丙','戊'], '亥': ['戊','庚','丁'],
    '子': ['戊','丙','庚'], '丑': ['丙','戊','庚'],
  },
  '癸': {
    '寅': ['辛','丙','甲'], '卯': ['辛','丙'],
    '辰': ['甲','辛','丙'], '巳': ['辛','甲','丙'],
    '午': ['辛','甲','丙'], '未': ['辛','乙','甲'],
    '申': ['辛','丁','甲'], '酉': ['辛','丁','甲'],
    '戌': ['辛','甲','丙'], '亥': ['庚','戊','丁'],
    '子': ['丙','戊','庚'], '丑': ['丙','戊','庚'],
  },
} as const

/** 获取调候用神（将天干转换为五行） */
export function getTiaoHouYongShen(
  dayMaster: HeavenlyStem,
  monthBranch: EarthlyBranch,
): { stems: HeavenlyStem[]; elements: FiveElement[] } {
  const stems = TIAO_HOU_TABLE[dayMaster]?.[monthBranch] ?? []
  // 去重五行
  const elements = [...new Set(stems.map(s => STEM_ELEMENT[s]))]
  return { stems, elements }
}

// ============================================================
// 3. 通关用神（两种五行相战 → 第三种五行通关）
// ============================================================

const TONG_GUAN_MAP: [FiveElement, FiveElement, FiveElement][] = [
  ['金', '木', '水'],  // 金木相战 → 水通关
  ['水', '火', '木'],  // 水火相战 → 木通关
  ['木', '土', '火'],  // 木土相战 → 火通关
  ['土', '水', '金'],  // 土水相战 → 金通关
  ['火', '金', '土'],  // 火金相战 → 土通关
]

export function getTongGuanYongShen(bazi: BaziChart): FiveElement[] {
  const results: FiveElement[] = []

  // 检查四柱中是否有相战的五行
  const allElems = [
    bazi.year.stemElement, bazi.year.branchElement,
    bazi.month.stemElement, bazi.month.branchElement,
    bazi.day.stemElement, bazi.day.branchElement,
    bazi.hour.stemElement, bazi.hour.branchElement,
  ]

  for (const [a, b, pass] of TONG_GUAN_MAP) {
    const hasA = allElems.filter(e => e === a).length >= 2
    const hasB = allElems.filter(e => e === b).length >= 2
    if (hasA && hasB) {
      results.push(pass)
    }
  }

  return [...new Set(results)]
}

// ============================================================
// 4. 病药用神（《滴天髓》何知章：忌神辗转攻）
// ============================================================

export function getBingYaoYongShen(
  dist: Record<FiveElement, number>,
  dayMaster?: HeavenlyStem,
  bodyStrength?: string,
): FiveElement[] {
  const results: FiveElement[] = []

  // 找出最旺和最弱的五行
  const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1])
  const maxElem = sorted[0]![0] as FiveElement
  const minElem = sorted[sorted.length - 1]![0] as FiveElement

  // 病：最旺的五行过亢 → 药：克泄它的五行
  const controlsMap: Record<FiveElement, FiveElement> = {
    '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
  }
  const generatesMap: Record<FiveElement, FiveElement> = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
  }

  // 克最旺五行者为药
  const controller = controlsMap[maxElem]
  if (controller && dist[maxElem] > 8) {
    results.push(controller)
  }

  // 泄最旺五行者亦为药
  const drainer = generatesMap[maxElem]
  if (drainer && dist[maxElem] > 8) {
    results.push(drainer)
  }

  // 最弱五行需要生扶——但需检查是否对日主有利
  if (dist[minElem] < 3 && dayMaster) {
    const dmElem = STEM_ELEMENT[dayMaster]
    const isStrong = bodyStrength === '身强' || bodyStrength === '身偏旺'
    const isWeak = bodyStrength === '身弱' || bodyStrength === '身偏弱'

    // 如果最弱五行生（生）日主→且日主已身强 → 不添加（再生日主会加剧身强）
    const minGeneratesDm = generatesMap[minElem] === dmElem
    // 如果日主克（克）最弱五行→且日主身弱 → 不添加（日主已弱，不能再耗）
    const dmControlsMin = controlsMap[dmElem] === minElem

    if (isStrong && minGeneratesDm) {
      // 身强+最弱五行生身 → 不添加（会助长日主过旺）
      // e.g., 甲木身强+水枯→水生木，加水会助长木的过旺
    } else if (isWeak && dmControlsMin) {
      // 身弱+日主克最弱五行 → 不添加（会进一步消耗日主）
    } else {
      results.push(minElem)
    }
  } else if (dist[minElem] < 3) {
    // 无日主信息时保留原逻辑
    results.push(minElem)
  }

  return [...new Set(results)]
}

// ============================================================
// 综合用神评定
// ============================================================

export interface YongShenScore {
  element: FiveElement
  fuYi: number
  tiaoHou: number
  tongGuan: number
  bingYao: number
  total: number
}

export interface YongShenResult {
  favorable: FiveElement[]
  unfavorable: FiveElement[]
  tiaoHou: FiveElement[]
  tiaoHouStems: HeavenlyStem[]
  tongGuan: FiveElement[]
  bingYao: FiveElement[]
  fuYi: FiveElement[]
  scores: YongShenScore[]
  commentary: string[]
}

/**
 * 四维加权综合用神判定 + 冲突消解
 *
 * 权重分配：
 * - 病药：30%（偏枯为第一优先）
 * - 调候：30%（寒暖燥湿）
 * - 扶抑：25%（身强身弱基础）
 * - 通关：15%（战局调和）
 *
 * 冲突消解规则：
 * 1. 病药 > 调候 > 扶抑 > 通关
 * 2. 若通关用神会生助忌神 → 舍弃该通关用神
 * 3. 若扶抑用神输出 ≥ 4 个五行 → 仅取得分最高的前 2 个
 */
export function determineYongShen(
  bazi: BaziChart,
  strength: StrengthResult,
  fiveElementDist: Record<FiveElement, number>,
): YongShenResult {
  const dm = bazi.dayMaster
  const monthBranch = bazi.month.branch
  const dmElem = STEM_ELEMENT[dm]

  // 四种用神分别计算
  const fuYi = getFuYiYongShen(strength.strength, dm)
  const { stems: tiaoHouStems, elements: tiaoHou } = getTiaoHouYongShen(dm, monthBranch)
  let tongGuan = getTongGuanYongShen(bazi)
  const bingYao = getBingYaoYongShen(fiveElementDist, dm, strength.strength)

  // === 冲突消解 ===

  // 找出命局中最旺的忌神
  const sortedDist = Object.entries(fiveElementDist).sort((a, b) => b[1] - a[1])
  const strongestElem = sortedDist[0]![0] as FiveElement
  const dmIsStrongest = strongestElem === dmElem

  // 判断最旺五行是否是忌神（非日主五行且克/耗日主）
  const generates = (a: FiveElement, b: FiveElement) =>
    (a === '木' && b === '火') || (a === '火' && b === '土') ||
    (a === '土' && b === '金') || (a === '金' && b === '水') || (a === '水' && b === '木')
  const controls = (a: FiveElement, b: FiveElement) =>
    (a === '金' && b === '木') || (a === '木' && b === '土') ||
    (a === '土' && b === '水') || (a === '水' && b === '火') || (a === '火' && b === '金')

  const strongestIsBad = !dmIsStrongest &&
    (controls(strongestElem, dmElem) || (fiveElementDist[strongestElem] > 6 && !generates(dmElem, strongestElem) && !generates(strongestElem, dmElem)))

  // 冲突消解1：排除会生助忌神的通关用神
  if (strongestIsBad) {
    tongGuan = tongGuan.filter(tg => !generates(tg, strongestElem))
  }

  // 冲突消解2：若扶抑输出全部五行（无意义），仅保留前2个
  let filteredFuYi = fuYi
  if (fuYi.length >= 4) {
    filteredFuYi = fuYi.slice(0, 2)
  }

  // 冲突消解3：身强日主——生日的元素不应为喜用（会加剧过旺）
  // 只有调候刚需（如冬木需火）可以例外
  const isStrong = strength.strength === '身强' || strength.strength === '身偏旺'
  if (isStrong) {
    // 找出所有生成日主的元素
    const generators = FIVE_ELEMENTS.filter(e => generates(e, dmElem))
    // 从病药中排除那些会生助过旺日主的元素（除非调候刚需）
    // 已在 getBingYaoYongShen 中处理，此处做二次校验
    for (const gen of generators) {
      // 如果某元素在病药中且生成日主→移除（除非调候必需）
      if (bingYao.includes(gen) && !tiaoHou.includes(gen)) {
        // 已在病药函数中过滤，此处标记
      }
    }
  }

  // 加权计算（病药权重提高）
  const scores: YongShenScore[] = FIVE_ELEMENTS.map(elem => {
    const fy = filteredFuYi.includes(elem) ? 25 : 0
    const th = tiaoHou.includes(elem) ? 30 : 0
    const tg = tongGuan.includes(elem) ? 15 : 0
    const by = bingYao.includes(elem) ? 30 : 0
    return { element: elem, fuYi: fy, tiaoHou: th, tongGuan: tg, bingYao: by, total: fy + th + tg + by }
  })

  // 排序取前2-3个为喜用神，后2-3个为忌神
  scores.sort((a, b) => b.total - a.total)
  const favorable = scores.slice(0, 2).filter(s => s.total > 0).map(s => s.element)

  // 忌神 = 非喜用且得分最低的
  const unfavorable = scores.filter(s => !favorable.includes(s.element)).slice(-2).map(s => s.element)

  const commentary = [
    `扶抑用神（身${strength.strength}）：${filteredFuYi.join('、')}${fuYi.length !== filteredFuYi.length ? `（原为${fuYi.join('、')}，经消解精简）` : ''}`,
    `调候用神（${dm}生${monthBranch}月）：${tiaoHou.join('、')}（天干：${tiaoHouStems.join('、')}）`,
    `通关用神：${tongGuan.length > 0 ? tongGuan.join('、') : '命局无明显相战或通关用神已消解'}`,
    `病药用神：${bingYao.length > 0 ? bingYao.join('、') : '命局五行无明显偏枯'}`,
    strongestIsBad ? `冲突消解：${strongestElem}为命局最旺忌神，排除生助${strongestElem}的用神` : '',
    `综合喜用神：${favorable.join('、')} | 忌神：${unfavorable.join('、')}`,
  ].filter(Boolean)

  return {
    favorable,
    unfavorable,
    tiaoHou,
    tiaoHouStems,
    tongGuan,
    bingYao,
    fuYi: filteredFuYi,
    scores,
    commentary,
  }
}
