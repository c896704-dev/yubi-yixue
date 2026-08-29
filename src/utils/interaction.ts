/**
 * 干支作用路线引擎 — 作用只有横竖、不能斜着
 *
 * 横：相邻天干与天干、相邻地支与地支；竖：同柱天干与地支；斜（异柱干支交叉）不作用。
 * 核心规则（古籍作用路线指南）：
 * 1. 同柱作用优先于横向作用（盖头截脚：同柱先互相消耗，余力才横向作用）
 * 2. 又生又克贪生忘克（甲戌盖头打折：甲生戌中丁火，贪生忘克）
 * 3. 地支能直接生天干，但燥土不生金（火月无水）、寒水不生木（冬月无丙丁暖局）
 * 4. 地支不能直接克天干，除非干支自合四组：丁亥、辛巳、癸巳、己亥
 *    —— 丁亥/辛巳合主气力纯，支克干定案；癸巳/己亥合中余气，须辨天干力量定方向
 * 5. 天干可以直接克地支（盖头）
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../constants'
import { STEM_ELEMENT, BRANCH_ELEMENT } from '../constants'
import type { Pillar } from '../types'

/** 五行生克：a 是否生 b */
export function generates(a: FiveElement, b: FiveElement): boolean {
  return (a === '木' && b === '火') || (a === '火' && b === '土') ||
    (a === '土' && b === '金') || (a === '金' && b === '水') || (a === '水' && b === '木')
}

/** 五行生克：a 是否克 b */
export function controls(a: FiveElement, b: FiveElement): boolean {
  return (a === '金' && b === '木') || (a === '木' && b === '土') ||
    (a === '土' && b === '水') || (a === '水' && b === '火') || (a === '火' && b === '金')
}

// ============================================================
// 干支自合（天干与坐支藏干五合）
// ============================================================

export interface ZiHeInfo {
  /** 与天干相合的支中藏干 */
  heStem: HeavenlyStem
  /** 所合藏干在坐支中的位置 */
  position: '主气' | '中气' | '余气'
  /** 五合名称 */
  heName: string
  /** 合的五行化气 */
  heElement: FiveElement
}

/** 干支自合四柱：丁亥（丁壬合）、辛巳（丙辛合）、癸巳（戊癸合）、己亥（甲己合） */
export const GAN_ZHI_ZI_HE: Partial<Record<`${HeavenlyStem}${EarthlyBranch}`, ZiHeInfo>> = {
  '丁亥': { heStem: '壬', position: '主气', heName: '丁壬合', heElement: '木' },
  '辛巳': { heStem: '丙', position: '主气', heName: '丙辛合', heElement: '水' },
  '癸巳': { heStem: '戊', position: '中气', heName: '戊癸合', heElement: '火' },
  '己亥': { heStem: '甲', position: '余气', heName: '甲己合', heElement: '土' },
}

/** 查询某柱是否干支自合 */
export function getZiHe(stem: HeavenlyStem, branch: EarthlyBranch): ZiHeInfo | null {
  return GAN_ZHI_ZI_HE[`${stem}${branch}`] ?? null
}

// ============================================================
// 调候条件：燥土 / 寒水
// ============================================================

/** 火月（燥） */
const DRY_MONTHS: EarthlyBranch[] = ['巳', '午', '未']
/** 冬月（寒） */
const COLD_MONTHS: EarthlyBranch[] = ['亥', '子', '丑']

export interface ClimateContext {
  monthBranch: EarthlyBranch
  /** 局中有水调候（天干壬癸透 或 地支见子亥） */
  hasWater: boolean
  /** 局中有火暖局（天干丙丁透 或 地支见巳午） */
  hasFire: boolean
}

/** 从四柱提取调候上下文 */
export function buildClimateContext(pillars: Pillar[]): ClimateContext {
  const monthBranch = pillars[1]!.branch
  const stems = pillars.map(p => p.stem)
  const branches = pillars.map(p => p.branch)
  return {
    monthBranch,
    hasWater: stems.some(s => STEM_ELEMENT[s] === '水') ||
      branches.some(b => b === '子' || b === '亥'),
    hasFire: stems.some(s => STEM_ELEMENT[s] === '火') ||
      branches.some(b => b === '巳' || b === '午'),
  }
}

