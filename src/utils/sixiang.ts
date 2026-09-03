/**
 * 四象三垣胎息识人术引擎
 *
 * 四象 = 四柱纳音（少年/青年/中年/晚年四段人生画面）
 * 三垣 = 胎元、命宫、身宫（纳音）——胎元看遗传本能禀赋、命宫看立身舞台、身宫看落地果实
 * 胎息 = 日柱干合支合之柱（经典定义，《三命通会》）；"元神"为本体系对它的再创作引申（已披露）
 *
 * 与八字主引擎同口径：真太阳时校准 + 晚子时日柱进位（sect=1，子初换日）；
 * 晚子时出生自动生成另一主流口径（夜子时/日柱当天）的对照盘（altChart）。
 * 干支事实层（刑冲合害/空亡/明干五行）独立于纳音层计算，总评必须两面兼顾。
 */

import { Solar } from 'lunar-typescript'
import type { PersonInfo } from '../types'
import { EARTHLY_BRANCHES, SIXTY_JIAZI_NAYIN } from '../constants'
import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../constants'
import { calculateBazi, calculateBigFortunes } from './bazi'
import { getTaiYuan, getMingGongStem, getChongHeAnalysis } from './chonghe'
import { getTrueSolarHourBranch } from './solarTime'
import { getKongWang } from './shensha'
import { NAYIN_XIANG, NAYIN_SHADOW, getTaiXi, resolveNaYinName, type NaYinXiang } from './nayinXiang'
import { generates, controls } from './interaction'

/** 纳音五行 */
export function getNaYinElem(name: string): FiveElement | null {
  return NAYIN_XIANG[name]?.elem ?? null
}

/** 纳音负向特征 */
export function getNaYinShadow(name: string): string[] {
  return NAYIN_SHADOW[name] ?? []
}

// ============================================================
// 尊卑关系（年→月→日→时相邻对，上为尊、下为卑）
// ============================================================

export type ZunBeiKind = '尊克卑' | '卑生尊' | '尊生卑' | '卑克尊' | '比和'

export const ZUN_BEI_DESC: Record<ZunBeiKind, string> = {
  '尊克卑': '尊克卑为顺——前一阶段规制后一阶段，人活在规矩里，根基扎实',
  '卑生尊': '卑生尊为反哺进献之象——后一阶段心甘情愿反哺前缘，付出自己，不忘本',
  '尊生卑': '尊生卑为支持施恩于下之象——前一阶段恩泽滋养后一阶段，造化自身',
  '卑克尊': '卑克尊为以下犯上，全盘最割裂之象——后一阶段冲撞反抗前一阶段，规制与自我互相拉扯',
  '比和': '两象同气比和——阶段之间平顺衔接，气质一贯',
}

/** 尊卑生克判定：zun=尊位纳音五行（前柱），bei=卑位纳音五行（后柱） */
export function getZunBei(zunElem: FiveElement, beiElem: FiveElement): ZunBeiKind {
  if (zunElem === beiElem) return '比和'
  if (controls(zunElem, beiElem)) return '尊克卑'
  if (generates(beiElem, zunElem)) return '卑生尊'
  if (generates(zunElem, beiElem)) return '尊生卑'
  return '卑克尊'
}

// ============================================================
// 三垣起法
// ============================================================

/** 命宫身宫（民间传承体系对称起法，已按示范体系校准）：
 *  寅起正月顺数农历月得月宫；命宫 = 月宫逆数时支序（子=1）、身宫 = 月宫顺数同一距离；
 *  宫干年干五虎遁。与紫微斗数标准安宫法存在流派差异，报告中已披露 */
