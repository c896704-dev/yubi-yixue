/**
 * 刑冲合害完整计算 + 胎元命宫 + 交叉分析 + 柱位专属解读
 *
 * 六合、三合、三会、六冲、六害、相刑（无礼/持势/无恩/自刑）
 * 冲突优先级解决 + 柱位交互分析 + 跨模块联动
 * 胎元、命宫 — 基于《三命通会》《渊海子平》
 */

import type { HeavenlyStem, EarthlyBranch } from '../constants'
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../constants'

// ============================================================
// 地支关系常量
// ============================================================

const LIU_HE: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

const SAN_HE: EarthlyBranch[][] = [
  ['申', '子', '辰'], // 水局
  ['亥', '卯', '未'], // 木局
  ['寅', '午', '戌'], // 火局
  ['巳', '酉', '丑'], // 金局
]

const SAN_HUI: EarthlyBranch[][] = [
  ['寅', '卯', '辰'], // 东方木
  ['巳', '午', '未'], // 南方火
  ['申', '酉', '戌'], // 西方金
  ['亥', '子', '丑'], // 北方水
]

const LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const LIU_HAI: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

// 相刑
const WU_LI_XING: [EarthlyBranch, EarthlyBranch][] = [['子', '卯']]
const CHI_SHI_XING: EarthlyBranch[] = ['寅', '巳', '申']
const WU_EN_XING: EarthlyBranch[] = ['丑', '戌', '未']
const ZI_XING: EarthlyBranch[] = ['辰', '午', '酉', '亥']

// ============================================================
// 计算结果类型
// ============================================================

export type PillarName = '年支' | '月支' | '日支' | '时支'

export interface HeResult {
  type: '六合' | '三合' | '三会'
  branches: EarthlyBranch[]
  positions?: PillarName[]
  element?: string
  desc: string
}

export interface ChongResult {
  type: '六冲' | '六害'
  branches: [EarthlyBranch, EarthlyBranch]
  positions?: [PillarName, PillarName]
  desc: string
}

export interface XingResult {
  type: '无礼之刑' | '持势之刑' | '无恩之刑' | '自刑'
  branches: EarthlyBranch[]
  positions?: PillarName[]
  desc: string
}

export interface ChongHeResult {
  liuHe: HeResult[]
  sanHe: HeResult[]
  sanHui: HeResult[]
  liuChong: ChongResult[]
  liuHai: ChongResult[]
  xiangXing: XingResult[]
  summary: string[]
  /** 最强关系类型优先级：合 > 冲 > 刑 > 害 > 无 */
  priority: '合' | '冲' | '刑' | '害' | '无'
  /** 每个柱位受到影响的总描述 */
  positionImpacts: Record<PillarName, string>
  /** 冲突优先级解决说明 */
  conflictResolution: string[]
}

// ============================================================
// 辅助映射
// ============================================================

/** 构建分支→柱位映射 */
function buildBranchMap(
  year: EarthlyBranch, month: EarthlyBranch,
  day: EarthlyBranch, hour: EarthlyBranch,
): Map<EarthlyBranch, PillarName[]> {
  const map = new Map<EarthlyBranch, PillarName[]>()
  const entries: [EarthlyBranch, PillarName][] = [
    [year, '年支'], [month, '月支'], [day, '日支'], [hour, '时支'],
  ]
  for (const [b, p] of entries) {
    if (!map.has(b)) map.set(b, [])
    map.get(b)!.push(p)
  }
  return map
}

function getPositions(branches: EarthlyBranch[], branchMap: Map<EarthlyBranch, PillarName[]>): PillarName[] {
  const result: PillarName[] = []
  const seen = new Set<PillarName>()
  for (const b of branches) {
    const positions = branchMap.get(b) || []
    for (const p of positions) {
      if (!seen.has(p)) { seen.add(p); result.push(p) }
    }
  }
  return result
}

// ============================================================
// 检测函数（内部使用，带柱位跟踪）
// ============================================================

