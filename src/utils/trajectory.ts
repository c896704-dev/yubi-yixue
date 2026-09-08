/**
 * 人生轨迹引擎（识人板块 · 代码为辅、AI 为主）
 *
 * 双轴并行：
 *  ① 限运四段轴（《三命通会》：年1-16 / 月17-32 / 日33-48 / 时49+，另派15/30/45披露）
 *  ② 大运轴：全部大运逐步档案，点选任一步展开该运十年逐年流年
 * 所有岁运事实只配 (外部干支 × 带标签目标)，natal↔natal 由 sixiang 干支事实层负责，
 * 结构上杜绝重复计入（见 relation.ts）。本模块不落库：旧记录打开时以 person 现场重算。
 */

import { Solar } from 'lunar-typescript'
import type { PersonInfo } from '../types'
import type { HeavenlyStem, EarthlyBranch, TenGod, FiveElement } from '../constants'
import { HEAVENLY_STEMS, HIDDEN_STEMS, STEM_ELEMENT, BRANCH_ELEMENT, SIXTY_JIAZI_NAYIN, getTenGod } from '../constants'
import { calculateBazi, calculateBigFortunes } from './bazi'
import { getKongWang } from './shensha'
import { generates, controls } from './interaction'
import { resolveNaYinName, NAYIN_XIANG } from './nayinXiang'
import type { SixiangResult } from './sixiang'
import {
  scanBranchExt, scanStemExt, scanZhuExt,
  isBranchChong,
  MU_KU_CHONG,
  type Fact, type FactTarget, type FactTargetLabel,
} from './relation'
import {
  TRAJECTORY_NAYIN, nayinDeDi, changShengStageOf, palaceFactNote,
  PALACE_DOMAIN, YUAN_LANDING_NOTE,
  type DeDiResult,
} from './nayinTrajectory'

const toStem = (s: string): HeavenlyStem | null =>
  (HEAVENLY_STEMS as readonly string[]).includes(s) ? (s as HeavenlyStem) : null

const nayinElemOf = (gz: string): FiveElement | null => {
  const name = resolveNaYinName(SIXTY_JIAZI_NAYIN[gz] ?? '')
  return NAYIN_XIANG[name]?.elem ?? null
}

export interface StageTrack {
  label: string
  stageName: string
  ageRange: string
  yearRange: [number, number]
  ganzhi: string
  naYin: string
  xiang: string
  xi: string
  palaceDomain: string
  dayunCoverage: { ganzhi: string; overlap: string }[]
  factCount: number
}

export interface DayunTrack {
  index: number
  ganzhi: string
  naYin: string
  startAge: number
  endAge: number
  startYear: number
  endYear: number
  isCurrent: boolean
  stemTenGod: TenGod
  hiddenGods: string[]
  deDiYear: DeDiResult | null
  deDiDay: DeDiResult | null
  changSheng: { stage: string; luck: string }
  stemBranchForm: '盖头' | '截脚' | '干支同气' | '干生支' | '支生干' | null
  facts: Fact[]
  /** 该运内高权重节点年份（供列表预览，完整逐年走 buildLiunianTracks） */
  hotYears: { year: number; note: string }[]
}

export interface LiunianTrack {
  year: number
  age: number
  ganzhi: string
  stemTenGod: TenGod
  facts: Fact[]
  kongWangTaiSui: boolean
  summary: string
}

export interface YuanXiangTrack {
  name: string
  role: string
  ganzhi: string
  naYin: string
  xiang: string
  xi: string
  palaceDomain: string
  facts: Fact[]
  landingHits: string[]
}

export interface TrajectoryResult {
  qiYun: { age: number | null; note: string }
  stages: StageTrack[]
  dayunTracks: DayunTrack[]
  yuanXiang: YuanXiangTrack[]
  taiXiZhu: { ganzhi: string; naYin: string; xiang: string; xi: string; facts: Fact[] }
  keyMoments: { when: string; weight: number; text: string }[]
  disclosure: string[]
  queryYear: number
}

// ============================================================
// natal 上下文（从 SixiangResult 提取，保证与主盘同口径）
// ============================================================

