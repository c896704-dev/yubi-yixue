/**
 * 八字排盘核心引擎
 * 基于 lunar-typescript 实现精确的八字排盘、大运计算
 */

import { Solar, Lunar } from 'lunar-typescript'
import {
  HEAVENLY_STEMS, EARTHLY_BRANCHES,
  STEM_ELEMENT, BRANCH_ELEMENT,
  STEM_YIN_YANG, BRANCH_YIN_YANG,
  HIDDEN_STEMS, SIXTY_JIAZI_NAYIN,
  getTenGod,
} from '../constants'
import type { HeavenlyStem, EarthlyBranch, FiveElement, TenGod } from '../constants'
import type { Pillar, BaziChart, BigFortune, PersonInfo } from '../types'
import { getTrueSolarHourBranch } from './solarTime'

// ============================================================
// 八字排盘
// ============================================================

/** 从 lunar-typescript 的天干字符解析为我们的类型 */
function toStem(s: string): HeavenlyStem {
  return s as HeavenlyStem
}

function toBranch(s: string): EarthlyBranch {
  return s as EarthlyBranch
}

function makePillarFromGanZhi(
  ganZhi: string,
  dayStem: HeavenlyStem,
  hideGan: string[],
  naYin: string,
  shiShenGan: string,
): Pillar {
  const stem = toStem(ganZhi.charAt(0))
  const branch = toStem(ganZhi.charAt(1)) as unknown as EarthlyBranch

  return {
    stem,
    branch: branch as EarthlyBranch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    naYin: naYin,
    hiddenStems: hideGan,
    tenGod: shiShenGan as TenGod,
    stemYinYang: STEM_YIN_YANG[stem],
    branchYinYang: BRANCH_YIN_YANG[branch],
  }
}

/** 完整八字排盘 */
export function calculateBazi(person: PersonInfo): BaziChart {
  const { birthYear, birthMonth, birthDay, birthHour, birthMinute, longitude } = person

  // 真太阳时修正
  const { branch: hourBranchIdx, actualHour, actualMinute } =
    getTrueSolarHourBranch(birthHour, birthMinute, longitude)

  // 使用 lunar-typescript 进行精确排盘
  const solar = Solar.fromYmdHms(birthYear, birthMonth, birthDay, actualHour, actualMinute, 0)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()

  const dayMaster = toStem(eightChar.getDayGan())

  const year = makePillarFromGanZhi(
    eightChar.getYear(), dayMaster,
    eightChar.getYearHideGan(),
    eightChar.getYearNaYin(),
    eightChar.getYearShiShenGan(),
  )

  const month = makePillarFromGanZhi(
    eightChar.getMonth(), dayMaster,
    eightChar.getMonthHideGan(),
    eightChar.getMonthNaYin(),
    eightChar.getMonthShiShenGan(),
  )

  const day = makePillarFromGanZhi(
    eightChar.getDay(), dayMaster,
    eightChar.getDayHideGan(),
    eightChar.getDayNaYin(),
    eightChar.getDayShiShenGan(),
  )

  const time = makePillarFromGanZhi(
    eightChar.getTime(), dayMaster,
    eightChar.getTimeHideGan(),
    eightChar.getTimeNaYin(),
    eightChar.getTimeShiShenGan(),
  )

  return {
    year,
    month,
    day,
    hour: time,
    dayMaster,
    dayMasterElement: STEM_ELEMENT[dayMaster],
    dayMasterYinYang: STEM_YIN_YANG[dayMaster],
  }
}

// ============================================================
// 大运计算
// ============================================================