export function getMingGongShenGong(
  yearStem: HeavenlyStem,
  lunarMonth: number,
  hourBranch: EarthlyBranch,
): { mingGong: string; shenGong: string; yueGong: string } {
  const yueGongIdx = (2 + lunarMonth - 1) % 12 // 寅(idx2)起正月
  const hourN = EARTHLY_BRANCHES.indexOf(hourBranch) + 1 // 时支序 1-based
  const mingGongIdx = ((yueGongIdx - hourN) % 12 + 12) % 12
  const shenGongIdx = (yueGongIdx + hourN) % 12
  const mingGongBranch = EARTHLY_BRANCHES[mingGongIdx]!
  const shenGongBranch = EARTHLY_BRANCHES[shenGongIdx]!
  return {
    yueGong: EARTHLY_BRANCHES[yueGongIdx]!,
    mingGong: getMingGongStem(yearStem, mingGongBranch) + mingGongBranch,
    shenGong: getMingGongStem(yearStem, shenGongBranch) + shenGongBranch,
  }
}

// ============================================================
// 结构化结果
// ============================================================

const STAGE_DEFS: { label: string; stageName: string; stageDesc: string }[] = [
  { label: '年柱', stageName: '少年心性', stageDesc: '少年心性与祖业环境，看开局与不羁的作业环境' },
  { label: '月柱', stageName: '青年境遇', stageDesc: '青年境遇与人格初成，看认知如何确定为自己的生存法则' },
  { label: '日柱', stageName: '中年处境', stageDesc: '中年处境与婚姻人际，看世界法则磨砺下的三观与自我' },
  { label: '时柱', stageName: '晚年结局', stageDesc: '晚年的世俗结局与归宿，以及被某一时机唤醒的终极追求' },
]

export interface SixiangStage {
  label: string
  ganzhi: string
  naYin: string
  stageName: string
  stageDesc: string
  /** 与前一柱同纳音时的延续提示（差异化生成用） */
  continuation?: string
  xiang: NaYinXiang
  /** 负向特征（暗面） */
  shadow: string[]
}

export interface YuanInfo {
  name: string
  ganzhi: string
  naYin: string
  xiang: NaYinXiang
  role: string
}

export interface ZunBeiPair {
  from: string
  to: string
  kind: ZunBeiKind
  desc: string
}

/** 三垣内部关系（数据驱动，比和/逆生不得写作冲突） */
export type YuanPairKind = '顺生' | '逆生' | '比和' | '相克'

export interface YuanPair {
  from: string
  to: string
  kind: YuanPairKind
  desc: string
}

export interface CrossPair {
  name: string
  kind: '相生' | '相克' | '比和'
  desc: string
}

export interface GanZhiFact {
  /** 刑冲破害列表（干支层事实） */
  xingchong: string[]
  /** 合会（缓和项） */
  heJu: string[]
  /** 旬空：日柱、年柱两口径 */
  kongWang: {
    branches: EarthlyBranch[]
    byYear: EarthlyBranch[] | null
    /** 落空的柱（胎元/四柱支） */
    fallingInto: string[]
  }
  /** 明干支五行盘点（8字） */
  wuxing: Record<FiveElement, number>
  /** 明五行缺 */
  missing: FiveElement[]
}

export interface DayunInfo {
  qiYunAge: number | null
  list: { ganzhi: string; naYin: string; startAge: number; endAge: number; current: boolean }[]
  current: { ganzhi: string; naYin: string; startAge: number; endAge: number } | null
  /** 当前流年（公历年 + 干支 + 与日/时支关系提示） */
  liunian: { year: number; ganzhi: string; note: string }
}

/** 另一换日口径的对照（夜子时派：日柱取当天） */
export interface AltChart {
  dayGZ: string
  dayNaYin: string
  taiXiGZ: string
  taiXiNaYin: string
  zunBei: { from: string; to: string; kind: ZunBeiKind }[]
  hasFanShang: boolean
  /** 与主口径的关键结论是否翻转 */
  flipped: boolean
}