interface NatalCtx {
  dayStem: HeavenlyStem
  branches: { branch: EarthlyBranch; label: FactTargetLabel | string }[]
  stems: { stem: HeavenlyStem; label: string }[]
  zhus: { ganzhi: string; label: string }[]
  kongWang: EarthlyBranch[]
  yearNaYin: string
  dayNaYin: string
}

function buildNatalCtx(person: PersonInfo, r: SixiangResult): NatalCtx {
  const bazi = calculateBazi(person)
  const dayStem = bazi.day.stem
  const branchLabels: FactTargetLabel[] = ['年支', '月支', '日支', '时支']
  const stemLabels = ['年干', '月干', '日干', '时干']
  const branches = [bazi.year, bazi.month, bazi.day, bazi.hour].map((p, i) => ({ branch: p.branch, label: branchLabels[i]! }))
  branches.push(
    { branch: r.sanyuan.taiYuan.ganzhi.charAt(1) as EarthlyBranch, label: '胎元' },
    { branch: r.sanyuan.mingGong.ganzhi.charAt(1) as EarthlyBranch, label: '命宫' },
    { branch: r.sanyuan.shenGong.ganzhi.charAt(1) as EarthlyBranch, label: '身宫' },
    { branch: r.taiXi.ganzhi.charAt(1) as EarthlyBranch, label: '胎息' },
  )
  const stems = [bazi.year, bazi.month, bazi.day, bazi.hour].map((p, i) => ({ stem: p.stem, label: stemLabels[i]! }))
  const zhus = [
    { ganzhi: r.stages[0]!.ganzhi, label: '年柱' },
    { ganzhi: r.stages[1]!.ganzhi, label: '月柱' },
    { ganzhi: r.stages[2]!.ganzhi, label: '日柱' },
    { ganzhi: r.stages[3]!.ganzhi, label: '时柱' },
    { ganzhi: r.sanyuan.taiYuan.ganzhi, label: '胎元' },
    { ganzhi: r.sanyuan.mingGong.ganzhi, label: '命宫' },
    { ganzhi: r.sanyuan.shenGong.ganzhi, label: '身宫' },
  ]
  return {
    dayStem,
    branches,
    stems,
    zhus,
    kongWang: getKongWang(bazi.day.stem, bazi.day.branch) as EarthlyBranch[],
    yearNaYin: r.stages[0]!.naYin,
    dayNaYin: r.stages[2]!.naYin,
  }
}

// 附宫位释义；同 (kind+targets) 的重复事实（支层与柱层对三垣用了同一标签）合并为一条，保留信息更全的 desc
function decorateFacts(facts: Fact[]): Fact[] {
  const noted = facts.map(f => {
    const note = f.targets.length === 1 ? palaceFactNote(f.kind, f.targets[0]!) : ''
    return note ? { ...f, desc: `${f.desc}。${note}` } : { ...f }
  })
  const byKey = new Map<string, Fact>()
  for (const f of noted) {
    const key = `${f.kind}|${[...f.targets].sort().join(',')}`
    const prev = byKey.get(key)
    if (!prev || f.desc.length > prev.desc.length) byKey.set(key, { ...f, weight: Math.max(f.weight, prev?.weight ?? 0) })
  }
  return [...byKey.values()]
}

/** 外部柱（大运/流年）对 natal 的全量事实（支层 + 干层 + 整柱层） */
function scanExtZhu(extGanzhi: string, n: NatalCtx, extraTargets?: { ganzhi: string; label: string }[]): Fact[] {
  const stem = extGanzhi.charAt(0) as HeavenlyStem
  const branch = extGanzhi.charAt(1) as EarthlyBranch
  const facts = [
    ...scanBranchExt(branch, n.branches as FactTarget[]),
    ...scanStemExt(stem, n.dayStem, n.stems),
    ...scanZhuExt(extGanzhi, [...n.zhus, ...(extraTargets ?? [])]),
  ]
  return decorateFacts(facts).sort((a, b) => b.weight - a.weight)
}

// ============================================================
// 大运档案
// ============================================================