/** 计算大运 */
export function calculateBigFortunes(bazi: BaziChart, person: PersonInfo): BigFortune[] {
  const { birthYear, birthMonth, birthDay, birthHour, birthMinute, longitude } = person

  const { actualHour, actualMinute } =
    getTrueSolarHourBranch(birthHour, birthMinute, longitude)

  const solar = Solar.fromYmdHms(birthYear, birthMonth, birthDay, actualHour, actualMinute, 0)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()

  // 性别：1=男, 0=女
  const genderCode = person.gender === '男' ? 1 : 0
  const yun = eightChar.getYun(genderCode)
  const daYunArr = yun.getDaYun()

  const fortunes: BigFortune[] = []

  for (let i = 0; i < daYunArr.length; i++) {
    const dy = daYunArr[i]!
    const ganzhi = dy.getGanZhi()
    const startAge = dy.getStartAge()
    const stem = toStem(ganzhi.charAt(0))
    const branch = toBranch(ganzhi.charAt(1))
    const tenGod = getTenGod(bazi.dayMaster, stem)

    // 确保大运年龄连续不重叠：
    // 如果前一个大运结束于 N 岁，当前大运从 N+1 开始
    let endAge = startAge + 9
    if (i > 0) {
      const prevEnd = fortunes[i - 1]!.endAge
      if (startAge <= prevEnd) {
        // 修复重叠：当前大运从前一个大运结束后+1开始
        const correctedStart = prevEnd + 1
        endAge = correctedStart + 9
        fortunes.push({
          startAge: correctedStart,
          endAge,
          stem, branch,
          naYin: SIXTY_JIAZI_NAYIN[ganzhi] ?? '',
          tenGod,
          element: STEM_ELEMENT[stem],
        })
        continue
      }
    }

    fortunes.push({
      startAge,
      endAge,
      stem,
      branch,
      naYin: SIXTY_JIAZI_NAYIN[ganzhi] ?? '',
      tenGod,
      element: STEM_ELEMENT[stem],
    })
  }

  // 校验
  for (let i = 1; i < fortunes.length; i++) {
    if (fortunes[i]!.startAge <= fortunes[i - 1]!.endAge) {
      console.warn(`大运重叠: [${i - 1}] ${fortunes[i - 1]!.startAge}-${fortunes[i - 1]!.endAge} 与 [${i}] ${fortunes[i]!.startAge}-${fortunes[i]!.endAge}`)
    }
  }

  return fortunes
}

// ============================================================
// 身强身弱判定 — 重导出 wangshuai.ts 新引擎
// ============================================================

export { judgeBodyStrength } from './wangshuai'

// ============================================================
// 格局判定（增强版：正八格 + 特殊格局）
// ============================================================

/** 建禄真值表：日主在月令处临官之位 */
const JIAN_LU_TABLE: Partial<Record<HeavenlyStem, EarthlyBranch>> = {
  '甲': '寅', '丙': '巳', '戊': '巳', '庚': '申', '壬': '亥',
  '乙': '卯', '丁': '午', '己': '午', '辛': '酉', '癸': '子',
}

function isJianLu(dayMaster: HeavenlyStem, monthBranch: EarthlyBranch): boolean {
  return JIAN_LU_TABLE[dayMaster] === monthBranch
}

/** 月刃真值表：日主在月令处帝旺之位（刃） */
const YUE_REN_TABLE: Partial<Record<HeavenlyStem, EarthlyBranch>> = {
  '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子',
  '乙': '寅', '丁': '巳', '己': '巳', '辛': '申', '癸': '亥',
}

function isYueRen(dayMaster: HeavenlyStem, monthBranch: EarthlyBranch): boolean {
  return YUE_REN_TABLE[dayMaster] === monthBranch
}

/** 格局判定规则：
 *  1. 日主在月令处临官 → 建禄格（最高优先级）
 *  2. 日主在月令处帝旺 → 月刃格
 *  3. 月令本气透干 → 以透出之神取格
 *  4. 月令本气不透，但藏干透出 → 以透出藏干取格
 *  5. 月令本气不透且无藏干透出 → 以月令十神取格
 *
 *  注意：戊日午月不取刃格而取正印格（午中丁火为戊之正印）
 */
export function determineGeJu(bazi: BaziChart): string {
  const monthBranch = bazi.month.branch
  const monthStem = bazi.month.stem
  const monthGod = bazi.month.tenGod
  const dayMaster = bazi.dayMaster
  const monthHidden = bazi.month.hiddenStems

  // 规则1：先检查建禄格（临官之位）
  if (isJianLu(dayMaster, monthBranch)) {
    return '建禄格'
  }

  // 规则2：检查月刃格（帝旺之位）
  // 特殊排除：戊日午月 → 午中丁火正印，取正印格
  if (isYueRen(dayMaster, monthBranch)) {
    if (dayMaster === '戊' && monthBranch === '午') {
      return '正印格'  // 戊日午月，午中丁火正印，不取刃格
    }
    return '月刃格'
  }

  // 规则3：月令本气透干 → 以透出之神取格
  const allStems: HeavenlyStem[] = [bazi.year.stem, bazi.month.stem, bazi.day.stem, bazi.hour.stem]
  const monthZhuQi = monthHidden[0] as HeavenlyStem | undefined
  if (monthZhuQi && allStems.includes(monthZhuQi)) {
    return godName(bazi, monthZhuQi)
  }

  // 规则4：月令本气不透但藏干在四柱天干中透出
  for (let i = 1; i < monthHidden.length; i++) {
    const cangGan = monthHidden[i] as HeavenlyStem | undefined
    if (cangGan && allStems.includes(cangGan)) {
      return godName(bazi, cangGan)
    }
  }

  // 规则5：以月令十神取格
  // 比肩/劫财在此路径下不再自动判为月刃格（帝旺已在规则2处理）
  return godNameFromTenGod(monthGod)
}

