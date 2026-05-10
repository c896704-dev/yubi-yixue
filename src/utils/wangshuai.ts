/**
 * 旺衰判定引擎 — 基于《滴天髓》旺衰真机
 *
 * 多维度旺衰判断：
 * 1. 月令旺相休囚死（《滴天髓》原文）
 * 2. 地支根气深浅（禄刃根、长生根、本气中气余气根）
 * 3. 天干生助
 * 4. 三围生克（月干、日支、时干）
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../constants'
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, STEM_ELEMENT, FIVE_ELEMENTS } from '../constants'
import type { BaziChart, Pillar } from '../types'

// ============================================================
// 十二长生表 — 天干在地支的十二宫状态
// ============================================================

type ShiErGong = '长生' | '沐浴' | '冠带' | '临官' | '帝旺' | '衰' | '病' | '死' | '墓' | '绝' | '胎' | '养'

const SHI_ER_CHANG_SHENG: Record<HeavenlyStem, Record<EarthlyBranch, ShiErGong>> = {
  '甲': { '亥':'长生','子':'沐浴','丑':'冠带','寅':'临官','卯':'帝旺','辰':'衰','巳':'病','午':'死','未':'墓','申':'绝','酉':'胎','戌':'养' },
  '乙': { '午':'长生','巳':'沐浴','辰':'冠带','卯':'临官','寅':'帝旺','丑':'衰','子':'病','亥':'死','戌':'墓','酉':'绝','申':'胎','未':'养' },
  '丙': { '寅':'长生','卯':'沐浴','辰':'冠带','巳':'临官','午':'帝旺','未':'衰','申':'病','酉':'死','戌':'墓','亥':'绝','子':'胎','丑':'养' },
  '丁': { '酉':'长生','申':'沐浴','未':'冠带','午':'临官','巳':'帝旺','辰':'衰','卯':'病','寅':'死','丑':'墓','子':'绝','亥':'胎','戌':'养' },
  '戊': { '寅':'长生','卯':'沐浴','辰':'冠带','巳':'临官','午':'帝旺','未':'衰','申':'病','酉':'死','戌':'墓','亥':'绝','子':'胎','丑':'养' },
  '己': { '酉':'长生','申':'沐浴','未':'冠带','午':'临官','巳':'帝旺','辰':'衰','卯':'病','寅':'死','丑':'墓','子':'绝','亥':'胎','戌':'养' },
  '庚': { '巳':'长生','午':'沐浴','未':'冠带','申':'临官','酉':'帝旺','戌':'衰','亥':'病','子':'死','丑':'墓','寅':'绝','卯':'胎','辰':'养' },
  '辛': { '子':'长生','亥':'沐浴','戌':'冠带','酉':'临官','申':'帝旺','未':'衰','午':'病','巳':'死','辰':'墓','卯':'绝','寅':'胎','丑':'养' },
  '壬': { '申':'长生','酉':'沐浴','戌':'冠带','亥':'临官','子':'帝旺','丑':'衰','寅':'病','卯':'死','辰':'墓','巳':'绝','午':'胎','未':'养' },
  '癸': { '卯':'长生','寅':'沐浴','丑':'冠带','子':'临官','亥':'帝旺','戌':'衰','酉':'病','申':'死','未':'墓','午':'绝','巳':'胎','辰':'养' },
}

/** 天干十二长生宫位分值 */
const GONG_SCORE: Record<ShiErGong, number> = {
  '长生': 2, '沐浴': 0.5, '冠带': 1, '临官': 3, '帝旺': 4,
  '衰': -0.5, '病': -1.5, '死': -3, '墓': 1.5, '绝': -2,
  '胎': 0, '养': 0.5,
}

// ============================================================
// 月令旺相休囚死（《滴天髓》原文）
// ============================================================