function buildDayunTracks(person: PersonInfo, n: NatalCtx, nowYear: number): { tracks: DayunTrack[]; qiYunAge: number | null; anchorYear: number } {
  const bazi = calculateBazi(person)
  const fortunes = calculateBigFortunes(bazi, person)
  const qiYunAge = fortunes[0]?.startAge ?? null
  // 虚岁1对应的公历年锚点（用库 startYear 反推，避免 dayOffset 造成 ±1 年漂移）
  const anchorYear = fortunes.length > 0 ? (fortunes[0]!.startYear ?? person.birthYear) - (fortunes[0]!.startAge - 1) : person.birthYear
  const yearNaYinElem = NAYIN_XIANG[n.yearNaYin]?.elem ?? null
  const dayNaYinElem = NAYIN_XIANG[n.dayNaYin]?.elem ?? null

  const tracks = fortunes.map((f, idx) => {
    const gz = f.stem + f.branch
    const sy = f.startYear ?? anchorYear + f.startAge - 1
    const ey = f.endYear ?? sy + 9
    const facts = scanExtZhu(gz, n)
    // 大运纳音×本命（《三命通会·论大运》纳音得地法）
    const dyElem = nayinElemOf(gz)
    const deDiYear = yearNaYinElem && dyElem ? nayinDeDi(yearNaYinElem, dyElem) : null
    const deDiDay = dayNaYinElem && dyElem ? nayinDeDi(dayNaYinElem, dyElem) : null
    // 干支形（盖头/截脚——大运柱内部竖向关系）
    const sElem = STEM_ELEMENT[f.stem]
    const bElem = BRANCH_ELEMENT[f.branch]
    let stemBranchForm: DayunTrack['stemBranchForm'] = null
    if (sElem === bElem) stemBranchForm = '干支同气'
    else if (controls(sElem, bElem)) stemBranchForm = '盖头'
    else if (controls(bElem, sElem)) stemBranchForm = '截脚'
    else if (generates(sElem, bElem)) stemBranchForm = '干生支'
    else if (generates(bElem, sElem)) stemBranchForm = '支生干'
    // 本运内高权重节点（轻量预览；完整逐年见 buildLiunianTracks）
    const hotYears: { year: number; note: string }[] = []
    for (let y = sy; y <= ey; y++) {
      const lnGz = Solar.fromYmd(y, 6, 1).getLunar().getYearInGanZhi()
      const hot = scanExtZhu(lnGz, n, [{ ganzhi: gz, label: '大运' }])
        .filter(x => x.weight >= 7 && !(x.kind === '伏吟' && x.targets.includes('大运')))
        .slice(0, 2)
        .map(x => `${x.kind}·${x.targets.join('/')}`)
      if (hot.length > 0) hotYears.push({ year: y, note: hot.join('，') })
    }
    return {
      index: idx,
      ganzhi: gz,
      naYin: f.naYin ? resolveNaYinName(f.naYin) : '',
      startAge: f.startAge,
      endAge: f.endAge,
      startYear: sy,
      endYear: ey,
      isCurrent: nowYear >= sy && nowYear <= ey,
      stemTenGod: f.tenGod,
      hiddenGods: (HIDDEN_STEMS[f.branch] ?? []).map(h => {
        const hs = toStem(h)
        return hs ? `${h}(${getTenGod(bazi.dayMaster, hs)})` : h
      }),
      deDiYear,
      deDiDay,
      changSheng: changShengStageOf(bazi.dayMaster, f.branch),
      stemBranchForm,
      facts,
      hotYears,
    }
  })
  return { tracks, qiYunAge, anchorYear }
}

// ============================================================
// 流年（按选中的大运现场构建，不进 resultData / 不落库）
// ============================================================