function godName(bazi: BaziChart, stem: HeavenlyStem): string {
  const god = getTenGod(bazi.dayMaster, stem)
  return godNameFromTenGod(god)
}

function godNameFromTenGod(god: string): string {
  switch (god) {
    case '正官': return '正官格'
    case '偏官': return '七杀格'
    case '正印': return '正印格'
    case '偏印': return '偏印格'
    case '正财': return '正财格'
    case '偏财': return '偏财格'
    case '食神': return '食神格'
    case '伤官': return '伤官格'
    case '比肩': case '劫财': return '月令比劫格'  // 非帝旺之位不称月刃
    default: return '杂气格'
  }
}

/** 从格判定（日主极弱，全局皆从旺神） */
export function isCongGe(bazi: BaziChart, strengthScore: number): string | null {
  if (strengthScore > -5) return null // 不够弱

  const dist = calculateElementDistribution(bazi)
  const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1])
  const maxElem = sorted[0]![0] as FiveElement
  const maxVal = sorted[0]![1]

  if (maxVal < 10) return null

  if (maxElem === '木') return '从财格（从木）'
  if (maxElem === '火') return '从官杀格（从火）'
  if (maxElem === '土') return '从财格（从土）'
  if (maxElem === '金') return '从官杀格（从金）'
  if (maxElem === '水') return '从官杀格（从水）'
  return null
}

/** 专旺格判定（一方五行独旺） */
export function isZhuanWangGe(bazi: BaziChart, dist: Record<FiveElement, number>): string | null {
  const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1])
  const maxElem = sorted[0]![0] as FiveElement
  const maxVal = sorted[0]![1]

  if (maxVal < 12) return null

  const names: Record<FiveElement, string> = {
    '木': '曲直格', '火': '炎上格', '土': '稼穑格', '金': '从革格', '水': '润下格',
  }
  return names[maxElem] || null
}

/** 化气格判定（天干五合化气） */
export function isHuaQiGe(bazi: BaziChart, dist: Record<FiveElement, number>): string | null {
  const dayStem = bazi.dayMaster
  const monthStem = bazi.month.stem

  const huaMap: [HeavenlyStem, HeavenlyStem, FiveElement, string][] = [
    ['甲', '己', '土', '甲己化土格'],
    ['乙', '庚', '金', '乙庚化金格'],
    ['丙', '辛', '水', '丙辛化水格'],
    ['丁', '壬', '木', '丁壬化木格'],
    ['戊', '癸', '火', '戊癸化火格'],
  ]

  for (const [a, b, elem, name] of huaMap) {
    if ((dayStem === a && monthStem === b) || (dayStem === b && monthStem === a)) {
      // 需要月令生助化神
      const monthElem = bazi.month.branchElement
      if (monthElem === elem || dist[elem] > 6) {
        return name
      }
    }
  }
  return null
}

/** 五行能量分布 */
export function calculateElementDistribution(bazi: BaziChart): Record<FiveElement, number> {
  const dist: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  for (const p of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    dist[p.stemElement] += 2
    dist[p.branchElement] += 1.5
    for (const hs of p.hiddenStems) {
      const stem = toStem(hs)
      dist[STEM_ELEMENT[stem]] += 0.5
    }
  }

  return dist
}

/** 日柱干支索引（用于流年计算） */
export function getDayGanzhiIndex(year: number, month: number, day: number): number {
  const solar = Solar.fromYmd(year, month, day)
  const ganzhi = solar.getLunar().getDayInGanZhi()
  const stem = toStem(ganzhi.charAt(0))
  const branch = toBranch(ganzhi.charAt(1))
  const sIdx = HEAVENLY_STEMS.indexOf(stem)
  const bIdx = EARTHLY_BRANCHES.indexOf(branch)
  return (sIdx % 10) + (bIdx % 12) * 10 // not quite right; just for approximate
}