function findLiuHe(branches: EarthlyBranch[], bMap: Map<EarthlyBranch, PillarName[]>): HeResult[] {
  const results: HeResult[] = []
  for (const [a, b] of LIU_HE) {
    if (branches.includes(a) && branches.includes(b)) {
      const pos = getPositions([a, b], bMap)
      results.push({ type: '六合', branches: [a, b], positions: pos, desc: `${a}${b}六合` })
    }
  }
  return results
}

function findSanHe(branches: EarthlyBranch[], bMap: Map<EarthlyBranch, PillarName[]>): HeResult[] {
  const results: HeResult[] = []
  const elemName = ['水', '木', '火', '金']
  for (let i = 0; i < SAN_HE.length; i++) {
    const allThree = SAN_HE[i]!
    const present = allThree.filter(b => branches.includes(b)) as EarthlyBranch[]
    const count = present.length
    const pos = getPositions(present, bMap)
    if (count === 3) {
      results.push({ type: '三合', branches: present, positions: pos, element: elemName[i], desc: `${allThree.join('')}三合${elemName[i]}局（成局）` })
    } else if (count === 2) {
      const midBranch = allThree[1]!
      const hasMid = branches.includes(midBranch)
      if (hasMid) {
        results.push({ type: '三合', branches: present, positions: pos, element: elemName[i], desc: `${present.join('')}半合${elemName[i]}局` })
      } else {
        results.push({ type: '三合', branches: present, positions: pos, element: elemName[i], desc: `${present.join('')}暗合${elemName[i]}局` })
      }
    }
  }
  return results
}

function findSanHui(branches: EarthlyBranch[], bMap: Map<EarthlyBranch, PillarName[]>): HeResult[] {
  const results: HeResult[] = []
  const elemName = ['木', '火', '金', '水']
  for (let i = 0; i < SAN_HUI.length; i++) {
    const [x, y, z] = SAN_HUI[i]!
    const count = [x, y, z].filter(b => branches.includes(b)).length
    if (count >= 3) {
      const pos = getPositions([x, y, z], bMap)
      results.push({ type: '三会', branches: [x, y, z] as EarthlyBranch[], positions: pos, element: elemName[i], desc: `${x}${y}${z}三会${elemName[i]}局` })
    }
  }
  return results
}

function findLiuChong(branches: EarthlyBranch[], bMap: Map<EarthlyBranch, PillarName[]>): ChongResult[] {
  const results: ChongResult[] = []
  for (const [a, b] of LIU_CHONG) {
    if (branches.includes(a) && branches.includes(b)) {
      const pos = getPositions([a, b], bMap) as [PillarName, PillarName]
      results.push({ type: '六冲', branches: [a, b], positions: pos, desc: `${a}${b}六冲` })
    }
  }
  return results
}

function findLiuHai(branches: EarthlyBranch[], bMap: Map<EarthlyBranch, PillarName[]>): ChongResult[] {
  const results: ChongResult[] = []
  for (const [a, b] of LIU_HAI) {
    if (branches.includes(a) && branches.includes(b)) {
      const pos = getPositions([a, b], bMap) as [PillarName, PillarName]
      results.push({ type: '六害', branches: [a, b], positions: pos, desc: `${a}${b}六害` })
    }
  }
  return results
}

