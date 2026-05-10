/**
 * 龙凤合鸣 - 深度合盘报告引擎
 */

import {
  HEAVENLY_STEMS, EARTHLY_BRANCHES,
  STEM_ELEMENT, BRANCH_ELEMENT, STEM_YIN_YANG,
  FIVE_ELEMENTS,
} from '../constants'
import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../constants'
import type { AnalysisResult, CompatibilityResult, BigFortune } from '../types'
import { analyzePerson } from './analysis'

// ============================================================
// 合盘计算
// ============================================================

export function computeCompatibility(male: AnalysisResult, female: AnalysisResult): CompatibilityResult {
  // 1. 天干吸引力
  const attractionScore = scoreAttraction(male, female)

  // 2. 地支稳定性
  const stabilityScore = scoreStability(male, female)

  // 3. 五行互补性
  const complementScore = scoreComplement(male, female)

  // 4. 总分
  const total = Math.round((attractionScore + stabilityScore + complementScore) / 3)

  // 5. 关系模型
  const relationshipModel = determineRelationshipModel(male, female)

  // 6. 优势与软肋
  const advantages = findAdvantages(male, female)
  const weaknesses = findWeaknesses(male, female)

  // 7. 雷区预警
  const warnings = findWarnings(male, female)

  // 8. 裁定
  const { verdict, suggestion } = makeVerdict(total)

  // 9. 大运同步
  const fortuneSync = analyzeFortuneSync(male, female)

  // 10. 评分明细
  const scoreBreakdown = computeScoreBreakdown(male, female, {
    attraction: attractionScore,
    stability: stabilityScore,
    complement: complementScore,
  })

  return {
    male,
    female,
    scores: {
      attraction: attractionScore,
      stability: stabilityScore,
      complement: complementScore,
      total,
    },
    scoreBreakdown,
    relationshipModel,
    advantages,
    weaknesses,
    warnings,
    verdict,
    suggestion,
    fortuneSync,
  }
}

// ============================================================
// 天干吸引力评分 (0-100)
// ============================================================

function scoreAttraction(male: AnalysisResult, female: AnalysisResult): number {
  const mDay = male.bazi.dayMaster
  const fDay = female.bazi.dayMaster

  let score = 60 // 基准分

  // 天干五合：甲己、乙庚、丙辛、丁壬、戊癸
  const hePairs: [HeavenlyStem, HeavenlyStem][] = [
    ['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸'],
  ]

  for (const [a, b] of hePairs) {
    if ((mDay === a && fDay === b) || (mDay === b && fDay === a)) {
      score += 30
      break
    }
  }

  // 天干相克减分
  const mElem = STEM_ELEMENT[mDay]
  const fElem = STEM_ELEMENT[fDay]
  if (
    (mElem === '金' && fElem === '木') ||
    (mElem === '木' && fElem === '土') ||
    (mElem === '土' && fElem === '水') ||
    (mElem === '水' && fElem === '火') ||
    (mElem === '火' && fElem === '金')
  ) {
    score -= 15
  }

  // 同五行加分
  if (mElem === fElem) score += 10

  // 相生加分
  if (
    (mElem === '木' && fElem === '火') ||
    (mElem === '火' && fElem === '土') ||
    (mElem === '土' && fElem === '金') ||
    (mElem === '金' && fElem === '水') ||
    (mElem === '水' && fElem === '木')
  ) {
    score += 20
  }

  return Math.min(100, Math.max(0, score))
}

// ============================================================
// 地支稳定性评分 (0-100)
// ============================================================

function scoreStability(male: AnalysisResult, female: AnalysisResult): number {
  let score = 50

  // 地支六合
  const liuHe: [EarthlyBranch, EarthlyBranch][] = [
    ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
  ]

  const mBranch = male.bazi.day.branch
  const fBranch = female.bazi.day.branch

  let heBonus = 0
  for (const [a, b] of liuHe) {
    if ((mBranch === a && fBranch === b) || (mBranch === b && fBranch === a)) {
      heBonus = 25
      break
    }
  }

  // 地支三合
  const sanHe: EarthlyBranch[][] = [
    ['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑'],
  ]
  for (const group of sanHe) {
    if (group.includes(mBranch) && group.includes(fBranch) && mBranch !== fBranch) {
      heBonus = Math.max(heBonus, 20)
    }
  }

  score += heBonus

  // 地支六冲
  const liuChong: [EarthlyBranch, EarthlyBranch][] = [
    ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
  ]

  for (const [a, b] of liuChong) {
    if ((mBranch === a && fBranch === b) || (mBranch === b && fBranch === a)) {
      score -= 30
      break
    }
  }

  // 地支相害
  const xiangHai: [EarthlyBranch, EarthlyBranch][] = [
    ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
  ]
  for (const [a, b] of xiangHai) {
    if ((mBranch === a && fBranch === b) || (mBranch === b && fBranch === a)) {
      score -= 15
      break
    }
  }

  // 地支相刑
  const xiangXing: [EarthlyBranch, EarthlyBranch][] = [
    ['寅', '巳'], ['巳', '申'], ['申', '寅'],
    ['丑', '戌'], ['戌', '未'], ['未', '丑'],
    ['子', '卯'],
  ]
  for (const [a, b] of xiangXing) {
    if ((mBranch === a && fBranch === b) || (mBranch === b && fBranch === a)) {
      score -= 10
      break
    }
  }

  return Math.min(100, Math.max(0, score))
}

// ============================================================
// 五行互补性评分 (0-100)
// ============================================================

function scoreComplement(male: AnalysisResult, female: AnalysisResult): number {
  const mFav = male.favorableElements
  const fFav = female.favorableElements
  const mDist = male.fiveElementDistribution
  const fDist = female.fiveElementDistribution

  let score = 50

  // 男喜用神恰好是女旺的元素 → 强互补
  for (const elem of FIVE_ELEMENTS) {
    if (mFav.includes(elem) && fDist[elem] > 8) score += 10
    if (fFav.includes(elem) && mDist[elem] > 8) score += 10
  }

  // 双方喜用神冲突
  for (const elem of FIVE_ELEMENTS) {
    if (mFav.includes(elem) && female.unfavorableElements.includes(elem)) score -= 10
    if (fFav.includes(elem) && male.unfavorableElements.includes(elem)) score -= 10
  }

  // 五行分布相似度
  let similarity = 0
  for (const elem of FIVE_ELEMENTS) {
    const mVal = mDist[elem] / 10
    const fVal = fDist[elem] / 10
    similarity += 1 - Math.abs(mVal - fVal)
  }
  score += Math.round((similarity - 2.5) * 10) // 相似度适中最好

  return Math.min(100, Math.max(0, score))
}