export function buildLiunianTracks(person: PersonInfo, r: SixiangResult, dayunIndex: number): LiunianTrack[] {
  const n = buildNatalCtx(person, r)
  const bazi = calculateBazi(person)
  const fortunes = calculateBigFortunes(bazi, person)
  const dy = fortunes[dayunIndex]
  if (!dy) return []
  const dyGz = dy.stem + dy.branch
  const startYear = dy.startYear ?? person.birthYear + dy.startAge - 1
  const endYear = dy.endYear ?? startYear + 9
  const dayMasterElem = STEM_ELEMENT[bazi.dayMaster]
  const tombBranch: Partial<Record<typeof dayMasterElem, EarthlyBranch>> = { '木': '未', '火': '戌', '金': '丑', '水': '辰', '土': '辰' }
  const natalMuKu = n.branches.filter(t => t.branch in MU_KU_CHONG && (t.label === '年支' || t.label === '月支' || t.label === '日支' || t.label === '时支'))

  const out: LiunianTrack[] = []
  for (let y = startYear; y <= endYear; y++) {
    const gz = Solar.fromYmd(y, 6, 1).getLunar().getYearInGanZhi()
    const lnStem = gz.charAt(0) as HeavenlyStem
    const lnBranch = gz.charAt(1) as EarthlyBranch
    const stem = toStem(lnStem)
    // 岁运并临由下方显式建模（伏吟大运重复项剔除）
    const facts = scanExtZhu(gz, n, [{ ganzhi: dyGz, label: '大运' }])
      .filter(f => !(f.kind === '伏吟' && f.targets.includes('大运')))

    // 岁运并临（《三命通会·总论岁运》）
    if (gz === dyGz) {
      facts.push({ kind: '岁运并临', targets: ['大运'], desc: `流年与大运${dyGz}干支全同（岁运并临）——力量重叠加倍，吉凶以本命喜忌为准`, weight: 9 })
    }
    // 太岁空亡（日柱旬空口径）
    const kongWangTaiSui = n.kongWang.includes(lnBranch)
    if (kongWangTaiSui) {
      facts.push({ kind: '空亡', targets: ['太岁'], desc: palaceFactNote('空亡', '太岁'), weight: 7 })
    }
    // 日主入墓
    if (stem && tombBranch[dayMasterElem] === lnBranch) {
      facts.push({ kind: '入墓', targets: ['日主'], desc: palaceFactNote('入墓', '日主') + `（日主${bazi.dayMaster}之${dayMasterElem}墓在${lnBranch}）`, weight: 5 })
    }
    // 冲开墓库
    for (const mk of natalMuKu) {
      if (isBranchChong(lnBranch, mk.branch)) {
        facts.push({ kind: '冲开墓库', targets: [mk.label], desc: palaceFactNote('冲开墓库', '原局') + `（流年${lnBranch}冲原局${mk.branch}）`, weight: 7 })
      }
    }
    // 藏干透出引动
    for (const t of n.branches) {
      if (typeof t.label !== 'string') continue
      const hid = (HIDDEN_STEMS[t.branch] ?? []).filter(h => h === lnStem)
      for (const h of hid) {
        const hs = toStem(h)
        if (!hs) continue
        const god = getTenGod(bazi.dayMaster, hs)
        facts.push({ kind: '藏干透出', targets: [t.label], desc: `${t.label}${t.branch}所藏${h}（${god}）被流年天干引出——${god}所主人事在该年被引动`, weight: 4 })
      }
    }
    const sorted = facts.sort((a, b) => b.weight - a.weight)
    out.push({
      year: y,
      age: dy.startAge + (y - startYear),
      ganzhi: gz,
      stemTenGod: stem ? getTenGod(bazi.dayMaster, stem) : '比肩',
      facts: sorted,
      kongWangTaiSui,
      summary: sorted.length > 0 ? sorted.slice(0, 3).map(f => `${f.kind}(${f.targets.join('/')})`).join('、') : '与原局无显著作用',
    })
  }
  return out
}

// ============================================================
// 限运四段 / 三垣落地 / 胎息实作 / 关键节点
// ============================================================

const STAGE_RANGES: [number, number][] = [[1, 16], [17, 32], [33, 48], [49, 120]]