/** 燥土判定：土生于巳午未三个月且局中无水调候（燥土不生金，反脆金） */
export function isDryEarth(ctx: ClimateContext): boolean {
  return DRY_MONTHS.includes(ctx.monthBranch) && !ctx.hasWater
}

/** 寒水判定：水生于亥子丑三个月且局中无丙丁火暖局（寒水不生木，反冻木） */
export function isColdWater(ctx: ClimateContext): boolean {
  return COLD_MONTHS.includes(ctx.monthBranch) && !ctx.hasFire
}

// ============================================================
// 同柱干支作用（竖）
// ============================================================

export type VerticalKind =
  | '比和'                 // 干支同五行，坐根（如甲寅）
  | '自合-支克干'          // 丁亥/辛巳：合主气力纯，被坐支拿住，截脚
  | '自合-干克支'          // 癸巳/己亥且天干不弱：盖头成立
  | '自合-支克干弱'        // 癸巳/己亥且天干太弱：反被坐支克
  | '支生干'               // 地支生天干（燥土寒水条件除外）
  | '支不生干'             // 燥土不生金 / 寒水不生木
  | '干生支'               // 天干生地支
  | '干克支'               // 盖头（甲戌打折）
  | '无作用'               // 地支不克天干（非自合），又无其他关系

export interface VerticalResult {
  kind: VerticalKind
  /** 力量系数（0 = 不作用） */
  factor: number
  desc: string
  ziHe: ZiHeInfo | null
}

/** 甲戌：甲克戌，但甲又生戌中丁火，贪生忘克，克力打折 */
const GAN_KE_ZHI_DISCOUNT: Partial<Record<`${HeavenlyStem}${EarthlyBranch}`, string>> = {
  '甲戌': '甲木克戌土，但甲又贪生戌中丁火（又生又克贪生忘克），克力打折',
}

/**
 * 同柱干支作用判定（竖向路线）。
 * @param stemTooWeak 癸巳/己亥方向判定用：天干是否"太弱"（无根且月令死囚）。
 *   天干不太弱 → 天干克地支；太弱 → 地支克天干。
 */
export function getVerticalInteraction(
  stem: HeavenlyStem,
  branch: EarthlyBranch,
  ctx: ClimateContext,
  stemTooWeak = false,
): VerticalResult {
  const stemElem = STEM_ELEMENT[stem]
  const branchElem = BRANCH_ELEMENT[branch]

  // 1. 干支自合优先（竖向五合，作用最强）
  const ziHe = getZiHe(stem, branch)
  if (ziHe) {
    if (stem === '丁' || stem === '辛') {
      // 丁亥/辛巳：与主气相合，力纯，地支直接克天干
      return { kind: '自合-支克干', factor: 1, desc: `${stem}${branch}干支自合（${ziHe.heName}，合${ziHe.position}），坐支克干，截脚`, ziHe }
    }
    // 癸巳/己亥：与中气/余气相合，力弱，按天干力量定方向
    if (stemTooWeak) {
      return { kind: '自合-支克干弱', factor: 1, desc: `${stem}${branch}干支自合（${ziHe.heName}，合${ziHe.position}），天干太弱，反被坐支克`, ziHe }
    }
    return { kind: '自合-干克支', factor: 1, desc: `${stem}${branch}干支自合（${ziHe.heName}，合${ziHe.position}），天干不太弱，天干克地支（盖头）`, ziHe }
  }

  // 2. 比和（干支同五行，坐根）
  if (stemElem === branchElem) {
    return { kind: '比和', factor: 1, desc: `${stem}${branch}干支同气，坐根比和`, ziHe: null }
  }

  // 3. 地支生天干（默认成立，燥土寒水除外）
  if (generates(branchElem, stemElem)) {
    if (branchElem === '土' && stemElem === '金' && isDryEarth(ctx)) {
      return { kind: '支不生干', factor: 0, desc: `${branch}为燥土（生于${ctx.monthBranch}月，局中无水），燥土不生金，反能脆金`, ziHe: null }
    }
    if (branchElem === '水' && stemElem === '木' && isColdWater(ctx)) {
      return { kind: '支不生干', factor: 0, desc: `${branch}为寒水（生于${ctx.monthBranch}月，局中无丙丁暖局），寒水不生木，反能冻木`, ziHe: null }
    }
    return { kind: '支生干', factor: 1, desc: `${branch}（${branchElem}）生${stem}（${stemElem}）`, ziHe: null }
  }

  // 4. 天干生地支（竖向直接成立）
  if (generates(stemElem, branchElem)) {
    return { kind: '干生支', factor: 1, desc: `${stem}（${stemElem}）生${branch}（${branchElem}）`, ziHe: null }
  }

  // 5. 天干克地支（盖头，直接成立；甲戌贪生忘克打折）
  if (controls(stemElem, branchElem)) {
    const discountNote = GAN_KE_ZHI_DISCOUNT[`${stem}${branch}`]
    return {
      kind: '干克支',
      factor: discountNote ? 0.5 : 1,
      desc: discountNote ?? `${stem}（${stemElem}）克${branch}（${branchElem}），盖头`,
      ziHe: null,
    }
  }

  // 6. 地支克天干：不能直接克（非自合），无作用
  return { kind: '无作用', factor: 0, desc: `${branch}（${branchElem}）虽克${stem}（${stemElem}），但地支不能直接克天干，不作克论`, ziHe: null }
}