// ============================================================
// 关系模型判定
// ============================================================

function determineRelationshipModel(male: AnalysisResult, female: AnalysisResult): string {
  const mElem = STEM_ELEMENT[male.bazi.dayMaster]
  const fElem = STEM_ELEMENT[female.bazi.dayMaster]

  // 生克关系
  const generates = (a: FiveElement, b: FiveElement) =>
    (a === '木' && b === '火') || (a === '火' && b === '土') ||
    (a === '土' && b === '金') || (a === '金' && b === '水') || (a === '水' && b === '木')

  const controls = (a: FiveElement, b: FiveElement) =>
    (a === '木' && b === '土') || (a === '土' && b === '水') ||
    (a === '水' && b === '火') || (a === '火' && b === '金') || (a === '金' && b === '木')

  if (generates(mElem, fElem)) return '树木与土壤型（男滋养女）'
  if (generates(fElem, mElem)) return '土壤与树木型（女滋养男）'
  if (mElem === fElem) return '并蒂莲花型（同类相吸，亦生竞争）'
  if (controls(mElem, fElem)) return '导师与学生型（男主导女）'
  if (controls(fElem, mElem)) return '学生与导师型（女主导男）'

  return '山川与流水型（各行其道，彼此守望）'
}

// ============================================================
// 优劣分析
// ============================================================

function findAdvantages(male: AnalysisResult, female: AnalysisResult): string[] {
  const adv: string[] = []

  const mElem = STEM_ELEMENT[male.bazi.dayMaster]
  const fElem = STEM_ELEMENT[female.bazi.dayMaster]

  // 经济互助
  if (male.favorableElements.some(e => female.favorableElements.includes(e))) {
    adv.push('双方喜用神有重叠，事业方向可相互扶持，经济上能形成合力')
  }

  // 五行生入
  const mFav = male.favorableElements
  for (const elem of FIVE_ELEMENTS) {
    if (mFav.includes(elem) && female.fiveElementDistribution[elem] > 8) {
      adv.push(`女方${elem}气旺盛，恰好补充男方的五行缺憾，对男方的运势有明显的加持作用`)
      break
    }
  }

  const fFav = female.favorableElements
  for (const elem of FIVE_ELEMENTS) {
    if (fFav.includes(elem) && male.fiveElementDistribution[elem] > 8) {
      adv.push(`男方${elem}气旺盛，恰好补充女方的五行缺憾，对女方的运势有明显的加持作用`)
      break
    }
  }

  if (adv.length === 0) {
    adv.push('二人五行可互相调和，虽无惊艳之互补，亦可长相厮守')
  }

  return adv
}

function findWeaknesses(male: AnalysisResult, female: AnalysisResult): string[] {
  const weak: string[] = []

  const mMaster = male.bazi.dayMaster
  const fMaster = female.bazi.dayMaster

  // 男方比劫重 → 女方委屈
  let mBiJie = 0
  for (const p of [male.bazi.year, male.bazi.month, male.bazi.hour]) {
    if (p.tenGod === '比肩' || p.tenGod === '劫财') mBiJie++
  }
  if (mBiJie >= 2) {
    weak.push('男方比劫偏重，在关系中可能较为自我，女方容易产生情感上的委屈感和被忽视感')
  }

  // 女方伤官重 → 男方受压
  let fShangGuan = 0
  for (const p of [female.bazi.year, female.bazi.month, female.bazi.hour]) {
    if (p.tenGod === '伤官') fShangGuan++
  }
  if (fShangGuan >= 2) {
    weak.push('女方伤官旺盛，言辞犀利直接，男方可能会感到精神内耗和自尊受挫')
  }

  // 日月相冲
  const mDayBranch = male.bazi.day.branch
  const fDayBranch = female.bazi.day.branch
  const chongPairs: [EarthlyBranch, EarthlyBranch][] = [
    ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
  ]
  for (const [a, b] of chongPairs) {
    if ((mDayBranch === a && fDayBranch === b) || (mDayBranch === b && fDayBranch === a)) {
      weak.push('二人日支相冲，核心价值观和生活方式存在根本分歧，需格外用心经营')
      break
    }
  }

  if (weak.length === 0) {
    weak.push('双方整体互动良好，无明显软肋，但仍需在柴米油盐中保持初心')
  }

  return weak
}

// ============================================================
// 雷区预警
// ============================================================

function findWarnings(male: AnalysisResult, female: AnalysisResult): string[] {
  const warnings: string[] = []

  // 劫财年份预警
  const mDay = male.bazi.dayMaster
  const fDay = female.bazi.dayMaster

  // 今年流年简析
  const currentYear = new Date().getFullYear()
  const yearGanzhiIdx = ((currentYear - 1984) % 60 + 60) % 60
  const currentYearStem = HEAVENLY_STEMS[yearGanzhiIdx % 10]!

  // 检查是否有劫财克财的格局
  for (const p of [male.bazi.year, male.bazi.month, male.bazi.hour]) {
    if (p.tenGod === '劫财') {
      warnings.push('男方命局带劫财，需注意婚姻中因金钱或异性友人引发的信任危机')
      break
    }
  }

  for (const p of [female.bazi.year, female.bazi.month, female.bazi.hour]) {
    if (p.tenGod === '伤官') {
      warnings.push('女方命局带伤官，在特定流年（尤其是伤官见官之年）情绪波动大，易对关系造成冲击')
      break
    }
  }

  // 健康互克
  const mWeakest = Object.entries(male.fiveElementDistribution).sort((a, b) => a[1] - b[1])[0]!
  const fWeakest = Object.entries(female.fiveElementDistribution).sort((a, b) => a[1] - b[1])[0]!
  const controls = (a: string, b: string) =>
    (a === '木' && b === '土') || (a === '土' && b === '水') ||
    (a === '水' && b === '火') || (a === '火' && b === '金') || (a === '金' && b === '木')

  for (const p of [male.bazi.year, male.bazi.month, male.bazi.hour]) {
    if (controls(p.stemElement, fWeakest[0] as FiveElement)) {
      warnings.push(`男方命局${p.stemElement}气克女方最弱的${fWeakest[0]}，长期相处可能对女方健康产生不利影响`)
      break
    }
  }

  return warnings
}