/**
 * 旺相休囚死规则：
 * 当令者旺，我生者相，生我者休，克我者囚，我克者死
 *
 * 春季：木旺、火相、水休、金囚、土死
 * 夏季：火旺、土相、木休、水囚、金死
 * 秋季：金旺、水相、土休、火囚、木死
 * 冬季：水旺、木相、金休、土囚、火死
 * 季末（辰未戌丑）：土旺、金相、火休、木囚、水死
 */

const MONTH_ELEMENT_MAP: Record<EarthlyBranch, FiveElement> = {
  '寅': '木', '卯': '木', '辰': '土',
  '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土',
  '亥': '水', '子': '水', '丑': '土',
}

type WangXiang = '旺' | '相' | '休' | '囚' | '死'

const WANG_XIANG_SCORE: Record<WangXiang, number> = {
  '旺': 6, '相': 4, '休': 1, '囚': -4, '死': -6,
}

/** 判断某五行在月令的旺相休囚死 */
export function getWangXiang(element: FiveElement, monthBranch: EarthlyBranch): WangXiang {
  const monthElem = MONTH_ELEMENT_MAP[monthBranch]

  // 当令者旺
  if (element === monthElem) return '旺'

  // 我生者相
  const generates = (a: FiveElement, b: FiveElement) =>
    (a === '木' && b === '火') || (a === '火' && b === '土') ||
    (a === '土' && b === '金') || (a === '金' && b === '水') || (a === '水' && b === '木')
  if (generates(monthElem, element)) return '相'

  // 生我者休
  if (generates(element, monthElem)) return '休'

  // 克我者囚
  const controls = (a: FiveElement, b: FiveElement) =>
    (a === '木' && b === '土') || (a === '土' && b === '水') ||
    (a === '水' && b === '火') || (a === '火' && b === '金') || (a === '金' && b === '木')
  if (controls(element, monthElem)) return '囚'

  // 我克者死
  return '死'
}

// ============================================================
// 地支根气计算（《滴天髓》旺衰篇）
// ============================================================

interface RootDetail {
  pillar: string
  branch: EarthlyBranch
  hiddenStems: string[]
  rootType: string
  score: number
}

/** 计算日主天干在地支的根气总分 */
export function getRootScore(dayMaster: HeavenlyStem, pillars: Pillar[]): { total: number; details: RootDetail[] } {
  const details: RootDetail[] = []
  let total = 0

  const pillarLabel = ['年柱', '月柱', '日柱', '时柱']
  const pillarsArr = [pillars[0]!, pillars[1]!, pillars[2]!, pillars[3]!]

  for (let i = 0; i < pillarsArr.length; i++) {
    const p = pillarsArr[i]!
    const branch = p.branch
    const hidden = p.hiddenStems

    // 1. 本气根：藏干主气（第一藏干）与日主相同
    if (hidden[0] === dayMaster) {
      details.push({ pillar: pillarLabel[i]!, branch, hiddenStems: hidden, rootType: '本气根', score: 3 })
      total += 3
      continue
    }

    // 2. 中气根
    if (hidden[1] === dayMaster) {
      details.push({ pillar: pillarLabel[i]!, branch, hiddenStems: hidden, rootType: '中气根', score: 1 })
      total += 1
      continue
    }

    // 3. 余气根
    if (hidden[2] === dayMaster) {
      details.push({ pillar: pillarLabel[i]!, branch, hiddenStems: hidden, rootType: '余气根', score: 0.5 })
      total += 0.5
      continue
    }

    // 4. 禄刃根：地支为日主之临官（禄）或帝旺（刃）
    const gong = SHI_ER_CHANG_SHENG[dayMaster][branch]
    if (gong === '临官') {
      details.push({ pillar: pillarLabel[i]!, branch, hiddenStems: hidden, rootType: '禄根（临官）', score: 4 })
      total += 4
    } else if (gong === '帝旺') {
      details.push({ pillar: pillarLabel[i]!, branch, hiddenStems: hidden, rootType: '刃根（帝旺）', score: 4 })
      total += 4
    } else if (gong === '长生') {
      details.push({ pillar: pillarLabel[i]!, branch, hiddenStems: hidden, rootType: '长生根', score: 2 })
      total += 2
    }
    // 墓库根
    else if (gong === '墓') {
      details.push({ pillar: pillarLabel[i]!, branch, hiddenStems: hidden, rootType: '墓库根', score: 1.5 })
      total += 1.5
    }
  }

  return { total, details }
}