function findXiangXing(branches: EarthlyBranch[], bMap: Map<EarthlyBranch, PillarName[]>): XingResult[] {
  const results: XingResult[] = []

  for (const [a, b] of WU_LI_XING) {
    if (branches.includes(a) && branches.includes(b)) {
      const pos = getPositions([a, b], bMap)
      results.push({ type: '无礼之刑', branches: [a, b], positions: pos, desc: `${a}${b}无礼之刑，主无礼义，以下犯上` })
    }
  }

  const chiShiFound = CHI_SHI_XING.filter(b => branches.includes(b))
  if (chiShiFound.length >= 2) {
    const pos = getPositions(chiShiFound, bMap)
    results.push({ type: '持势之刑', branches: chiShiFound, positions: pos, desc: `${chiShiFound.join('')}持势之刑，主恃势凌人，易有官非` })
  }

  const wuEnFound = WU_EN_XING.filter(b => branches.includes(b))
  if (wuEnFound.length >= 2) {
    const pos = getPositions(wuEnFound, bMap)
    results.push({ type: '无恩之刑', branches: wuEnFound, positions: pos, desc: `${wuEnFound.join('')}无恩之刑，主知恩不报，易有官讼` })
  }

  for (const b of ZI_XING) {
    if (branches.filter(x => x === b).length >= 2) {
      const pos = getPositions([b], bMap)
      results.push({ type: '自刑', branches: [b, b], positions: pos, desc: `双${b}自刑，主自寻烦恼，内心矛盾` })
    }
  }

  return results
}

// ============================================================
// 冲突优先级解决
// ============================================================

/**
 * 优先级：合 > 冲 > 刑 > 害
 * 若某支既被合又被冲：合有缓冲 → "寅木被亥水相合，虽与申相冲，但合的力量大于冲，冲力被缓解"
 */
export function resolveBranchConflicts(
  chongHe: ChongHeResult,
): string[] {
  const resolutions: string[] = []
  const allBranches = new Set<EarthlyBranch>()

  // 收集所有关系中的分支
  for (const h of [...chongHe.liuHe, ...chongHe.sanHe, ...chongHe.sanHui]) {
    for (const b of h.branches) allBranches.add(b)
  }
  for (const c of [...chongHe.liuChong, ...chongHe.liuHai]) {
    allBranches.add(c.branches[0]); allBranches.add(c.branches[1])
  }
  for (const x of chongHe.xiangXing) {
    for (const b of x.branches) allBranches.add(b)
  }

  for (const branch of allBranches) {
    const isHe = [...chongHe.liuHe, ...chongHe.sanHe, ...chongHe.sanHui].some(h => h.branches.includes(branch))
    const isChong = chongHe.liuChong.some(c => c.branches.includes(branch))
    const isXing = chongHe.xiangXing.some(x => x.branches.includes(branch))
    const isHai = chongHe.liuHai.some(h => h.branches.includes(branch))

    const count = [isHe, isChong, isXing, isHai].filter(Boolean).length
    if (count >= 2) {
      // 该支被多重关系作用
      if (isHe && isChong) {
        const heEntry = [...chongHe.liuHe, ...chongHe.sanHe, ...chongHe.sanHui].find(h => h.branches.includes(branch))
        const chongEntry = chongHe.liuChong.find(c => c.branches.includes(branch))
        const otherBranch = chongEntry?.branches.find(c => c !== branch)
        resolutions.push(
          `${branch}被${heEntry?.desc?.replace(/六合|半合.*|暗合.*|三合.*/, '') || '合'}所合，虽与${otherBranch || '他支'}相冲，但合的力量大于冲，冲力被缓解。`
        )
      } else if (isHe && isXing) {
        resolutions.push(`${branch}既合又刑，合能缓解刑的戾气，但关系仍显微妙复杂。`)
      } else if (isChong && isXing) {
        resolutions.push(`${branch}既冲又刑，冲刑并见力量加倍，对应柱位变动剧烈。`)
      } else if (isHe && isHai) {
        resolutions.push(`${branch}既合又害，表面和谐实则暗藏矛盾。`)
      }
    }
  }

  return resolutions
}

// ============================================================
// 柱位专属解读
// ============================================================