// ============================================================
// 裁定
// ============================================================

function makeVerdict(total: number): { verdict: string; suggestion: string } {
  let verdict: string
  let suggestion: string

  if (total >= 85) {
    verdict = '上等婚配 — 天作之合'
    suggestion = '二人五行互补、性情相投，是难得的良缘。建议尽早确立关系，共同规划未来。相处之道在于"相敬如宾"，勿因过于顺畅而疏忽经营。'
  } else if (total >= 70) {
    verdict = '中上婚配 — 佳偶天成'
    suggestion = '整体匹配度良好，虽有小摩擦但无大碍。建议双方保持财务透明，每年安排一次共同旅行以增进情感连接。'
  } else if (total >= 55) {
    verdict = '中等婚配 — 互为磨炼'
    suggestion = '二人缘分不浅但需磨合，结婚后前三年为关键期。建议：① 有条件则尽量异地而居或保持各自独立空间；② 财务上各自独立管理，避免因经济观念不同激化矛盾。'
  } else if (total >= 40) {
    verdict = '中下婚配 — 露水红颜'
    suggestion = '缘分有限，若执意结合，需做好长期磨合的心理准备。建议：① 婚前同居试炼至少一年；② 签署婚前协议明确财产分配；③ 若已经在一起，考虑分房而居以减少冲突。'
  } else {
    verdict = '下等婚配 — 有缘无分'
    suggestion = '判官直言：此配对五行冲克严重，若强行结合，双方都会受到严重消耗。如已在一起，建议各自寻求专业婚姻咨询，或冷静审视关系是否值得继续。'
  }

  return { verdict, suggestion }
}

// ============================================================
// 合盘报告 Markdown 渲染
// ============================================================

export function renderCompatibilityReport(result: CompatibilityResult): string {
  const { male, female, scores } = result

  let md = `## ⚖️ 龙凤合鸣：${male.person.name} & ${female.person.name} 深度合盘报告\n\n`

  // 1. 能量磁场看板
  md += '### 1. 能量磁场看板\n\n'
  md += '| 维度 | 契合程度 | 判语 |\n'
  md += '|:---|:---|:---|\n'

  const starAttraction = scores.attraction >= 80 ? '⭐⭐⭐⭐⭐' : scores.attraction >= 65 ? '⭐⭐⭐⭐' : scores.attraction >= 50 ? '⭐⭐⭐' : '⭐⭐'
  const starStability = scores.stability >= 80 ? '⭐⭐⭐⭐⭐' : scores.stability >= 65 ? '⭐⭐⭐⭐' : scores.stability >= 50 ? '⭐⭐⭐' : '⭐⭐'
  const starComplement = scores.complement >= 80 ? '⭐⭐⭐⭐⭐' : scores.complement >= 65 ? '⭐⭐⭐⭐' : scores.complement >= 50 ? '⭐⭐⭐' : '⭐⭐'

  md += `| **天干吸引力** | ${starAttraction} | ${describeAttraction(male, female)} |\n`
  md += `| **地支稳定性** | ${starStability} | ${describeStability(male, female)} |\n`
  md += `| **五行互补性** | ${starComplement} | ${describeComplement(male, female)} |\n\n`

  // 2. 核心互动逻辑
  md += '### 2. 核心互动逻辑\n\n'
  md += `**关系模型：** ${result.relationshipModel}\n\n`

  md += '**优势：**\n'
  for (const adv of result.advantages) {
    md += `- ✅ ${adv}\n`
  }
  md += '\n'

  md += '**软肋：**\n'
  for (const w of result.weaknesses) {
    md += `- 💔 ${w}\n`
  }
  md += '\n'

  // 3. 雷区预警
  md += '### 3. 现实生活"雷区"预警\n\n'
  for (const warn of result.warnings) {
    md += `- ⚠️ ${warn}\n`
  }
  if (result.warnings.length === 0) {
    md += '未检测到明显的雷区配置，但仍需在相处中以诚相待。\n'
  }
  md += '\n'

  // 4. 判官终极裁定
  md += '### 4. 判官终极裁定\n\n'
  md += `| 项目 | 内容 |\n|:---|:---|\n`
  md += `| **合盘分** | **${scores.total}分** |\n`
  md += `| **定性** | ${result.verdict} |\n`
  md += `| **建议** | ${result.suggestion} |\n\n`

  return md
}

function describeAttraction(male: AnalysisResult, female: AnalysisResult): string {
  const mDay = male.bazi.dayMaster
  const fDay = female.bazi.dayMaster
  const hePairs: [HeavenlyStem, HeavenlyStem][] = [
    ['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸'],
  ]
  for (const [a, b] of hePairs) {
    if ((mDay === a && fDay === b) || (mDay === b && fDay === a)) {
      return `${mDay}${fDay}天干五合，天然亲近，吸引力极强`
    }
  }
  const mElem = STEM_ELEMENT[mDay]
  const fElem = STEM_ELEMENT[fDay]
  if (mElem === fElem) return '同类相聚，共鸣感强'
  return '各具特色，相处有新鲜感'
}

function describeStability(male: AnalysisResult, female: AnalysisResult): string {
  const mBranch = male.bazi.day.branch
  const fBranch = female.bazi.day.branch
  const liuHe: [EarthlyBranch, EarthlyBranch][] = [
    ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
  ]
  for (const [a, b] of liuHe) {
    if ((mBranch === a && fBranch === b) || (mBranch === b && fBranch === a)) {
      return `${mBranch}${fBranch}六合，生活默契极佳`
    }
  }
  const liuChong: [EarthlyBranch, EarthlyBranch][] = [
    ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
  ]
  for (const [a, b] of liuChong) {
    if ((mBranch === a && fBranch === b) || (mBranch === b && fBranch === a)) {
      return `${mBranch}${fBranch}六冲，核心分歧较大`
    }
  }
  return '无严重冲合，稳定性一般'
}