// ============================================================
// 天干生助计算
// ============================================================

/** 计算天干中比劫印星对日主的生助力量 */
export function getHelpScore(dayMaster: HeavenlyStem, pillars: Pillar[]): number {
  let score = 0
  const otherPillars = [pillars[0]!, pillars[1]!, pillars[3]!] // 年、月、时

  for (const p of otherPillars) {
    const god = p.tenGod
    if (god === '比肩') score += 2
    else if (god === '劫财') score += 2
    else if (god === '正印') score += 1.5
    else if (god === '偏印') score += 1
  }

  return score
}

// ============================================================
// 三围生克计算（《滴天髓》旺衰篇）
// ============================================================

/** 日主周围三柱（月干、日支、时干）对日主的影响 */
export function getSurroundScore(dayMaster: HeavenlyStem, pillars: Pillar[]): number {
  let score = 0
  const dmElem = STEM_ELEMENT[dayMaster]

  // 月干：直接影响最大的位置
  const monthStemElem = pillars[1]!.stemElement
  if (monthStemElem === dmElem) score += 2 // 同五行
  else {
    // 生我
    if (
      (monthStemElem === '木' && dmElem === '火') || (monthStemElem === '火' && dmElem === '土') ||
      (monthStemElem === '土' && dmElem === '金') || (monthStemElem === '金' && dmElem === '水') ||
      (monthStemElem === '水' && dmElem === '木')
    ) score += 1.5
    // 克我
    else if (
      (monthStemElem === '金' && dmElem === '木') || (monthStemElem === '木' && dmElem === '土') ||
      (monthStemElem === '土' && dmElem === '水') || (monthStemElem === '水' && dmElem === '火') ||
      (monthStemElem === '火' && dmElem === '金')
    ) score -= 1.5
  }

  // 日支：内心根基
  const dayBranchElem = pillars[2]!.branchElement
  if (dayBranchElem === dmElem) score += 3
  else {
    const generates = (a: FiveElement, b: FiveElement) =>
      (a === '木' && b === '火') || (a === '火' && b === '土') ||
      (a === '土' && b === '金') || (a === '金' && b === '水') || (a === '水' && b === '木')
    const controls = (a: FiveElement, b: FiveElement) =>
      (a === '金' && b === '木') || (a === '木' && b === '土') ||
      (a === '土' && b === '水') || (a === '水' && b === '火') || (a === '火' && b === '金')

    if (generates(dayBranchElem, dmElem)) score += 1.5
    else if (controls(dayBranchElem, dmElem)) score -= 1.5
    else if (generates(dmElem, dayBranchElem)) score -= 1
  }

  // 时干：晚年倚靠
  const hourStemElem = pillars[3]!.stemElement
  if (hourStemElem === dmElem) score += 1.5
  else if (
    (hourStemElem === '木' && dmElem === '火') || (hourStemElem === '火' && dmElem === '土') ||
    (hourStemElem === '土' && dmElem === '金') || (hourStemElem === '金' && dmElem === '水') ||
    (hourStemElem === '水' && dmElem === '木')
  ) score += 1
  else if (
    (hourStemElem === '金' && dmElem === '木') || (hourStemElem === '木' && dmElem === '土') ||
    (hourStemElem === '土' && dmElem === '水') || (hourStemElem === '水' && dmElem === '火') ||
    (hourStemElem === '火' && dmElem === '金')
  ) score -= 1

  return score
}

// ============================================================
// 综合旺衰判定
// ============================================================

export interface StrengthResult {
  strength: '身强' | '身偏旺' | '中和' | '身偏弱' | '身弱'
  monthScore: number
  rootScore: number
  helpScore: number
  surroundScore: number
  chainPenalty: number
  coldPenalty: number
  totalScore: number
  rootDetails: RootDetail[]
  details: string[]
}