const POSITION_PAIR_DESC: Record<string, Record<string, string>> = {
  '六冲': {
    '年支-时支': '年时相冲，祖业根基与晚年去向冲突，早年离家发展反有利',
    '月支-日支': '月日相冲，原生家庭与自身婚姻冲突，需平衡父母与配偶关系',
    '日支-时支': '日时相冲，内心追求与现实行动不一致，自我矛盾感强',
    '年支-日支': '年日相冲，祖荫与个人发展不匹配，需独立开辟路径',
    '年支-月支': '年月相冲，少年离家或父母关系紧张，较早独立',
    '月支-时支': '月时相冲，父母与子女缘分有波折，代际沟通需多用心',
  },
  '六合': {
    '年支-月支': '年月相合，祖上与父母关系融洽，少年得家庭庇护',
    '月支-日支': '月日相合，父母与配偶关系和睦，家庭和谐',
    '日支-时支': '日时相合，婚姻与子女关系良好，晚年有依靠',
    '年支-时支': '年时相合，祖荫绵延至晚年，一生有根',
    '年支-日支': '年日相合，祖上遗产或资源能为己所用',
    '月支-时支': '月时相合，父母与子女有缘，代际传承顺畅',
  },
  '六害': {
    '年支-时支': '年时相害，早年与晚年运势相悖，需防老来孤独',
    '月支-日支': '月日相害，父母与配偶之间暗中不睦，需居中调和',
    '日支-时支': '日时相害，婚姻因子女或晚年事务受暗中影响',
    '年支-日支': '年日相害，原生家庭对婚姻有隐性负面影响',
    '年支-月支': '年月相害，父母关系或早年成长环境微有遗憾',
    '月支-时支': '月时相害，父母与子女之间缺乏沟通默契',
  },
}

function getChongHePositionDesc(
  type: string,
  positions: PillarName[],
): string | null {
  if (positions.length < 2) return null
  const typeMap = POSITION_PAIR_DESC[type]
  if (!typeMap) return null

  // 尝试两种顺序
  const key1 = `${positions[0]}-${positions[1]}`
  const key2 = `${positions[1]}-${positions[0]}`
  return typeMap[key1] || typeMap[key2] || null
}

// ============================================================
// 综合刑冲合害分析
// ============================================================

export function getChongHeAnalysis(
  yearBranch: EarthlyBranch,
  monthBranch: EarthlyBranch,
  dayBranch: EarthlyBranch,
  hourBranch: EarthlyBranch,
): ChongHeResult {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const bMap = buildBranchMap(yearBranch, monthBranch, dayBranch, hourBranch)

  const liuHe = findLiuHe(branches, bMap)
  const sanHe = findSanHe(branches, bMap)
  const sanHui = findSanHui(branches, bMap)
  const liuChong = findLiuChong(branches, bMap)
  const liuHai = findLiuHai(branches, bMap)
  const xiangXing = findXiangXing(branches, bMap)

  // 柱位专属解读增强
  for (const c of liuChong) {
    if (c.positions && c.positions.length === 2) {
      const posDesc = getChongHePositionDesc('六冲', c.positions)
      if (posDesc) c.desc = `${c.branches[0]}${c.branches[1]}六冲 — ${posDesc}`
    }
  }
  for (const h of liuHe) {
    if (h.positions && h.positions.length === 2) {
      const posDesc = getChongHePositionDesc('六合', h.positions)
      if (posDesc) h.desc = `${h.branches[0]}${h.branches[1]}六合 — ${posDesc}`
    }
  }
  for (const h of liuHai) {
    if (h.positions && h.positions.length === 2) {
      const posDesc = getChongHePositionDesc('六害', h.positions)
      if (posDesc) h.desc = `${h.branches[0]}${h.branches[1]}六害 — ${posDesc}`
    }
  }

  // summary
  const summary: string[] = []
  if (sanHui.length > 0) summary.push(`命局${sanHui.map(h => h.desc).join('、')}，格局气势宏大`)
  if (sanHe.length > 0) summary.push(`命局${sanHe.map(h => h.desc).join('、')}`)
  if (liuHe.length > 0) summary.push(`命局${liuHe.map(h => h.desc).join('、')}，主和谐`)
  if (liuChong.length > 0) summary.push(`⚠️ 命局${liuChong.map(c => c.desc).join('、')}，主变动冲突`)
  if (liuHai.length > 0) summary.push(`⚠️ 命局${liuHai.map(c => c.desc).join('、')}，主暗中损害`)
  if (xiangXing.length > 0) summary.push(`⚠️ 命局${xiangXing.map(x => x.desc).join('；')}`)

  // 优先级确定
  let priority: ChongHeResult['priority'] = '无'
  if (liuHe.length > 0 || sanHe.length > 0 || sanHui.length > 0) priority = '合'
  else if (liuChong.length > 0) priority = '冲'
  else if (xiangXing.length > 0) priority = '刑'
  else if (liuHai.length > 0) priority = '害'

  // 冲突解决
  const partial: ChongHeResult = { liuHe, sanHe, sanHui, liuChong, liuHai, xiangXing, summary, priority, positionImpacts: {} as Record<PillarName, string>, conflictResolution: [] }
  const conflictResolution = resolveBranchConflicts(partial)

  // 柱位影响汇总
  const positionImpacts = buildPositionImpacts(partial)

  return { liuHe, sanHe, sanHui, liuChong, liuHai, xiangXing, summary, priority, positionImpacts, conflictResolution }
}