function describeComplement(male: AnalysisResult, female: AnalysisResult): string {
  const mFav = male.favorableElements
  const fDist = female.fiveElementDistribution
  const fFav = female.favorableElements
  const mDist = male.fiveElementDistribution

  for (const elem of FIVE_ELEMENTS) {
    if (mFav.includes(elem) && fDist[elem] > 8) {
      return `女补男${elem}，女方对男方运势加持明显`
    }
  }
  for (const elem of FIVE_ELEMENTS) {
    if (fFav.includes(elem) && mDist[elem] > 8) {
      return `男补女${elem}，男方对女方运势加持明显`
    }
  }
  return '五行互补性适中'
}

// ============================================================
// 增强合盘分析：性格、财富、互助
// ============================================================

interface PersonalityCompat {
  score: number
  summary: string
  strengths: string[]
  conflicts: string[]
}

interface WealthCompat {
  score: number
  summary: string
  maleEffect: string
  femaleEffect: string
  advice: string
}

interface BenefitAnalysis {
  maleToFemale: string[]
  femaleToMale: string[]
  overall: string
}

export function analyzePersonalityCompatibility(male: AnalysisResult, female: AnalysisResult): PersonalityCompat {
  const mElem = STEM_ELEMENT[male.bazi.dayMaster]
  const fElem = STEM_ELEMENT[female.bazi.dayMaster]
  const mMonthGod = male.bazi.month.tenGod
  const fMonthGod = female.bazi.month.tenGod

  let score = 60
  const strengths: string[] = []
  const conflicts: string[] = []

  // 五行性格契合
  const generates = (a: FiveElement, b: FiveElement) =>
    (a === '木' && b === '火') || (a === '火' && b === '土') ||
    (a === '土' && b === '金') || (a === '金' && b === '水') || (a === '水' && b === '木')

  if (generates(mElem, fElem)) {
    score += 15
    strengths.push(`男方${mElem}性人格天然滋养女方${fElem}性人格，相处中男方更有耐心和包容力`)
  } else if (generates(fElem, mElem)) {
    score += 15
    strengths.push(`女方${fElem}性人格天然滋养男方${mElem}性人格，女方在关系中更包容智慧`)
  } else if (mElem === fElem) {
    score += 8
    strengths.push('同五行人格，三观底色一致，沟通成本低')
    conflicts.push('同质性过高，激情期后可能缺乏新鲜感，需主动创造变化')
  }

  // 控制关系检测
  const controls = (a: FiveElement, b: FiveElement) =>
    (a === '木' && b === '土') || (a === '土' && b === '水') ||
    (a === '水' && b === '火') || (a === '火' && b === '金') || (a === '金' && b === '木')

  if (controls(mElem, fElem)) {
    score -= 10
    conflicts.push(`男方${mElem}克女方${fElem}，关系中男方可能过于强势，女方长期可能感到压抑`)
  }
  if (controls(fElem, mElem)) {
    score -= 10
    conflicts.push(`女方${fElem}克男方${mElem}，女方可能在关系中占主导，男方需适应`)
  }

  // 十神互动
  const mBiJie = mMonthGod === '比肩' || mMonthGod === '劫财'
  const fShangGuan = fMonthGod === '伤官'

  if (mBiJie && fShangGuan) {
    conflicts.push('男方比劫重+女方伤官旺，是典型的"火星撞地球"组合，争吵激烈但感情也深')
    strengths.push('双方都不记仇，吵架后恢复快，感情浓度高')
  }

  if (mMonthGod === '正官' && (fMonthGod === '正印' || fMonthGod === '偏印')) {
    strengths.push('男官女印，传统恩爱夫妻模式，男方有担当、女方善理家')
    score += 10
  }

  if ((mMonthGod === '正财' || mMonthGod === '偏财') && (fMonthGod === '正官' || fMonthGod === '偏官')) {
    strengths.push('男财女官，男主外女主内的经典搭配，家庭分工明确')
    score += 8
  }

  score = Math.min(100, Math.max(0, score))

  const summary = score >= 80
    ? '性格高度契合，灵魂伴侣级别的匹配'
    : score >= 65
    ? '性格较为契合，互补大于冲突，是合适的伴侣'
    : score >= 50
    ? '性格有一定差异，需要双方各退一步、用心经营'
    : '性格冲突明显，相处需极大耐心和智慧，不建议闪婚'

  return { score, summary, strengths, conflicts }
}