/** 五行生克：a 是否生 b */
function generates(a: FiveElement, b: FiveElement): boolean {
  return (a === '木' && b === '火') || (a === '火' && b === '土') ||
    (a === '土' && b === '金') || (a === '金' && b === '水') || (a === '水' && b === '木')
}

/** 五行生克：a 是否克 b */
function controls(a: FiveElement, b: FiveElement): boolean {
  return (a === '金' && b === '木') || (a === '木' && b === '土') ||
    (a === '土' && b === '水') || (a === '水' && b === '火') || (a === '火' && b === '金')
}

/** 连锁生克惩罚：检查四柱中的五行是否生助了忌神 */
function getChainPenalty(dayMaster: HeavenlyStem, pillars: Pillar[], dist: Record<FiveElement, number>): number {
  const dmElem = STEM_ELEMENT[dayMaster]
  let penalty = 0

  // 找出最旺的忌神五行
  const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1])
  const strongestElem = sorted[0]![0] as FiveElement
  const secondElem = sorted[1]?.[0] as FiveElement | undefined

  // 判断最旺五行是否为忌神（克日主或生日主之克星）
  const isStrongestBad = controls(strongestElem, dmElem) ||
    (secondElem && controls(secondElem, dmElem) && generates(strongestElem, secondElem))

  if (isStrongestBad && dist[strongestElem] > 5) {
    // 检查是否有支柱生助了忌神
    for (const p of pillars) {
      if (generates(p.stemElement, strongestElem)) penalty -= 0.5
      if (generates(p.branchElement, strongestElem)) penalty -= 0.5
    }
  }

  return penalty
}

/** 寒局惩罚：子丑亥月 + 火弱 → 身更弱 */
function getColdPenalty(dayMaster: HeavenlyStem, monthBranch: EarthlyBranch, dist: Record<FiveElement, number>): number {
  const coldMonths: EarthlyBranch[] = ['亥', '子', '丑']
  const dmElem = STEM_ELEMENT[dayMaster]
  const fireScore = dist['火']

  if (!coldMonths.includes(monthBranch)) return 0

  // 冬季火弱 → 寒局
  if (fireScore < 2) {
    // 土日主在冬月最怕寒（冻土不生万物）
    if (dmElem === '土') return -3
    // 木日主在冬月需火调候
    if (dmElem === '木') return -2
    // 其他日主
    return -1.5
  }
  if (fireScore < 4) return -1
  return 0
}

export function judgeBodyStrength(bazi: BaziChart): StrengthResult {
  const dm = bazi.dayMaster
  const dmElem = STEM_ELEMENT[dm]
  const monthBranch = bazi.month.branch
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour]

  // 计算五行分布用于惩罚项
  const dist: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const p of pillars) {
    dist[p.stemElement] += 2
    dist[p.branchElement] += 1.5
  }

  // 1. 月令旺衰得分
  const wangXiang = getWangXiang(dmElem, monthBranch)
  const monthScore = WANG_XIANG_SCORE[wangXiang]

  // 2. 根气得分
  const rootResult = getRootScore(dm, pillars)

  // 3. 天干生助得分
  const helpScore = getHelpScore(dm, pillars)

  // 4. 三围生克得分
  const surroundScore = getSurroundScore(dm, pillars)

  // 5. 连锁生克惩罚
  const chainPenalty = getChainPenalty(dm, pillars, dist)

  // 6. 寒局惩罚
  const coldPenalty = getColdPenalty(dm, monthBranch, dist)

  // 总分
  const totalScore = monthScore + rootResult.total + helpScore + surroundScore + chainPenalty + coldPenalty

  // 判定身强身弱（调整阈值：-2~+2 为中和）
  let strength: StrengthResult['strength']
  if (totalScore >= 8) strength = '身强'
  else if (totalScore >= 3) strength = '身偏旺'
  else if (totalScore >= -2) strength = '中和'
  else if (totalScore >= -7) strength = '身偏弱'
  else strength = '身弱'

  const details = [
    `月令${bazi.month.branch}月（${wangXiang}）：${monthScore >= 0 ? '+' : ''}${monthScore}`,
    `根气总分：${rootResult.total >= 0 ? '+' : ''}${rootResult.total.toFixed(1)}（${rootResult.details.map(d => d.rootType).join('、') || '无根'}）`,
    `天干生助：${helpScore >= 0 ? '+' : ''}${helpScore}`,
    `三围生克：${surroundScore >= 0 ? '+' : ''}${surroundScore}`,
    chainPenalty !== 0 ? `连锁惩罚：${chainPenalty >= 0 ? '+' : ''}${chainPenalty}` : '',
    coldPenalty !== 0 ? `寒局惩罚：${coldPenalty >= 0 ? '+' : ''}${coldPenalty}` : '',
    `综合得分：${totalScore >= 0 ? '+' : ''}${totalScore.toFixed(1)} → ${strength}`,
  ].filter(Boolean)

  return {
    strength,
    monthScore,
    rootScore: rootResult.total,
    helpScore,
    surroundScore,
    chainPenalty,
    coldPenalty,
    totalScore,
    rootDetails: rootResult.details,
    details,
  }
}