// ============================================================
// 天干横向作用（相邻天干：五合 / 相冲 / 生克）
// ============================================================

export type StemPairKind = '五合' | '相冲' | '比和' | '横生' | '横克' | '无关系'

const GAN_WU_HE: Partial<Record<`${HeavenlyStem}${HeavenlyStem}`, string>> = {
  '甲己': '甲己合土', '己甲': '甲己合土',
  '乙庚': '乙庚合金', '庚乙': '乙庚合金',
  '丙辛': '丙辛合水', '辛丙': '丙辛合水',
  '丁壬': '丁壬合木', '壬丁': '丁壬合木',
  '戊癸': '戊癸合火', '癸戊': '戊癸合火',
}

/** 天干四冲（相冲即克，力更猛） */
const GAN_CHONG: Partial<Record<`${HeavenlyStem}${HeavenlyStem}`, string>> = {
  '甲庚': '甲庚相冲', '庚甲': '甲庚相冲',
  '乙辛': '乙辛相冲', '辛乙': '乙辛相冲',
  '丙壬': '丙壬相冲', '壬丙': '丙壬相冲',
  '丁癸': '丁癸相冲', '癸丁': '丁癸相冲',
}

export interface StemPairResult {
  kind: StemPairKind
  desc: string
  /** 五合名称（如"甲己合土"），仅五合时有值 */
  name?: string
}

/**
 * 相邻天干作用（横向路线）。调用方只应对相邻柱位（年-月、月-日、日-时）调用，
 * 隔位（如年-日、年-时）按"不能斜着作用"不调用。
 */
export function getStemPairInteraction(a: HeavenlyStem, b: HeavenlyStem): StemPairResult {
  const wuHe = GAN_WU_HE[`${a}${b}`]
  if (wuHe) return { kind: '五合', desc: `${a}${b}相邻${wuHe}，合绊`, name: wuHe }

  const chong = GAN_CHONG[`${a}${b}`]
  if (chong) return { kind: '相冲', desc: `${a}${b}相邻${chong}，冲克激烈` }

  const aElem = STEM_ELEMENT[a]
  const bElem = STEM_ELEMENT[b]
  if (aElem === bElem) return { kind: '比和', desc: `${a}${b}同气比和` }
  if (generates(aElem, bElem)) return { kind: '横生', desc: `${a}生${b}` }
  if (controls(aElem, bElem)) return { kind: '横克', desc: `${a}克${b}` }
  if (generates(bElem, aElem)) return { kind: '横生', desc: `${b}生${a}` }
  if (controls(bElem, aElem)) return { kind: '横克', desc: `${b}克${a}` }
  return { kind: '无关系', desc: `${a}${b}无直接作用` }
}