export function analyzeWealthCompatibility(male: AnalysisResult, female: AnalysisResult): WealthCompat {
  let score = 60

  // 男方财星分析
  let mCaiCount = 0
  for (const p of [male.bazi.year, male.bazi.month, male.bazi.hour]) {
    if (p.tenGod === '正财' || p.tenGod === '偏财') mCaiCount++
  }

  // 女方财星分析
  let fCaiCount = 0
  for (const p of [female.bazi.year, female.bazi.month, female.bazi.hour]) {
    if (p.tenGod === '正财' || p.tenGod === '偏财') fCaiCount++
  }

  // 劫财检测（破财之星）
  let mJieCai = false
  let fJieCai = false
  for (const p of [male.bazi.year, male.bazi.month, male.bazi.hour]) {
    if (p.tenGod === '劫财') mJieCai = true
  }
  for (const p of [female.bazi.year, female.bazi.month, female.bazi.hour]) {
    if (p.tenGod === '劫财') fJieCai = true
  }

  let maleEffect = ''
  let femaleEffect = ''

  // 女方对男方财运的影响
  const fElem = STEM_ELEMENT[female.bazi.dayMaster]
  const mFav = male.favorableElements

  if (mFav.includes(fElem)) {
    score += 12
    maleEffect = `女方日主${fElem}恰好是男方的喜用神，婚后对男方的财运有明显的正面加持。女方是男方的"财星贵人"，在一起后男方事业往往蒸蒸日上。`
  } else if (male.unfavorableElements.includes(fElem)) {
    score -= 12
    maleEffect = `女方日主${fElem}是男方的忌神，可能在一定程度上消耗男方的财运。但这可以通过财务管理方式的调整来化解。`
  } else {
    maleEffect = '女方对男方财运的影响中性，不会明显助益也不会明显损耗。'
  }

  // 男方对女方财运的影响
  const mElem = STEM_ELEMENT[male.bazi.dayMaster]
  const fFav = female.favorableElements

  if (fFav.includes(mElem)) {
    score += 12
    femaleEffect = `男方日主${mElem}恰好是女方的喜用神，男方能给女方带来安全感和经济上的稳定支持。`
  } else if (female.unfavorableElements.includes(mElem)) {
    score -= 12
    femaleEffect = `男方日主${mElem}是女方的忌神，建议女方在关系中保持一定的财务独立性，不完全依赖男方。`
  } else {
    femaleEffect = '男方对女方财运的影响中性。'
  }

  // 劫财预警
  if (mJieCai && fJieCai) {
    score -= 15
  } else if (mJieCai || fJieCai) {
    score -= 5
  }

  score = Math.min(100, Math.max(0, score))

  const summary = score >= 75
    ? '财运契合度高，1+1>2 的财富效应。双方在一起后经济状况将显著改善'
    : score >= 55
    ? '财运契合度中等，需要明确的财务规划和分工来避免矛盾'
    : '财运配置有冲突风险，强烈建议实行财务独立或签署婚前协议'

  const advice = mJieCai && fJieCai
    ? '双方都带劫财，财务上务必透明公开，建议设立共同账户+各自独立账户的双轨制，大额支出需双方共同商议'
    : '建议设立清晰的财务分工：一方管日常开支，一方管长期投资，避免因消费观念不同产生摩擦'

  return { score, summary, maleEffect, femaleEffect, advice }
}

export function analyzeMutualBenefit(male: AnalysisResult, female: AnalysisResult): BenefitAnalysis {
  const maleToFemale: string[] = []
  const femaleToMale: string[] = []

  const mElem = STEM_ELEMENT[male.bazi.dayMaster]
  const fElem = STEM_ELEMENT[female.bazi.dayMaster]
  const mFav = male.favorableElements
  const fFav = female.favorableElements
  const mDist = male.fiveElementDistribution
  const fDist = female.fiveElementDistribution

  // 五行补给方向
  for (const elem of FIVE_ELEMENTS) {
    if (mFav.includes(elem) && fDist[elem] > 7) {
      femaleToMale.push(`女方的**${elem}**气旺盛（${fDist[elem]!.toFixed(1)}分），恰好补足男方的五行缺憾，对男方的**健康**和**事业**有直接的正面影响`)
    }
    if (fFav.includes(elem) && mDist[elem] > 7) {
      maleToFemale.push(`男方的**${elem}**气旺盛（${mDist[elem]!.toFixed(1)}分），恰好补足女方的五行缺憾，对女方的**情绪稳定**和**财运**有积极促进作用`)
    }
  }

  // 十神层面的互助
  const mMonthGod = male.bazi.month.tenGod
  const fMonthGod = female.bazi.month.tenGod

  if (mMonthGod === '正官' || mMonthGod === '偏官') {
    femaleToMale.push('男方官杀重、压力大，女方的存在能帮助男方释放压力、找到生活的柔软面')
  }
  if (fMonthGod === '正印' || fMonthGod === '偏印') {
    maleToFemale.push('女方印星重、思虑多，男方的果断和行动力能帮助女方走出过度思考的困境')
  }
  if (mMonthGod === '伤官') {
    femaleToMale.push('男方伤官旺、锋芒毕露，女方若能包容其锐气，男方在事业上将所向披靡')
  }
  if (fMonthGod === '伤官') {
    maleToFemale.push('女方伤官旺、才华横溢，男方若能欣赏而非压制，女方的创造力会带来意想不到的财富')
  }

  // 如果没有找到明显的互助
  if (femaleToMale.length === 0 && maleToFemale.length === 0) {
    femaleToMale.push('两方五行分布较为独立，互助效应不明显，需要更多后天经营')
    maleToFemale.push('两方五行分布较为独立，互助效应不明显，需要更多后天经营')
  }

  // 总体
  const totalHelp = femaleToMale.length + maleToFemale.length
  const overall = totalHelp >= 4
    ? '双方互助效应显著，是彼此生命中的贵人。在一起不仅能相互成就，还能共同创造远超个人的价值。'
    : totalHelp >= 2
    ? '存在一定的互助效应，某些方面能互相补足。但也有一些领域需要各自独立发展。'
    : '互助效应有限，这段关系更像是一场各自修行的旅程，而非相互成就的联姻。'

  return { maleToFemale, femaleToMale, overall }
}

// ============================================================
// 大运同步分析
// ============================================================

export function analyzeFortuneSync(
  male: AnalysisResult,
  female: AnalysisResult,
): {
  currentSync: string
  nextFortuneSync: string
  description: string
} {
  const mCurrent = male.currentFortune
  const fCurrent = female.currentFortune

  // 喜忌判定辅助
  function isFav(f: BigFortune, fav: FiveElement[]): boolean {
    return fav.includes(f.element)
  }

  const mFav = mCurrent ? isFav(mCurrent, male.favorableElements) : null
  const fFav = fCurrent ? isFav(fCurrent, female.favorableElements) : null

  let currentSync = ''
  if (mFav === null || fFav === null) {
    currentSync = '数据不足，无法判定当前大运同步性'
  } else if (mFav && fFav) {
    currentSync = '同吉——双方当前大运皆行喜用神运，事业生活同步向上，关系稳固期'
  } else if (!mFav && !fFav) {
    currentSync = '同凶——双方当前大运皆有挑战，虽运程不佳但能同甘共苦，关系反而在逆境中加深'
  } else {
    const whoUp = mFav ? '男方' : '女方'
    currentSync = `一吉一凶——${whoUp}运势上升而另一方平淡，需注意差距拉大带来的心理不平衡，是关系的考验期`
  }

  // 下一大运同步性（简单预判）
  const mBigFortunes = male.bigFortunes
  const fBigFortunes = female.bigFortunes
  const mNext = mBigFortunes.find(f => f.startAge > (mCurrent?.endAge || 0))
  const fNext = fBigFortunes.find(f => f.startAge > (fCurrent?.endAge || 0))
  const mNextFav = mNext ? isFav(mNext, male.favorableElements) : null
  const fNextFav = fNext ? isFav(fNext, female.favorableElements) : null

  let nextFortuneSync = ''
  if (mNextFav === null || fNextFav === null) {
    nextFortuneSync = '下一大运信息不足'
  } else if (mNextFav && fNextFav) {
    nextFortuneSync = '下一大运双方同入佳境，关系有望更进一步'
  } else {
    nextFortuneSync = '下一大运双方走势分化，建议提前沟通预期，做好心理准备'
  }

  // 综合描述
  const description = [
    `当前大运：${currentSync}`,
    `下一大运：${nextFortuneSync}`,
    mCurrent && fCurrent
      ? `男方正行${mCurrent.stem}${mCurrent.branch}（${mCurrent.tenGod}运，${mCurrent.startAge}-${mCurrent.endAge}岁），女方正行${fCurrent.stem}${fCurrent.branch}（${fCurrent.tenGod}运，${fCurrent.startAge}-${fCurrent.endAge}岁）`
      : '',
  ].filter(Boolean).join('。')

  return { currentSync, nextFortuneSync, description }
}