// ============================================================
// 寒暖燥湿判断（《滴天髓》寒暖燥湿篇）
// ============================================================

export type Climate = '寒' | '暖' | '燥' | '湿' | '中和'

export interface ClimateResult {
  label: Climate
  warmthScore: number    // -10~10 暖度
  humidityScore: number  // -5~10 湿度
  needTiaoHou: boolean
}

/** 月令基础寒暖分 */
const MONTH_CLIMATE: Record<EarthlyBranch, { warmth: number; humidity: number }> = {
  '寅': { warmth: 3, humidity: 3 },
  '卯': { warmth: 4, humidity: 3 },
  '辰': { warmth: 2, humidity: 5 },
  '巳': { warmth: 7, humidity: 1 },
  '午': { warmth: 9, humidity: 0 },
  '未': { warmth: 6, humidity: 3 },
  '申': { warmth: 3, humidity: 2 },
  '酉': { warmth: 1, humidity: 2 },
  '戌': { warmth: 2, humidity: 2 },
  '亥': { warmth: -2, humidity: 6 },
  '子': { warmth: -4, humidity: 7 },
  '丑': { warmth: -3, humidity: 6 },
}

/** 五行寒暖贡献 */
const ELEM_CLIMATE: Record<FiveElement, { warmth: number; humidity: number }> = {
  '木': { warmth: 1, humidity: 1 },
  '火': { warmth: 3, humidity: -1 },
  '土': { warmth: 1, humidity: 1 },
  '金': { warmth: -1, humidity: 0 },
  '水': { warmth: -2, humidity: 3 },
}

export function judgeClimate(bazi: BaziChart, dist: Record<FiveElement, number>): ClimateResult {
  const monthBranch = bazi.month.branch
  const mc = MONTH_CLIMATE[monthBranch]

  // 月令贡献（权重40%）
  let warmth = mc.warmth * 0.4
  let humidity = mc.humidity * 0.4

  // 五行分布贡献（权重60%）
  const totalElem = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  for (const elem of FIVE_ELEMENTS) {
    const ec = ELEM_CLIMATE[elem]
    const ratio = (dist[elem] / totalElem) * 0.6
    warmth += ec.warmth * ratio * 3 // 放大五行影响
    humidity += ec.humidity * ratio * 3
  }

  // 判定
  let label: Climate
  if (warmth < -2) label = '寒'
  else if (warmth > 4 && humidity < 1) label = '燥'
  else if (humidity > 5 && warmth < 2) label = '湿'
  else if (warmth > 5) label = '暖'
  else label = '中和'

  return {
    label,
    warmthScore: Math.round(warmth * 10) / 10,
    humidityScore: Math.round(humidity * 10) / 10,
    needTiaoHou: label !== '中和',
  }
}