export interface SixiangResult {
  stages: SixiangStage[]
  zunBei: ZunBeiPair[]
  hasFanShang: boolean
  overall: string
  sanyuan: {
    taiYuan: YuanInfo
    mingGong: YuanInfo
    shenGong: YuanInfo
    pairs: YuanPair[]
    lianZhu: '三垣连珠' | '三垣交战' | '三垣平和'
    desc: string
    notes: string[]
  }
  taiXi: {
    ganzhi: string
    naYin: string
    xiang: NaYinXiang
    duibiao: { kind: ZunBeiKind; label: string; desc: string }
    /** 胎息与时柱同纳音（排盘结构恒象，非个性化推断） */
    sameNaYinAsHour: boolean
  }
  cross: CrossPair[]
  /** 干支事实层（刑冲合害/空亡/明五行） */
  ganZhi: GanZhiFact
  /** 运程参照（大运/流年） */
  dayun: DayunInfo
  /** 晚子时另一口径对照（非晚子时为 null） */
  altChart: AltChart | null
  /** 出生时间贴近换日边界的敏感提示 */
  boundaryNote: string | null
  /** 方法论披露 */
  disclosure: string[]
  summary: string[]
}

// ============================================================
// 子模块计算
// ============================================================

/** 三垣内部关系（数据驱动） */
function yuanPairKind(aElem: FiveElement, bElem: FiveElement): YuanPairKind {
  if (aElem === bElem) return '比和'
  if (generates(aElem, bElem)) return '顺生'
  if (generates(bElem, aElem)) return '逆生'
  return '相克'
}

const YUAN_PAIR_DESC: Record<YuanPairKind, string> = {
  '顺生': '顺次相生，气脉贯通',
  '逆生': '倒灌相生——方向倒转但生气仍在，前垣受后垣滋养',
  '比和': '同气比和，两垣一气',
  '相克': '相克交战——本能与现实在此打架',
}

/** 胎息对标时柱：定性分档（无伪量化） */
function getDuibiao(taiXiElem: FiveElement, hourElem: FiveElement): { kind: ZunBeiKind; label: string; desc: string } {
  const kind = getZunBei(taiXiElem, hourElem)
  const map: Record<ZunBeiKind, { label: string; desc: string }> = {
    '比和': { label: '同气 · 心神合一', desc: '元神与时柱同气——终点即元神本相，人生越走越与受胎初心合一' },
    '卑生尊': { label: '反哺 · 现实为元神赋能', desc: '时柱纳音生元神——现实终点反哺先天神识，每一次成果都在为元神成长赋能' },
    '尊生卑': { label: '倾注 · 元神成就终点', desc: '元神滋养时柱——元神倾其禀赋成就世俗结局，晚年被先天志向推着走' },
    '尊克卑': { label: '压制 · 理想约束现实', desc: '元神克制时柱——先天神识对世俗结局有所约束，理想与现实彼此拉扯' },
    '卑克尊': { label: '磨耗 · 终点磨耗初心', desc: '时柱克元神——世俗结局磨耗先天神识，人生终点与受胎初心相悖，需主动回归元神本相' },
  }
  return { kind, ...map[kind]! }
}

/** 四象对三垣：先天禀赋与人生阶段的兼容性（中性描述，最高品级只在汇总提一次） */
function getCross(name: string, aElem: FiveElement, bElem: FiveElement): CrossPair {
  if (aElem === bElem) {
    return { name, kind: '比和', desc: '同气相求，先天禀赋与该人生阶段合一，无撕裂感' }
  }
  if (generates(aElem, bElem)) {
    return { name, kind: '相生', desc: '先天禀赋滋养这一人生阶段——命与自我同向，无良知对抗利益的内耗' }
  }
  if (generates(bElem, aElem)) {
    return { name, kind: '相生', desc: '这一人生阶段反哺先天禀赋——现实经历滋养元神，越经历越成全' }
  }
  if (controls(aElem, bElem)) {
    return { name, kind: '相克', desc: '先天禀赋克制这一人生阶段——天赋与环境冲突，开局难被全然理解，易生内向与自我拉扯' }
  }
  return { name, kind: '相克', desc: '这一人生阶段磨耗先天禀赋——现实磨耗天赋，需要学会在规训中保护本来的样子' }
}