// ============================================================
// 评分明细透明化
// ============================================================

export function computeScoreBreakdown(
  male: AnalysisResult,
  female: AnalysisResult,
  scores: { attraction: number; stability: number; complement: number },
): CompatibilityResult['scoreBreakdown'] {
  const mDay = male.bazi.dayMaster
  const fDay = female.bazi.dayMaster
  const mElem = STEM_ELEMENT[mDay]
  const fElem = STEM_ELEMENT[fDay]

  // 天干吸引力明细
  const hePairs: [HeavenlyStem, HeavenlyStem][] = [
    ['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸'],
  ]
  const isHe = hePairs.some(([a, b]) => (mDay === a && fDay === b) || (mDay === b && fDay === a))
  const isSameElem = mElem === fElem
  const isMaleGene = (mElem === '木' && fElem === '火') || (mElem === '火' && fElem === '土') || (mElem === '土' && fElem === '金') || (mElem === '金' && fElem === '水') || (mElem === '水' && fElem === '木')
  const isMaleCtrl = (mElem === '木' && fElem === '土') || (mElem === '火' && fElem === '金') || (mElem === '土' && fElem === '水') || (mElem === '金' && fElem === '木') || (mElem === '水' && fElem === '火')

  const attractionBreakdown = {
    factors: [
      { name: '基础分', contribution: 60, reason: '所有配对的基础分' },
      ...(isHe ? [{ name: '天干五合', contribution: 30, reason: `${mDay}${fDay}天干五合，天然吸引力极强` }] : []),
      ...(isSameElem ? [{ name: '五行相同', contribution: 10, reason: `同为${mElem}，共鸣感强` }] : []),
      ...(isMaleGene ? [{ name: '相生加成', contribution: 20, reason: `男${mElem}生女${fElem}，男滋养女` }] : []),
      ...(isMaleCtrl ? [{ name: '相克扣分', contribution: -15, reason: `男${mElem}克女${fElem}，需注意相处方式` }] : []),
    ],
    methodology: '基础60分 + 天干五合(+30) / 相生(+20) / 同五行(+10) / 相克(-15)，上限100分',
  }

  // 地支稳定性明细
  const mBranches = [male.bazi.year.branch, male.bazi.month.branch, male.bazi.day.branch, male.bazi.hour.branch]
  const fBranches = [female.bazi.year.branch, female.bazi.month.branch, female.bazi.day.branch, female.bazi.hour.branch]
  const liuHe: [EarthlyBranch, EarthlyBranch][] = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']]
  const liuChong: [EarthlyBranch, EarthlyBranch][] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]

  let heBonus = 0
  let chongPenalty = 0
  for (const mb of [male.bazi.day.branch]) {
    for (const fb of [female.bazi.day.branch]) {
      if (liuHe.some(([a, b]) => (mb === a && fb === b) || (mb === b && fb === a))) heBonus = 25
      if (liuChong.some(([a, b]) => (mb === a && fb === b) || (mb === b && fb === a))) chongPenalty = -30
    }
  }

  const stabilityBreakdown = {
    factors: [
      { name: '基础分', contribution: 50, reason: '所有配对的基础分' },
      ...(heBonus !== 0 ? [{ name: '日支六合', contribution: heBonus, reason: `双方日支六合，情感根基稳固` }] : []),
      ...(chongPenalty !== 0 ? [{ name: '日支六冲', contribution: chongPenalty, reason: '双方日支相冲，日常摩擦较多' }] : []),
    ],
    methodology: '基础50分 + 日支六合(+25) / 日支六冲(-30) / 其他刑害(-10~-15)，上限100分',
  }

  // 五行互补性明细
  let complementBonus = 0
  const complementReasons: string[] = []
  for (const fav of male.favorableElements) {
    if (female.fiveElementDistribution[fav] > 8) {
      complementBonus += 10
      complementReasons.push(`女方${fav}旺(${female.fiveElementDistribution[fav]?.toFixed(1)}分)补男方喜用`)
    }
  }
  for (const fav of female.favorableElements) {
    if (male.fiveElementDistribution[fav] > 8) {
      complementBonus += 10
      complementReasons.push(`男方${fav}旺(${male.fiveElementDistribution[fav]?.toFixed(1)}分)补女方喜用`)
    }
  }

  const complementBreakdown = {
    factors: [
      { name: '基础分', contribution: 50, reason: '所有配对的基础分' },
      ...complementReasons.map((r, i) => ({ name: `互补项${i + 1}`, contribution: 10, reason: r })),
    ],
    methodology: '基础50分 + 喜用神互补(每项+10) + 五行分布相似度调整(-10~+10)，上限100分',
  }

  return {
    attraction: attractionBreakdown,
    stability: stabilityBreakdown,
    complement: complementBreakdown,
  }
}

// ============================================================
// 增强版合盘报告 — 8大模块
// ============================================================