function buildStages(r: SixiangResult, dayunTracks: DayunTrack[], anchorYear: number, qiYunAge: number | null): StageTrack[] {
  return r.stages.map((s, i) => {
    const [lo, hi] = STAGE_RANGES[i]!
    const zhuKey = s.ganzhi
    const tx = TRAJECTORY_NAYIN[zhuKey] ?? { xiang: '', xi: '' }
    const coverage = dayunTracks
      .map(d => {
        const oLo = Math.max(lo, d.startAge)
        const oHi = Math.min(hi, d.endAge)
        return oHi >= oLo ? { ganzhi: d.ganzhi, overlap: `${oLo}-${oHi}岁` } : null
      })
      .filter((x): x is { ganzhi: string; overlap: string } => !!x)
    const cappedHi = Math.min(hi, 99)
    return {
      label: s.label,
      stageName: s.stageName,
      ageRange: lo === 49 ? `49岁以后（约至${cappedHi >= 99 ? '运尽' : cappedHi}）` : `${lo}-${hi}岁`,
      yearRange: [anchorYear + lo - 1, anchorYear + Math.min(hi, qiYunAge != null ? 120 : 120) - 1],
      ganzhi: s.ganzhi,
      naYin: s.naYin,
      xiang: tx.xiang,
      xi: tx.xi,
      palaceDomain: PALACE_DOMAIN[s.label.replace('柱', '支')] ?? '',
      dayunCoverage: coverage,
      factCount: coverage.length,
    }
  })
}

function buildYuanXiang(r: SixiangResult, n: NatalCtx): YuanXiangTrack[] {
  const yuanDefs = [
    { name: '胎元', info: r.sanyuan.taiYuan, role: '受胎之月——遗传体质、父母祖籍、先天禀赋之根' },
    { name: '命宫', info: r.sanyuan.mingGong, role: '立身舞台——一生事业规模与精神安放之处' },
    { name: '身宫', info: r.sanyuan.shenGong, role: '落地果实——财运与后天实际所得' },
  ]
  const natalBranchTargets = n.branches.filter(t => t.label === '年支' || t.label === '月支' || t.label === '日支' || t.label === '时支') as FactTarget[]
  return yuanDefs.map(y => {
    const branch = y.info.ganzhi.charAt(1) as EarthlyBranch
    const stem = y.info.ganzhi.charAt(0) as HeavenlyStem
    const facts = decorateFacts([
      ...scanBranchExt(branch, natalBranchTargets),
      ...scanStemExt(stem, n.dayStem, n.stems),
      ...scanZhuExt(y.info.ganzhi, n.zhus.filter(z => z.label !== y.name)),
    ])
    const landingHits: string[] = []
    const hasChong = facts.some(f => (f.kind === '六冲' || f.kind === '反吟') && f.targets.includes('年支'))
    if (y.name === '胎元') {
      if (facts.some(f => f.kind === '六冲' || f.kind === '反吟')) landingHits.push(...YUAN_LANDING_NOTE['胎元受冲']!.slice(0, 1))
      if (hasChong) landingHits.push(YUAN_LANDING_NOTE['胎元受冲']![1]!)
      if (n.kongWang.includes(branch)) landingHits.push(...YUAN_LANDING_NOTE['胎元落空']!)
    } else if (y.name === '命宫') {
      if (n.kongWang.includes(branch)) landingHits.push(...YUAN_LANDING_NOTE['命宫落空']!)
      if (facts.some(f => f.kind === '六合' || f.kind === '三合' || f.kind === '半合')) landingHits.push(...YUAN_LANDING_NOTE['命宫遇合']!)
    } else {
      if (n.kongWang.includes(branch)) landingHits.push(...YUAN_LANDING_NOTE['身宫落空']!)
      if (facts.some(f => f.kind === '六冲' || f.kind === '反吟')) landingHits.push(...YUAN_LANDING_NOTE['身宫受冲']!)
      if (facts.some(f => f.kind === '六合' || f.kind === '三合' || f.kind === '半合')) landingHits.push(...YUAN_LANDING_NOTE['身宫遇合']!)
    }
    // 三垣互参（盲派：胎身命连/冲/合）
    const tx = TRAJECTORY_NAYIN[y.info.ganzhi] ?? { xiang: '', xi: '' }
    return {
      name: y.name,
      role: y.role,
      ganzhi: y.info.ganzhi,
      naYin: y.info.naYin,
      xiang: tx.xiang,
      xi: tx.xi,
      palaceDomain: PALACE_DOMAIN[y.name] ?? '',
      facts,
      landingHits,
    }
  })
}