function buildPositionImpacts(chongHe: Omit<ChongHeResult, 'positionImpacts'>): Record<PillarName, string> {
  const impacts: Record<PillarName, string[]> = {
    '年支': [], '月支': [], '日支': [], '时支': [],
  }

  for (const h of [...chongHe.liuHe, ...chongHe.sanHe, ...chongHe.sanHui]) {
    if (h.positions) {
      for (const p of h.positions) {
        impacts[p]?.push(`${h.desc}`)
      }
    }
  }
  for (const c of chongHe.liuChong) {
    if (c.positions) {
      for (const p of c.positions) {
        impacts[p]?.push(`${c.desc}`)
      }
    }
  }
  for (const h of chongHe.liuHai) {
    if (h.positions) {
      for (const p of h.positions) {
        impacts[p]?.push(`${h.desc}`)
      }
    }
  }
  for (const x of chongHe.xiangXing) {
    if (x.positions) {
      for (const p of x.positions) {
        impacts[p]?.push(`${x.desc}`)
      }
    }
  }

  const result: Record<PillarName, string> = { '年支': '', '月支': '', '日支': '', '时支': '' }
  for (const [key, vals] of Object.entries(impacts)) {
    result[key as PillarName] = vals.length > 0 ? vals.join('；') : '平静无冲合'
  }
  return result
}

// ============================================================
// 跨模块联动辅助函数
// ============================================================

/** 刑冲合害 → 性格影响 */
export function getChongHePersonalityImpact(chongHe: ChongHeResult): string {
  const parts: string[] = []

  // 月日冲/害 → 内心矛盾
  const monthDayChong = chongHe.liuChong.filter(c =>
    c.positions?.includes('月支') && c.positions?.includes('日支')
  )
  const monthDayHai = chongHe.liuHai.filter(h =>
    h.positions?.includes('月支') && h.positions?.includes('日支')
  )
  if (monthDayChong.length > 0 || monthDayHai.length > 0) {
    parts.push('月日地支相冲/害，内心常有原生家庭期望与个人意愿之间的矛盾感')
  }

  // 日时冲/害 → 自我矛盾
  const dayHourChong = chongHe.liuChong.filter(c =>
    c.positions?.includes('日支') && c.positions?.includes('时支')
  )
  if (dayHourChong.length > 0) {
    parts.push('日时相冲，内心追求与外在行动常不一致，自我矛盾感较强')
  }

  // 合多 → 圆融
  const totalHe = chongHe.liuHe.length + chongHe.sanHe.length + chongHe.sanHui.length
  if (totalHe >= 2) {
    parts.push('命局合多，性格圆融，善交际协调，但合多亦为牵绊，有时难以果断取舍')
  }

  // 三刑 → 性格偏激
  const hasThreeXing = chongHe.xiangXing.filter(x => x.type !== '自刑' && x.branches.length >= 3)
  if (hasThreeXing.length > 0) {
    parts.push('命带三刑，性格中有偏激执拗的一面，凡事易走极端')
  }

  // 年时冲 → 独立
  const yearHourChong = chongHe.liuChong.filter(c =>
    c.positions?.includes('年支') && c.positions?.includes('时支')
  )
  if (yearHourChong.length > 0) {
    parts.push('年时相冲，早年与晚年去向冲突，天性独立，不囿于家庭传统')
  }

  return parts.join('；') || '命局地支关系对性格影响不大'
}

