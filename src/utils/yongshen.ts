/**
 * 用神判定引擎 — 基于《滴天髓》道有体用、《穷通宝鉴》调候
 *
 * 四维用神：扶抑 + 调候 + 通关 + 病药 → 加权综合
 * 特殊格局（从格/专旺格）：弃命从势，喜忌反常规，优先于四维
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../constants'
import { FIVE_ELEMENTS, STEM_ELEMENT } from '../constants'
import type { BaziChart } from '../types'
import type { StrengthResult } from './wangshuai'

/** 五行生克 */
function generates(a: FiveElement, b: FiveElement): boolean {
  return (a === '木' && b === '火') || (a === '火' && b === '土') ||
    (a === '土' && b === '金') || (a === '金' && b === '水') || (a === '水' && b === '木')
}
function controls(a: FiveElement, b: FiveElement): boolean {
  return (a === '金' && b === '木') || (a === '木' && b === '土') ||
    (a === '土' && b === '水') || (a === '水' && b === '火') || (a === '火' && b === '金')
}

// ============================================================
// 特殊格局用神 — 从格 / 专旺格（弃命从势，喜忌反常规）
// ============================================================

/** 从格的喜用神：顺其势 —— 用神 = 命局最旺之势（从财/从官杀/从儿），
 *  喜神 = 生助旺势者，忌神 = 生扶日主之比劫印（犯旺破格） */