/** 增强版合盘报告，包含性格、财富、互助分析 */
export function renderEnhancedCompatibilityReport(result: CompatibilityResult): string {
  const { male, female, scores } = result
  const pers = analyzePersonalityCompatibility(male, female)
  const wealth = analyzeWealthCompatibility(male, female)
  const benefit = analyzeMutualBenefit(male, female)
  const breakdown = result.scoreBreakdown || computeScoreBreakdown(male, female, scores)
  const fortune = result.fortuneSync

  let md = `# ⚖️ 龙凤合鸣：${male.person.name} & ${female.person.name} 深度合盘报告\n\n`

  // ========== 1. 双方命盘概览 ==========
  md += '## 一、双方命盘概览\n\n'

  md += '### 📅 八字排盘对比\n\n'
  md += '| 柱位 | 甲方 | 乙方 |\n|:---|:---|:---|\n'
  const pillarLabels = ['年柱', '月柱', '日柱', '时柱']
  const mPillars = [male.bazi.year, male.bazi.month, male.bazi.day, male.bazi.hour]
  const fPillars = [female.bazi.year, female.bazi.month, female.bazi.day, female.bazi.hour]
  for (let i = 0; i < 4; i++) {
    md += `| **${pillarLabels[i]!}** | ${mPillars[i]!.stem}${mPillars[i]!.branch}（${mPillars[i]!.tenGod}） | ${fPillars[i]!.stem}${fPillars[i]!.branch}（${fPillars[i]!.tenGod}） |\n`
  }
  md += '\n'

  md += '### 🔢 五行能量对比\n\n'
  md += '| 五行 | 甲方 | 乙方 |\n|:---|:---|:---|\n'
  for (const elem of FIVE_ELEMENTS) {
    const mv = male.fiveElementDistribution[elem] || 0
    const fv = female.fiveElementDistribution[elem] || 0
    md += `| ${elem} | ${mv.toFixed(1)} | ${fv.toFixed(1)} |\n`
  }
  md += '\n'

  // 格局/用神/身强弱对比
  md += '| 项目 | 甲方 | 乙方 |\n|:---|:---|:---|\n'
  md += `| **日主** | ${male.bazi.dayMaster}（${male.bazi.dayMasterElement}·${male.bazi.dayMasterYinYang}） | ${female.bazi.dayMaster}（${female.bazi.dayMasterElement}·${female.bazi.dayMasterYinYang}） |\n`
  md += `| **格局** | ${male.geJu} | ${female.geJu} |\n`
  md += `| **旺衰** | ${male.bodyStrength} | ${female.bodyStrength} |\n`
  md += `| **喜用神** | ${male.favorableElements.join('、')} | ${female.favorableElements.join('、')} |\n`
  md += `| **忌神** | ${male.unfavorableElements.join('、')} | ${female.unfavorableElements.join('、')} |\n\n`

  // ========== 2. 乾坤定盘对比 ==========
  md += '## 二、乾坤定盘对比\n\n'

  // 冲突与互补分析
  const sharedUnfav = male.unfavorableElements.filter(e => female.unfavorableElements.includes(e))
  const sharedFav = male.favorableElements.filter(e => female.favorableElements.includes(e))

  if (sharedUnfav.length > 0) {
    md += `> ⚠️ **核心冲突：** 双方忌神叠加（${sharedUnfav.join('、')}），在这些五行对应的领域容易出现互不相让的局面。\n\n`
  }
  if (sharedFav.length > 0) {
    md += `> ✅ **核心互补：** 双方喜用神重合（${sharedFav.join('、')}），在关键领域有共同的追求和价值观。\n\n`
  }

  // 女方是否补男方
  let femaleSuppMale = ''
  for (const fav of male.favorableElements) {
    if (female.fiveElementDistribution[fav] > 6) {
      femaleSuppMale += `女方${fav}旺，天然补益男方；`
    }
  }
  let maleSuppFemale = ''
  for (const fav of female.favorableElements) {
    if (male.fiveElementDistribution[fav] > 6) {
      maleSuppFemale += `男方${fav}旺，天然补益女方；`
    }
  }
  if (femaleSuppMale) md += `- 女方→男方：${femaleSuppMale}\n`
  if (maleSuppFemale) md += `- 男方→女方：${maleSuppFemale}\n`
  if (!femaleSuppMale && !maleSuppFemale) md += '双方五行互不显著补益，需各自修炼。\n'
  md += '\n'

  // ========== 3. 性格适配分析 ==========
  md += '## 三、性格适配分析\n\n'
  md += `> **契合评分：** ${pers.score}分 — ${pers.summary}\n\n`

  if (pers.strengths.length > 0) {
    md += '**契合优势：**\n'
    for (const s of pers.strengths) md += `- ✅ ${s}\n`
    md += '\n'
  }
  if (pers.conflicts.length > 0) {
    md += '**潜在冲突：**\n'
    for (const c of pers.conflicts) md += `- ⚠️ ${c}\n`
    md += '\n'
  }

  // ========== 4. 健康五行交互 ==========
  md += '## 四、健康五行交互\n\n'

  const mWeak = FIVE_ELEMENTS.filter(e => male.fiveElementDistribution[e] < 3)
  const fWeak = FIVE_ELEMENTS.filter(e => female.fiveElementDistribution[e] < 3)
  const sharedWeak = mWeak.filter(e => fWeak.includes(e))
  const fSupplementsM = mWeak.filter(e => female.fiveElementDistribution[e] > 6)
  const mSupplementsF = fWeak.filter(e => male.fiveElementDistribution[e] > 6)

  if (sharedWeak.length > 0) {
    md += `> ⚠️ **共同薄弱五行：** ${sharedWeak.join('、')}——双方都需要关注这些五行对应的身体系统。\n\n`
  }
  if (fSupplementsM.length > 0) {
    md += `- 女方${fSupplementsM.join('、')}气较旺，可在生活方式上补益男方对应的薄弱领域\n`
  }
  if (mSupplementsF.length > 0) {
    md += `- 男方${mSupplementsF.join('、')}气较旺，可在生活方式上补益女方对应的薄弱领域\n`
  }
  if (sharedWeak.length === 0 && fSupplementsM.length === 0 && mSupplementsF.length === 0) {
    md += '双方五行分布相对独立，健康层面互不影响较大。\n'
  }
  md += '\n'

  // ========== 5. 事业合盘 ==========
  md += '## 五、事业合盘\n\n'

  const mInd = male.favorableElements.flatMap(e => getIndustryByElem(e))
  const fInd = female.favorableElements.flatMap(e => getIndustryByElem(e))
  const sharedInd = mInd.filter(i => fInd.includes(i)).slice(0, 4)

  if (sharedInd.length > 0) {
    md += `**共同适配行业：** ${sharedInd.join('、')}\n\n`
    md += '双方行业方向有交集，可考虑共同创业或在同领域发展。\n\n'
  } else {
    md += '双方适配行业方向不同，建议各自发展、互补支持而非强求同路。\n\n'
  }

  md += `**甲方财运：** ${wealth.maleEffect}\n\n`
  md += `**乙方财运：** ${wealth.femaleEffect}\n\n`
  md += `**财务建议：** ${wealth.advice}\n\n`

  // ========== 6. 家庭背景匹配 ==========
  md += '## 六、家庭背景匹配\n\n'

  // 父母宫关系
  const mYearGod = male.bazi.year.tenGod
  const fYearGod = female.bazi.year.tenGod
  const mMonthGod = male.bazi.month.tenGod
  const fMonthGod = female.bazi.month.tenGod

  md += `甲方年柱${male.bazi.year.stem}${male.bazi.year.branch}（${mYearGod}），月柱${male.bazi.month.stem}${male.bazi.month.branch}（${mMonthGod}）；`
  md += `乙方年柱${female.bazi.year.stem}${female.bazi.year.branch}（${fYearGod}），月柱${female.bazi.month.stem}${female.bazi.month.branch}（${fMonthGod}）。\n\n`

  // 地支关系检测
  const yearChong = (() => {
    const chong: [EarthlyBranch, EarthlyBranch][] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]
    for (const [a, b] of chong) {
      if ((male.bazi.year.branch === a && female.bazi.year.branch === b) || (male.bazi.year.branch === b && female.bazi.year.branch === a)) return true
    }
    return false
  })()
  const monthChong = (() => {
    const chong: [EarthlyBranch, EarthlyBranch][] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]
    for (const [a, b] of chong) {
      if ((male.bazi.month.branch === a && female.bazi.month.branch === b) || (male.bazi.month.branch === b && female.bazi.month.branch === a)) return true
    }
    return false
  })()

  if (yearChong) md += '- ⚠️ 双方年柱地支相冲，祖辈或家庭背景可能存在较大差异，需互相包容\n'
  if (monthChong) md += '- ⚠️ 双方月柱地支相冲，父母辈互动可能有摩擦，需双方居中调和\n'
  if (!yearChong && !monthChong) md += '- 双方父母宫地支无明显冲突，家庭背景融合相对顺利\n'
  md += '\n'

  // ========== 7. 大运同步分析 ==========
  md += '## 七、大运同步分析\n\n'
  if (fortune) {
    md += `**当前同步性：** ${fortune.currentSync}\n\n`
    md += `**下一大运：** ${fortune.nextFortuneSync}\n\n`
    md += `${fortune.description}\n\n`
  } else {
    md += '大运同步数据待计算。\n\n'
  }

  // ========== 8. 能量磁场看板 + 判官终裁 ==========
  md += '## 八、能量磁场看板 & 判官终裁\n\n'

  // 评分明细
  md += '### 📊 合盘评分明细\n\n'
  const starAttraction = scores.attraction >= 80 ? '⭐⭐⭐⭐⭐' : scores.attraction >= 65 ? '⭐⭐⭐⭐' : scores.attraction >= 50 ? '⭐⭐⭐' : '⭐⭐'
  const starStability = scores.stability >= 80 ? '⭐⭐⭐⭐⭐' : scores.stability >= 65 ? '⭐⭐⭐⭐' : scores.stability >= 50 ? '⭐⭐⭐' : '⭐⭐'
  const starComplement = scores.complement >= 80 ? '⭐⭐⭐⭐⭐' : scores.complement >= 65 ? '⭐⭐⭐⭐' : scores.complement >= 50 ? '⭐⭐⭐' : '⭐⭐'

  md += '| 维度 | 评分 | 方法论 |\n|:---|:---|:---|\n'
  md += `| **天干吸引力** | ${starAttraction} ${scores.attraction}分 | ${breakdown?.attraction?.methodology || '—'} |\n`
  md += `| **地支稳定性** | ${starStability} ${scores.stability}分 | ${breakdown?.stability?.methodology || '—'} |\n`
  md += `| **五行互补性** | ${starComplement} ${scores.complement}分 | ${breakdown?.complement?.methodology || '—'} |\n`
  md += `| **综合评分** | **${scores.total}分** | 三维度等权平均 |\n\n`

  // 优势/软肋
  md += '### ✅ 核心优势\n\n'
  for (const adv of result.advantages) md += `- ${adv}\n`
  md += '\n'
  md += '### ⚠️ 需关注的点\n\n'
  for (const w of result.weaknesses) md += `- ${w}\n`
  md += '\n'

  // 判官终裁
  md += '### ⚖️ 判官终裁\n\n'
  md += `| 项目 | 内容 |\n|:---|:---|\n`
  md += `| **合盘分** | **${scores.total}分** |\n`
  md += `| **定性** | ${result.verdict} |\n`
  md += `| **建议** | ${result.suggestion} |\n\n`

  return md
}

/** 辅助：五行→行业映射（用于事业合盘） */
function getIndustryByElem(elem: FiveElement): string[] {
  const map: Record<FiveElement, string[]> = {
    '木': ['教育/培训', '文化传媒', '出版/写作', '医药/健康', '环保/林业', '设计/艺术'],
    '火': ['互联网/科技', '能源/电力', '餐饮/食品', '娱乐/影视', '市场营销'],
    '土': ['房地产/建筑', '金融/银行', '农业/畜牧', '仓储/物流', '酒店/旅游'],
    '金': ['机械/制造', '汽车/交通', '法律/司法', '审计/会计', '精密仪器'],
    '水': ['水利/海洋', '贸易/物流', '旅游/导游', '心理咨询', '广告/策划'],
  }
  return map[elem] || []
}