/** 大运与四柱的刑冲合害交互 */
export function getChongHeFortuneImpact(
  chongHe: ChongHeResult,
  fortuneBranch: EarthlyBranch,
  chongLiuChong: EarthlyBranch[],
  chongLiuHe: [EarthlyBranch, EarthlyBranch][],
): string {
  const parts: string[] = []

  // 大运地支与各柱位的关系
  const pillarBranches: { branch: EarthlyBranch; label: PillarName }[] = []
  for (const c of chongHe.liuChong) {
    if (c.positions) {
      for (let i = 0; i < c.branches.length; i++) {
        pillarBranches.push({ branch: c.branches[i]!, label: c.positions[i]! })
      }
    }
  }
  // 检查大运地支与四柱的冲合
  for (const [a, b] of chongLiuChong) {
    if ((a === fortuneBranch && pillarBranches.some(p => p.branch === b)) ||
        (b === fortuneBranch && pillarBranches.some(p => p.branch === a))) {
      const other = a === fortuneBranch ? b : a
      const label = pillarBranches.find(p => p.branch === other)?.label || '某柱'
      parts.push(`大运${fortuneBranch}与${label}${other}六冲，主此十年该柱位领域有变动`)
    }
  }

  if (parts.length === 0) parts.push('大运与原局地支关系平和')
  return parts.join('；')
}

// ============================================================
// 胎元计算《三命通会》
// ============================================================

export function getTaiYuan(
  monthStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
): { stem: HeavenlyStem; branch: EarthlyBranch } {
  const sIdx = HEAVENLY_STEMS.indexOf(monthStem)
  const bIdx = EARTHLY_BRANCHES.indexOf(monthBranch)

  const taiYuanStem = HEAVENLY_STEMS[(sIdx + 1) % 10]!
  const taiYuanBranch = EARTHLY_BRANCHES[(bIdx + 3) % 12]!

  return { stem: taiYuanStem, branch: taiYuanBranch }
}

// ============================================================
// 命宫计算《三命通会》
// ============================================================

export function getMingGong(
  monthBranch: EarthlyBranch,
  hourBranch: EarthlyBranch,
): EarthlyBranch {
  const mIdx = EARTHLY_BRANCHES.indexOf(monthBranch)
  const hIdx = EARTHLY_BRANCHES.indexOf(hourBranch)
  const mingGongIdx = ((14 - (mIdx + hIdx)) % 12 + 12) % 12
  return EARTHLY_BRANCHES[mingGongIdx]!
}

/** 命宫天干：年上起月法推命宫天干 */
export function getMingGongStem(
  yearStem: HeavenlyStem,
  mingGongBranch: EarthlyBranch,
): HeavenlyStem {
  const monthStemByYear: Record<HeavenlyStem, HeavenlyStem[]> = {
    '甲': ['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
    '乙': ['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
    '丙': ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
    '丁': ['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
    '戊': ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
    '己': ['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
    '庚': ['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
    '辛': ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
    '壬': ['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
    '癸': ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
  }

  const bIdx = EARTHLY_BRANCHES.indexOf(mingGongBranch)
  return monthStemByYear[yearStem]![bIdx]!
}