/** 干支事实层：刑冲合害 / 空亡 / 明干五行 */
function computeGanZhiFacts(bazi: ReturnType<typeof calculateBazi>, taiYuanBranch: EarthlyBranch): GanZhiFact {
  const ch = getChongHeAnalysis(bazi.year.branch, bazi.month.branch, bazi.day.branch, bazi.hour.branch)
  const xingchong: string[] = []
  const heJu: string[] = []

  // 刑冲害破（含重复支的组数统计）
  const countBranch = (b: EarthlyBranch) =>
    [bazi.year.branch, bazi.month.branch, bazi.day.branch, bazi.hour.branch].filter(x => x === b).length
  const multiplicity = (a: string, b: string): number => {
    if (a === b) { const c = countBranch(a as EarthlyBranch); return c >= 2 ? c * (c - 1) / 2 : 1 }
    return countBranch(a as EarthlyBranch) * countBranch(b as EarthlyBranch)
  }
  for (const c of ch.liuChong) {
    const n = multiplicity(c.branches[0], c.branches[1])
    xingchong.push(`${c.branches[0]}${c.branches[1]}六冲${n > 1 ? `（涉${n}组）` : ''}——主变动冲击`)
  }
  for (const x of ch.xiangXing) {
    const branches = x.branches
    const n = branches.length === 2 && branches[0] !== branches[1]
      ? multiplicity(branches[0]!, branches[1]!)
      : 1
    xingchong.push(`${x.desc}${n > 1 ? `（涉${n}组）` : ''}`)
  }
  for (const h of ch.liuHai) {
    xingchong.push(`${h.branches[0]}${h.branches[1]}六害——主暗中损耗`)
  }

  // 合会（缓和项）
  for (const h of ch.liuHe) heJu.push(`${h.branches[0]}${h.branches[1]}六合——合可解冲缓刑`)
  for (const h of ch.sanHe) heJu.push(h.desc)
  for (const h of ch.sanHui) heJu.push(h.desc)

  // 旬空（日柱口径 + 年柱口径）
  const kongDay = getKongWang(bazi.day.stem, bazi.day.branch)
  const kongYear = getKongWang(bazi.year.stem, bazi.year.branch)
  const kongSet = new Set([...kongDay, ...kongYear])
  const fallingInto: string[] = []
  if (kongSet.has(taiYuanBranch)) fallingInto.push(`胎元${taiYuanBranch}`)
  const pillarNames = ['年支', '月支', '日支', '时支']
  ;[bazi.year.branch, bazi.month.branch, bazi.day.branch, bazi.hour.branch].forEach((b, i) => {
    if (kongSet.has(b)) fallingInto.push(`${pillarNames[i]}${b}`)
  })

  // 明干支五行盘点（8字）
  const wuxing: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const p of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    wuxing[p.stemElement]++
    wuxing[p.branchElement]++
  }
  const missing = (Object.keys(wuxing) as FiveElement[]).filter(e => wuxing[e] === 0)

  return {
    xingchong,
    heJu,
    kongWang: {
      branches: kongDay,
      byYear: (kongYear[0] !== kongDay[0] || kongYear[1] !== kongDay[1]) ? kongYear : null,
      fallingInto,
    },
    wuxing,
    missing,
  }
}