// ============================================================
// 墓库（《渊海子平》《三命通会》）
// ============================================================

/** 四墓库：辰=水库、戌=火库、丑=金库、未=木库（土旺于四季，另论） */
export const MU_KU: Record<'辰' | '戌' | '丑' | '未', { elem: FiveElement; name: string }> = {
  '辰': { elem: '水', name: '水库' },
  '戌': { elem: '火', name: '火库' },
  '丑': { elem: '金', name: '金库' },
  '未': { elem: '木', name: '木库' },
}

export const MU_KU_BRANCHES = ['辰', '戌', '丑', '未'] as const
type MuKuBranch = (typeof MU_KU_BRANCHES)[number]

/** 墓库对冲：辰戌冲、丑未冲（库门冲开） */
const MU_KU_CHONG: [MuKuBranch, MuKuBranch][] = [['辰', '戌'], ['丑', '未']]

export interface MuKuResult {
  branch: MuKuBranch
  elem: FiveElement
  name: string
  /** 库神五行是否透干（透干出库） */
  isExposed: boolean
  /** 库神透干的天干 */
  exposedStems: HeavenlyStem[]
  /** 库门状态：冲开 / 刑开 / 闭 */
  door: '冲开' | '刑开' | '闭'
  /** 旺为库、衰为墓 */
  state: '库' | '墓' | '中和'
  notes: string[]
}

/**
 * 墓库分析：
 * - 旺者为库（仓库），衰者为墓（坟墓）
 * - 古法：库须刑冲而开（辰戌冲、丑未冲、丑戌未三刑开库门）
 * - 子平法：透干出库——库中之物透出天干方能起用
 * - 《三命通会》：壬水墓辰、辛金墓丑为自库，不忌刑冲
 */
export function analyzeMuKu(
  pillars: Pillar[],
  dist?: Record<FiveElement, number>,
): MuKuResult[] {
  const branches = pillars.map(p => p.branch)
  const stems = pillars.map(p => p.stem)
  const branchSet = new Set(branches)
  const results: MuKuResult[] = []

  for (const b of MU_KU_BRANCHES) {
    if (!branchSet.has(b)) continue
    const info = MU_KU[b]
    const notes: string[] = []

    // 库神透干（出库）
    const exposedStems = stems.filter(s => STEM_ELEMENT[s] === info.elem)

    // 库门：冲开 / 刑开
    let door: MuKuResult['door'] = '闭'
    for (const [x, y] of MU_KU_CHONG) {
      if (b === x && branchSet.has(y)) { door = '冲开'; notes.push(`${b}${y}相冲，库门冲开`) }
      if (b === y && branchSet.has(x)) { door = '冲开'; notes.push(`${x}${b}相冲，库门冲开`) }
    }
    const xingPartners: Record<MuKuBranch, MuKuBranch[]> = {
      '丑': ['戌', '未'], '戌': ['丑', '未'], '未': ['丑', '戌'], '辰': [],
    }
    if (door === '闭' && xingPartners[b].some(p => branchSet.has(p))) {
      door = '刑开'
      notes.push(`入丑戌未三刑组，库门刑开`)
    }

    // 旺为库、衰为墓
    let state: MuKuResult['state'] = '中和'
    if (dist) {
      const energy = dist[info.elem]
      if (energy >= 8) state = '库'
      else if (energy <= 3) state = '墓'
    }

    // 透干出库
    if (exposedStems.length > 0) {
      notes.push(`库神${info.elem}透干（${exposedStems.join('、')}），透干出库，库中之物有用`)
    } else if (door === '闭') {
      notes.push(`库神${info.elem}不透干，库门又闭，藏而不发`)
    }

    // 《三命通会》自库说：壬水墓辰、辛金墓丑，不忌刑冲
    if ((b === '辰' && info.elem === '水') || (b === '丑' && info.elem === '金')) {
      notes.push(`${b}为${info.elem}之自库（《三命通会》谓壬水、辛金不忌墓库），刑冲不必忌`)
    }

    results.push({ branch: b, elem: info.elem, name: info.name, isExposed: exposedStems.length > 0, exposedStems, door, state, notes })
  }

  return results
}