export function getCongGeYongShen(
  specialGeJu: string,
  dayMaster: HeavenlyStem,
  dist: Record<FiveElement, number>,
): { favorable: FiveElement[]; unfavorable: FiveElement[] } | null {
  const dmElem = STEM_ELEMENT[dayMaster]

  // 专旺格（曲直/炎上/稼穑/从革/润下）：日主一方独旺，喜比劫印（顺其旺势），忌克泄耗
  const ZHUAN_WANG_NAMES = ['曲直格', '炎上格', '稼穑格', '从革格', '润下格']
  if (ZHUAN_WANG_NAMES.includes(specialGeJu)) {
    const helpful: FiveElement[] = [dmElem]
    const generator = FIVE_ELEMENTS.find(e => generates(e, dmElem))
    if (generator) helpful.push(generator)
    const unfavorable = FIVE_ELEMENTS.filter(e => !helpful.includes(e) && e !== dmElem)
    return { favorable: [...new Set(helpful)], unfavorable: [...new Set(unfavorable)] }
  }

  // 从格：日主弱极无依，从强旺之神
  if (specialGeJu.startsWith('从')) {
    // 找出最旺的五行作为所从之势
    const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1])
    const strongest = sorted[0]![0] as FiveElement
    if (strongest === dmElem) return null // 日主本身最旺，不成从格，回到常规

    // 从财格 / 从官杀格 / 从儿格：最旺者即用神
    const favorable = [strongest]
    // 喜神：生助最旺之势者（从财喜食伤，从官杀喜财，从儿喜食伤）
    const supporter = FIVE_ELEMENTS.find(e => generates(e, strongest))
    if (supporter && supporter !== dmElem) favorable.push(supporter)
    // 忌神：生扶弱极日主之比劫、印星（犯旺破格），及克制所从之势者（破格）
    const unfavorable = FIVE_ELEMENTS.filter(e => {
      if (e === dmElem) return true // 比劫
      if (generates(e, dmElem)) return true // 印星
      if (controls(e, strongest)) return true // 克所从之势（如从官杀格之食伤）
      return false
    })
    return { favorable: [...new Set(favorable)], unfavorable: [...new Set(unfavorable)] }
  }

  return null
}

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
    // 日主克最弱五行 → 日主泄气于它，生扶最弱五行可通关调和（如财多身弱补财源之根）
    const dmControlsMin = controlsMap[dmElem] === minElem

    if (isStrong && minGeneratesDm) {
      // 身强+最弱五行生身 → 不添加（会助长日主过旺）
      // e.g., 甲木身强+水枯→水生木，加水会助长木的过旺
    } else if (isWeak && minGeneratesDm) {
      // 身弱+最弱五行生日主 → 最弱已帮身有限，且弱印被克泄，生扶意义不大；且会为日主招克
      // 不添加
    } else if (dmControlsMin && isWeak) {
      // 身弱+日主克最弱五行 → 财星太弱而身不胜财，生扶财星反助日主耗泄；
      // 但财弱本身非日主之患，此处不加
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
 *
 * 特殊格局（从格/专旺格）：弃命从势，喜忌反常规，直接采用特殊取法，跳过四维
 */
export function determineYongShen(
  bazi: BaziChart,
  strength: StrengthResult,
  fiveElementDist: Record<FiveElement, number>,
  specialGeJu?: string,
): YongShenResult {
  const dm = bazi.dayMaster
  const monthBranch = bazi.month.branch
  const dmElem = STEM_ELEMENT[dm]

  // === 特殊格局优先：从格 / 专旺格 ===
  const ZHUAN_WANG_NAMES = ['曲直格', '炎上格', '稼穑格', '从革格', '润下格']
  if (specialGeJu && (specialGeJu.startsWith('从') || ZHUAN_WANG_NAMES.includes(specialGeJu))) {
    const special = getCongGeYongShen(specialGeJu, dm, fiveElementDist)
    if (special) {
      const commentary = [
        `特殊格局「${specialGeJu}」：弃命从势，喜忌反常规`,
        `喜用神（顺其势）：${special.favorable.join('、')}`,
        `忌神（犯旺破格）：${special.unfavorable.join('、')}`,
      ]
      return {
        favorable: special.favorable,
        unfavorable: special.unfavorable,
        tiaoHou: [],
        tiaoHouStems: [],
        tongGuan: [],
        bingYao: [],
        fuYi: [],
        scores: [],
        commentary,
      }
    }
  }

  // 四种用神分别计算
  const fuYi = getFuYiYongShen(strength.strength, dm)
  const { stems: tiaoHouStems, elements: tiaoHou } = getTiaoHouYongShen(dm, monthBranch)
  let tongGuan = getTongGuanYongShen(bazi)
  const bingYao = getBingYaoYongShen(fiveElementDist, dm, strength.strength)

  // === 冲突消解 ===

  // 找出命局中最旺的五行
  const sortedDist = Object.entries(fiveElementDist).sort((a, b) => b[1] - a[1])
  const strongestElem = sortedDist[0]![0] as FiveElement
  const dmIsStrongest = strongestElem === dmElem

  // 判断最旺五行是否为忌神（非日主五行，且克/耗日主；相生者不算忌神）
  const strongestIsBad = !dmIsStrongest &&
    (controls(strongestElem, dmElem) || (generates(dmElem, strongestElem) && strength.strength !== '身强' && strength.strength !== '身偏旺'))

  // 冲突消解1：排除会生助忌神的通关用神
  if (strongestIsBad) {
    tongGuan = tongGuan.filter(tg => !generates(tg, strongestElem))
  }

  // 冲突消解2：若扶抑输出全部五行（无意义），仅保留前2个
  let filteredFuYi = fuYi
  if (fuYi.length >= 4) {
    filteredFuYi = fuYi.slice(0, 2)
  }

  // 加权计算（调候为急：调候权重最高，极端寒暖燥湿时保底入喜用）
  const scores: YongShenScore[] = FIVE_ELEMENTS.map(elem => {
    const fy = filteredFuYi.includes(elem) ? 20 : 0
    const th = tiaoHou.includes(elem) ? 35 : 0
    const tg = tongGuan.includes(elem) ? 15 : 0
    const by = bingYao.includes(elem) ? 30 : 0
    return { element: elem, fuYi: fy, tiaoHou: th, tongGuan: tg, bingYao: by, total: fy + th + tg + by }
  })

  // 排序取前2-3个为喜用神，后2-3个为忌神
  scores.sort((a, b) => b.total - a.total)
  const favorable = scores.slice(0, 2).filter(s => s.total > 0).map(s => s.element)

  // 调候保底：极端寒暖（三冬/三夏，且对应调候元素在命局中偏弱）时，
  // 调候用神必须保留在喜用中（《穷通宝鉴》"调候为急"）
  const coldMonths: EarthlyBranch[] = ['亥', '子', '丑']
  const hotMonths: EarthlyBranch[] = ['巳', '午', '未']
  const extremeClimate =
    (coldMonths.includes(monthBranch) && fiveElementDist['火'] < 3) ||
    (hotMonths.includes(monthBranch) && fiveElementDist['水'] < 3)
  if (extremeClimate && tiaoHou.length > 0) {
    for (const th of tiaoHou) {
      if (!favorable.includes(th)) favorable.push(th)
    }
    // 喜用至多3个
    if (favorable.length > 3) favorable.length = 3
  }

  // 忌神 = 非喜用且得分最低的
  const unfavorable = scores.filter(s => !favorable.includes(s.element)).slice(-2).map(s => s.element)

  const climateNote = extremeClimate
    ? `调候保底：${coldMonths.includes(monthBranch) ? '三冬寒局' : '三夏燥局'}，${tiaoHou.join('、')}为调候之必需，强制保留为喜用`
    : ''

  const commentary = [
    `扶抑用神（身${strength.strength}）：${filteredFuYi.join('、')}${fuYi.length !== filteredFuYi.length ? `（原为${fuYi.join('、')}，经消解精简）` : ''}`,
    `调候用神（${dm}生${monthBranch}月）：${tiaoHou.join('、')}（天干：${tiaoHouStems.join('、')}）`,
    `通关用神：${tongGuan.length > 0 ? tongGuan.join('、') : '命局无明显相战或通关用神已消解'}`,
    `病药用神：${bingYao.length > 0 ? bingYao.join('、') : '命局五行无明显偏枯'}`,
    strongestIsBad ? `冲突消解：${strongestElem}为命局最旺忌神，排除生助${strongestElem}的用神` : '',
    climateNote,
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