/** 运程参照：大运 + 当前流年 */
function computeDayun(bazi: ReturnType<typeof calculateBazi>, person: PersonInfo): DayunInfo {
  let list: DayunInfo['list'] = []
  let qiYunAge: number | null = null
  try {
    const fortunes = calculateBigFortunes(bazi, person)
    const age = new Date().getFullYear() - person.birthYear + 1 // 虚岁（项目口径）
    qiYunAge = fortunes[0]?.startAge ?? null
    list = fortunes.slice(0, 9).map(f => ({
      ganzhi: f.stem + f.branch,
      naYin: f.naYin,
      startAge: f.startAge,
      endAge: f.endAge,
      current: age >= f.startAge && age <= f.endAge,
    }))
  } catch {
    list = []
  }
  const current = list.find(f => f.current) ?? null

  // 当前流年 + 与日/时支关系
  const now = new Date()
  const year = now.getFullYear()
  const lnGZ = Solar.fromYmd(year, 6, 1).getLunar().getYearInGanZhi()
  const lnBranch = lnGZ.charAt(1) as EarthlyBranch
  const chongPairs: Record<string, string> = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' }
  const notes: string[] = []
  if (chongPairs[lnBranch] === bazi.day.branch) notes.push(`流年${lnBranch}冲日支${bazi.day.branch}`)
  if (chongPairs[lnBranch] === bazi.hour.branch) notes.push(`流年${lnBranch}冲时支${bazi.hour.branch}`)
  if (lnBranch === bazi.day.branch) notes.push('流年与日支伏吟')
  const liunian = { year, ganzhi: lnGZ, note: notes.length > 0 ? notes.join('；') : '与日时支无冲' }

  return { qiYunAge, list, current, liunian }
}

/** 晚子时另一口径对照（夜子时派：日柱取当天） */
function computeAltChart(
  solarDate: Solar,
  calibratedHour: number,
  stages: SixiangStage[],
  hourNaYin: string,
  primaryHasFanShang: boolean,
): AltChart | null {
  // 只有晚子时（真太阳时 23:00–23:59）存在换日口径分歧；
  // 早子时（00:00–00:59）各流派口径一致（日柱归当天），无需对照
  if (calibratedHour !== 23) return null
  try {
    const altDayGZ = Solar.fromYmdHms(solarDate.getYear(), solarDate.getMonth(), solarDate.getDay(), 23, 30, 0)
      .getLunar().getEightChar().getDay()
    const altDayNaYin = SIXTY_JIAZI_NAYIN[altDayGZ] ?? ''
    const altTaiXiGZ = getTaiXi(altDayGZ)
    const altTaiXiNaYin = SIXTY_JIAZI_NAYIN[altTaiXiGZ] ?? ''
    const altElem = getNaYinElem(altDayNaYin)
    // 重建尊卑链：月→日（换日柱）、日→时
    const zunBei: AltChart['zunBei'] = []
    zunBei.push({ from: stages[0]!.naYin, to: stages[1]!.naYin, kind: getZunBei(stages[0]!.xiang.elem, stages[1]!.xiang.elem) })
    if (altElem) zunBei.push({ from: altDayNaYin, to: stages[1]!.naYin, kind: getZunBei(altElem, stages[1]!.xiang.elem) })
    if (altElem) zunBei.push({ from: altDayNaYin, to: hourNaYin, kind: getZunBei(altElem, getNaYinElem(hourNaYin) ?? altElem) })
    const hasFanShang = zunBei.some(z => z.kind === '卑克尊')
    // 关键结论翻转判定：日柱纳音/胎息/卑克尊任一不同即翻转
    const primaryDayNaYin = stages[2]!.naYin
    const primaryTaiXi = getTaiXi(stages[2]!.ganzhi)
    const flipped = altDayNaYin !== primaryDayNaYin || altTaiXiGZ !== primaryTaiXi || hasFanShang !== primaryHasFanShang
    return { dayGZ: altDayGZ, dayNaYin: altDayNaYin, taiXiGZ: altTaiXiGZ, taiXiNaYin: altTaiXiNaYin, zunBei, hasFanShang, flipped }
  } catch {
    return null
  }
}

// ============================================================
// 主入口
// ============================================================