function collectKeyMoments(dayunTracks: DayunTrack[]): { when: string; weight: number; text: string }[] {
  const moments: { when: string; weight: number; text: string }[] = []
  for (const d of dayunTracks) {
    for (const f of d.facts.filter(x => x.weight >= 7)) {
      moments.push({ when: `${d.ganzhi}大运（${d.startAge}-${d.endAge}虚岁 / ${d.startYear}-${d.endYear}）`, weight: f.weight, text: f.desc })
    }
    for (const h of d.hotYears) {
      moments.push({ when: `${h.year}年（${h.year - d.startYear + d.startAge}虚岁，${d.ganzhi}运）`, weight: 7, text: h.note })
    }
  }
  return moments.sort((a, b) => b.weight - a.weight).slice(0, 25)
}

// ============================================================
// 主入口
// ============================================================

export function analyzeTrajectory(person: PersonInfo, r: SixiangResult, opts?: { nowYear?: number }): TrajectoryResult {
  const nowYear = opts?.nowYear ?? new Date().getFullYear()
  const n = buildNatalCtx(person, r)
  const { tracks: dayunTracks, qiYunAge, anchorYear } = buildDayunTracks(person, n, nowYear)
  const stages = buildStages(r, dayunTracks, anchorYear, qiYunAge)
  const yuanXiang = buildYuanXiang(r, n)

  // 胎息干支与原局的实际作用（替代空洞档位词）
  const txGz = r.taiXi.ganzhi
  const txStem = txGz.charAt(0) as HeavenlyStem
  const txBranch = txGz.charAt(1) as EarthlyBranch
  const taiXiFacts = decorateFacts([
    ...scanBranchExt(txBranch, n.branches.filter(t => t.label !== '胎息') as FactTarget[]),
    ...scanStemExt(txStem, n.dayStem, n.stems),
    ...scanZhuExt(txGz, n.zhus),
  ])
  const tx = TRAJECTORY_NAYIN[txGz] ?? { xiang: '', xi: '' }

  const qiYunNote = qiYunAge != null
    ? `本命起运虚岁 ${qiYunAge}（约 ${anchorYear + qiYunAge - 1} 年）；起运前之童限不叠大运作用，以原局年月为运程底。`
    : '起运信息待定。'

  return {
    qiYun: { age: qiYunAge, note: qiYunNote },
    stages,
    dayunTracks,
    yuanXiang,
    taiXiZhu: {
      ganzhi: txGz,
      naYin: r.taiXi.naYin,
      xiang: tx.xiang,
      xi: tx.xi,
      facts: taiXiFacts,
    },
    keyMoments: collectKeyMoments(dayunTracks),
    disclosure: [
      '限运分段：采用《三命通会》系主流口径——年柱管1-16岁、月柱管17-32岁、日柱管33-48岁、时柱管49岁以后（"年为根、月为苗、日为花、时为果"）；另有 15/30/45 岁分段的流派，两说均有传承。',
      '大运看法：依《三命通会·论大运》干支一体统看十年为主；"天干管前五年、地支管后五年"为另一家说法，本报告不采用但如实披露。',
      '流年干支：以公历年中（6月1日）取岁干支，与立春换年口径在年内绝大多数日期一致，仅 1-2 月边界差一天。',
      '伏吟/反吟/岁运并临等皆为"引动"信号——古籍断法须结合本命喜忌定吉凶方向，本模块以纳音与宫位关系为骨，给出的传统断语保留双向可能（冲喜用则动、冲忌神亦动），不代下吉凶结论。',
      '十二长生以日主天干查岁运地支；阴干长生从"阳顺阴逆"说（与项目旺衰引擎同口径），阴干之档视为弱信号。',
      '三垣不与四柱天干地支论五行生克（盲派规矩），只查同字/冲合刑破等实际作用；三垣克应语出自传承口诀，属古法参照。',
      '大运纳音×本命：年命（生年纳音）与日柱纳音双口径并列（古法以年论命、子平以日论身，两者都给、自行参照）。',
      '本板块为"人生轨迹"参照：所有年龄段/年份断语均为传统术数口径的倾向性描述，非事实预测。',
    ],
    queryYear: nowYear,
  }
}