/** 主入口：四象三垣胎息识人分析（与八字排盘同口径） */
export function analyzeSixiang(person: PersonInfo): SixiangResult {
  const bazi = calculateBazi(person)
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour]

  // 真太阳时（与排盘同口径）
  const { actualHour, actualMinute, dayOffset } = getTrueSolarHourBranch(
    person.birthHour, person.birthMinute, person.longitude,
    person.birthYear, person.birthMonth, person.birthDay,
  )
  const solarDate = Solar.fromYmd(person.birthYear, person.birthMonth, person.birthDay).next(dayOffset)
  const lunarMonth = Math.abs(solarDate.getLunar().getMonth())

  // ---- 四象 ----
  const stages: SixiangStage[] = pillars.map((p, i) => {
    const def = STAGE_DEFS[i]!
    // 库输出纳音名存在用字变体（如"沙中金"），统一归一到本表标准名再查象
    const naYinStd = resolveNaYinName(p.naYin)
    const xiang = NAYIN_XIANG[naYinStd] ?? {
      name: naYinStd, ganzhi: [p.stem + p.branch], elem: p.stemElement,
      source: '', image: naYinStd, traits: [], yuanshen: naYinStd,
    } as unknown as NaYinXiang
    return {
      label: def.label,
      ganzhi: p.stem + p.branch,
      naYin: naYinStd,
      stageName: def.stageName,
      stageDesc: def.stageDesc,
      xiang,
      shadow: NAYIN_SHADOW[naYinStd] ?? [],
    }
  })
  // 同象延续提示（差异化生成，防模板复制）
  for (let i = 1; i < stages.length; i++) {
    if (stages[i]!.naYin === stages[i - 1]!.naYin) {
      stages[i]!.continuation = `与${stages[i - 1]!.label}同象（${stages[i]!.naYin}）——同一场取象贯穿两段，但人生课题已从「${stages[i - 1]!.stageName}」转向「${stages[i]!.stageName}」，解读须写出阶段差异`
    }
  }

  // ---- 尊卑链 ----
  const zunBei: ZunBeiPair[] = []
  for (let i = 0; i < 3; i++) {
    const zunElem = stages[i]!.xiang.elem
    const beiElem = stages[i + 1]!.xiang.elem
    const kind = getZunBei(zunElem, beiElem)
    zunBei.push({ from: stages[i]!.naYin, to: stages[i + 1]!.naYin, kind, desc: ZUN_BEI_DESC[kind] })
  }
  const hasFanShang = zunBei.some(z => z.kind === '卑克尊')

  // ---- 三垣 ----
  const taiYuanP = getTaiYuan(bazi.month.stem, bazi.month.branch)
  const taiYuanGz = taiYuanP.stem + taiYuanP.branch
  const { mingGong: mingGongGz, shenGong: shenGongGz } = getMingGongShenGong(bazi.year.stem, lunarMonth, bazi.hour.branch)

  const mkYuan = (name: string, role: string, gz: string): YuanInfo => {
    const naYinName = getNaYinNameByGanzhi(gz)
    return {
      name, role, ganzhi: gz, naYin: naYinName,
      xiang: NAYIN_XIANG[naYinName] ?? {
        name: naYinName, ganzhi: [gz], elem: '土',
        source: '', image: naYinName, traits: [], yuanshen: naYinName,
      } as unknown as NaYinXiang,
    }
  }

  const taiYuan = mkYuan('胎元', '遗传、本能、禀赋——受胎之月的先天根基', taiYuanGz)
  const mingGongYuan = mkYuan('命宫', '立身舞台、精神追求——一生总趋向与灵魂安放之处', mingGongGz)
  const shenGong = mkYuan('身宫', '落地果实、后天所得——先天倾向在后天的归宿', shenGongGz)

  // 三垣内部关系（数据驱动：比和/逆生不是冲突）
  const pairs: YuanPair[] = [
    { from: taiYuan.naYin, to: mingGongYuan.naYin, kind: yuanPairKind(taiYuan.xiang.elem, mingGongYuan.xiang.elem), desc: '' },
    { from: mingGongYuan.naYin, to: shenGong.naYin, kind: yuanPairKind(mingGongYuan.xiang.elem, shenGong.xiang.elem), desc: '' },
  ]
  for (const p of pairs) p.desc = `${p.from}→${p.to}：${YUAN_PAIR_DESC[p.kind]}`

  const hasKe = pairs.some(p => p.kind === '相克')
  const allShun = pairs.every(p => p.kind === '顺生')
  const lianZhu: SixiangResult['sanyuan']['lianZhu'] =
    allShun ? '三垣连珠' : hasKe ? '三垣交战' : '三垣平和'
  const sanyuanDesc = lianZhu === '三垣连珠'
    ? '三垣纳音顺次相生，谓之"三垣连珠"——主根深气脉贯通，本能、精神追求与后天所得同向而行，出厂自带的心神是合一的。'
    : lianZhu === '三垣交战'
      ? '三垣出现相克——出厂自带内核交战：理智知道该走哪条路，本能却时不时转向别处，这是一种根植底层的纠结度。'
      : `三垣无克${pairs.some(p => p.kind === '顺生') ? '有生' : '而同气'}——本能与追求之间没有内战，气脉走向以${pairs.map(p => p.kind).join('、')}的方式衔接，节奏平和而非纠结。`

  // ---- 胎息（元神）----
  const dayGanzhi = bazi.day.stem + bazi.day.branch
  const taiXiGz = getTaiXi(dayGanzhi)
  const taiXiNaYin = getNaYinNameByGanzhi(taiXiGz)
  const taiXiXiang = NAYIN_XIANG[taiXiNaYin] ?? {
    name: taiXiNaYin, ganzhi: [taiXiGz], elem: '土',
    source: '', image: taiXiNaYin, traits: [], yuanshen: taiXiNaYin,
  } as unknown as NaYinXiang
  const duibiao = getDuibiao(taiXiXiang.elem, stages[3]!.xiang.elem)
  const sameNaYinAsHour = taiXiNaYin === stages[3]!.naYin

  // ---- 四象对三垣 ----
  const cross: CrossPair[] = [
    getCross(`胎元${taiYuan.naYin}对年柱${stages[0]!.naYin}`, taiYuan.xiang.elem, stages[0]!.xiang.elem),
    getCross(`命宫${mingGongYuan.naYin}对日柱${stages[2]!.naYin}`, mingGongYuan.xiang.elem, stages[2]!.xiang.elem),
    getCross(`身宫${shenGong.naYin}对月柱${stages[1]!.naYin}`, shenGong.xiang.elem, stages[1]!.xiang.elem),
    getCross(`身宫${shenGong.naYin}对时柱${stages[3]!.naYin}`, shenGong.xiang.elem, stages[3]!.xiang.elem),
  ]

  // ---- 干支事实层 / 运程 / 双盘 / 边界提示 ----
  const ganZhi = computeGanZhiFacts(bazi, taiYuanP.branch)
  const dayun = computeDayun(bazi, person)
  const altChart = computeAltChart(solarDate, actualHour, stages, stages[3]!.naYin, hasFanShang)

  // 换日边界敏感：校准后时刻距 23:00 或 00:00 不足 10 分钟
  let boundaryNote: string | null = null
  {
    const absMin = ((dayOffset * 1440 + actualHour * 60 + actualMinute) % 1440 + 1440) % 1440
    const distTo2300 = Math.min(Math.abs(absMin - 1380), 1440 - Math.abs(absMin - 1380))
    const distTo0000 = Math.min(absMin, 1440 - absMin)
    if (Math.min(distTo2300, distTo0000) <= 10) {
      boundaryNote = `校准后真太阳时为 ${String(actualHour).padStart(2, '0')}:${String(actualMinute).padStart(2, '0')}，距换日边界不足 10 分钟——医院出生记录常有 ±5–10 分钟取整误差，建议核对出生证明精确到分钟后再定盘。`
    }
  }

  // ---- 总评（纳音层 × 干支层互斥校验：有刑冲时绝不写"没有冲克"）----
  const ganzhiTension = ganZhi.xingchong.length > 0 || ganZhi.kongWang.fallingInto.length > 0
  const overall = [
    hasFanShang
      ? `纳音层出现${zunBei.filter(z => z.kind === '卑克尊').length}处"卑克尊"（以下犯上）——人生存在阶段间的割裂与反叛。`
      : '纳音层以年为尊、以时为卑，全链未出现"卑克尊"（以下犯上），四段相生相制、承续有序。',
    ganzhiTension
      ? `但干支层另见${[...ganZhi.xingchong.map(s => s.split('——')[0]), ...(ganZhi.kongWang.fallingInto.some(f => f.startsWith('胎元')) ? ['胎元落空亡'] : [])].join('、')}——结构层面的张力与纳音层的浑成并存，解读须两面兼顾，不可只取一面。`
      : '干支层亦无刑冲空亡之扰，结构层面与纳音层互为印证。',
  ].join('')

  // ---- 方法论披露 ----
  const disclosure = [
    '换日口径：子时不分早晚，23:00–01:00 为一个完整子时；23:00 起日柱进位为次日（"子初换日"口径）。晚子时出生者本报告同时给出另一主流口径（夜子时派，日柱取当天）的对照，两种口径在学界均有依据。',
    '真太阳时：已按出生地经度（每差 1° 折 4 分钟）与当日均时差（±14~+16 分钟）校准，时辰判定与日柱换日均以校准后时刻为准。',
    '命宫/身宫：采用民间传承体系的对称起法（寅起正月顺数农历月，命宫逆数、身宫顺数时支序，宫干年干五虎遁），与紫微斗数标准安宫法存在流派差异。',
    '胎息：经典定义为日柱天干五合、地支六合所得之柱（《三命通会》）；「受胎之日那一念先天神识／元神」为本体系对该概念的再创作引申，非古籍原义，特此披露。',
    '契合度：为依纳音生克方向的定性分档，非精确百分比。',
    '引文出处：纳音取象引句出自《三命通会·卷一·论纳音取象》与《五行精纪》，个别为传统释义转写。',
    '体系总纲：天干为根、地支为命、纳音为身——本术以纳音身相取象为主轴，看的是"这个人一身之象"。',
  ]

  // ---- summary ----
  const summary: string[] = [
    `四象：年柱${stages[0]!.naYin}（少年）· 月柱${stages[1]!.naYin}（青年）· 日柱${stages[2]!.naYin}（中年）· 时柱${stages[3]!.naYin}（晚年）`,
    ...zunBei.map(z => `${z.from}→${z.to}：${z.kind}`),
    `三垣：胎元${taiYuan.naYin} · 命宫${mingGongYuan.naYin} · 身宫${shenGong.naYin}（${lianZhu}）`,
    `胎息（元神）：${taiXiNaYin}，对标时柱${stages[3]!.naYin}——${duibiao.label}`,
    ganZhi.xingchong.length > 0 ? `干支事实：${ganZhi.xingchong.join('；')}` : '干支事实：无刑冲',
    ganZhi.kongWang.fallingInto.length > 0 ? `空亡：${ganZhi.kongWang.branches.join('、')}——落空：${ganZhi.kongWang.fallingInto.join('、')}` : `空亡：${ganZhi.kongWang.branches.join('、')}——四柱与胎元未落空`,
    dayun.current ? `运程：现行${dayun.current.ganzhi}大运（${dayun.current.startAge}–${dayun.current.endAge}岁，虚岁），流年${dayun.liunian.ganzhi}` : '运程：大运数据待补',
    overall,
  ]

  return {
    stages,
    zunBei,
    hasFanShang,
    overall,
    sanyuan: { taiYuan, mingGong: mingGongYuan, shenGong, pairs, lianZhu, desc: sanyuanDesc, notes: pairs.map(p => p.desc) },
    taiXi: { ganzhi: taiXiGz, naYin: taiXiNaYin, xiang: taiXiXiang, duibiao, sameNaYinAsHour },
    cross,
    ganZhi,
    dayun,
    altChart,
    boundaryNote,
    disclosure,
    summary,
  }
}

/** 干支 → 纳音名 */
function getNaYinNameByGanzhi(gz: string): string {
  for (const x of Object.values(NAYIN_XIANG)) {
    if (x.ganzhi.includes(gz)) return x.name
  }
  return gz
}
