/**
 * 六亲分析规则引擎
 *
 * 原则：只输出八字能告诉你的信息，不输出八字不能告诉你的信息
 * 父星/母星的状态由规则精确计算，禁止编造具体生活情节
 *
 * 来源：《渊海子平》六亲篇 + 《三命通会》论六亲
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement, TenGod } from '../constants'
import { STEM_ELEMENT, BRANCH_ELEMENT, HIDDEN_STEMS, getTenGod, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../constants'
import type { BaziChart, Pillar } from '../types'

// ============================================================
// 类型定义
// ============================================================

export type StarStatus = '受生' | '得地' | '受克' | '伏藏' | '无'

export interface RelativeDetail {
  starPosition: string
  starStemBranch: string
  starTenGod: string
  starStatus: StarStatus
  relationship: string
}

export interface ParentsPalaceAnalysis {
  yearAnalysis: string
  monthAnalysis: string
  chongHe: string[]
  warning?: string
}

export interface SiblingAnalysis {
  biJieCount: number
  interpretation: string
}

export interface SixRelativesResult {
  father: RelativeDetail
  mother: RelativeDetail
  parentsPalace: ParentsPalaceAnalysis
  siblings: SiblingAnalysis
}

// ============================================================
// 五行生克辅助
// ============================================================

const GENERATES: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const CONTROLS: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

// ============================================================
// 核心函数
// ============================================================

/**
 * 定位父星
 *
 * 规则：男命偏财为父（无偏财看正财），女命正财为父（无正财看偏财）
 * 父星状态：被克=受克，在地支藏干=伏藏，在四柱天干=得地，得生=受生，局中全无=无
 */
export function locateFather(bazi: BaziChart, gender: '男' | '女'): RelativeDetail {
  const fatherGod: TenGod = gender === '男' ? '偏财' : '正财'
  const fatherAlt: TenGod = gender === '男' ? '正财' : '偏财'
  return locateStar(bazi, fatherGod, fatherAlt, '父星')
}

/** 定位母星 */
export function locateMother(bazi: BaziChart, gender: '男' | '女'): RelativeDetail {
  const motherGod: TenGod = gender === '男' ? '正印' : '偏印'
  const motherAlt: TenGod = gender === '男' ? '偏印' : '正印'
  return locateStar(bazi, motherGod, motherAlt, '母星')
}

function locateStar(
  bazi: BaziChart,
  primaryGod: TenGod,
  altGod: TenGod,
  label: string,
): RelativeDetail {
  // 1. 在天干中查找（四柱天干）
  const pillars: [string, Pillar][] = [
    ['年柱', bazi.year], ['月柱', bazi.month],
    ['日柱', bazi.day], ['时柱', bazi.hour],
  ]

  for (const [pos, p] of pillars) {
    if (p.tenGod === primaryGod || p.tenGod === altGod) {
      const status = judgeStarStatus(bazi, pos, p)
      const rel = buildRelationship(label, pos, `${p.stem}${p.branch}`, p.tenGod, status, bazi)
      return { starPosition: pos, starStemBranch: `${p.stem}${p.branch}`, starTenGod: p.tenGod, starStatus: status, relationship: rel }
    }
  }

  // 2. 在藏干中查找
  for (const [pos, p] of pillars) {
    for (const hd of p.hiddenStems) {
      const god = getTenGod(bazi.dayMaster, hd as HeavenlyStem)
      if (god === primaryGod || god === altGod) {
        const isControlled = CONTROLS[STEM_ELEMENT[p.stem]] === STEM_ELEMENT[hd as HeavenlyStem]
        const status: StarStatus = isControlled ? '受克' : '伏藏'
        const rel = isControlled
          ? `${pos}${hd}${god}伏藏且被天干${p.stem}所克，${label}受制`
          : `${pos}藏干${hd}（${god}），${label}伏藏不显`
        return { starPosition: `${pos}藏干`, starStemBranch: `${p.stem}${p.branch}(${hd})`, starTenGod: god, starStatus: status, relationship: rel }
      }
    }
  }

  // 3. 局中全无此星
  // 检查是否有克星的克制（如：财旺克印 → 母星不显但被克）
  if (label === '母星') {
    let caiCount = 0
    for (const [, p] of pillars) {
      if (p.tenGod === '正财' || p.tenGod === '偏财') caiCount++
    }
    if (caiCount >= 2) {
      return {
        starPosition: '无',
        starStemBranch: '',
        starTenGod: '正印/偏印',
        starStatus: '受克',
        relationship: `局中财星重重（${caiCount}处），财旺克印，${label}受克不显。`,
      }
    }
  }

  if (label === '父星') {
    let biJieCount = 0
    for (const [, p] of pillars) {
      if (p.tenGod === '比肩' || p.tenGod === '劫财') biJieCount++
    }
    if (biJieCount >= 2) {
      return {
        starPosition: '无',
        starStemBranch: '',
        starTenGod: '偏财/正财',
        starStatus: '受克',
        relationship: `局中比劫重重（${biJieCount}处），比劫夺财，${label}受克不显。`,
      }
    }
  }

  return {
    starPosition: '无',
    starStemBranch: '',
    starTenGod: primaryGod,
    starStatus: '无',
    relationship: `${label}在局中不显，对命主直接影响较小。`,
  }
}

/** 判断星的状态 */
function judgeStarStatus(bazi: BaziChart, position: string, pillar: Pillar): StarStatus {
  // 检查是否被邻柱天干克制
  const nearbyStems: HeavenlyStem[] = []
  if (position === '年柱') nearbyStems.push(bazi.month.stem)
  else if (position === '月柱') { nearbyStems.push(bazi.year.stem); nearbyStems.push(bazi.day.stem) }
  else if (position === '日柱') { nearbyStems.push(bazi.month.stem); nearbyStems.push(bazi.hour.stem) }
  else if (position === '时柱') nearbyStems.push(bazi.day.stem)

  for (const ns of nearbyStems) {
    if (CONTROLS[STEM_ELEMENT[ns]] === STEM_ELEMENT[pillar.stem]) return '受克'
    if (GENERATES[STEM_ELEMENT[ns]] === STEM_ELEMENT[pillar.stem]) return '受生'
  }

  return '得地'
}

function buildRelationship(
  label: string, position: string, ganzhi: string,
  god: string, status: StarStatus, bazi: BaziChart,
): string {
  switch (status) {
    case '受克':
      return `${position}${ganzhi}（${god}），${label}受邻柱克制，主${label === '父星' ? '父缘浅薄' : '母亲辛劳'}`;
    case '受生':
      return `${position}${ganzhi}（${god}），${label}得邻柱生助，主${label === '父星' ? '父亲运势较顺' : '母亲较为安乐'}`;
    case '得地':
      return `${position}${ganzhi}（${god}），${label}在局中得地，对命主有显著影响`;
    default:
      return `${position}${ganzhi}（${god}），${label}有根`;
  }
}

// ============================================================
// 父母宫分析
// ============================================================

export function analyzeParentsPalace(bazi: BaziChart): ParentsPalaceAnalysis {
  const chongHe: string[] = []

  const CHONG: Record<string, string> = {
    '子': '午', '午': '子', '丑': '未', '未': '丑',
    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
  }

  if (CHONG[bazi.year.branch] === bazi.month.branch) {
    chongHe.push(`年月相冲（${bazi.year.branch}${bazi.month.branch}冲）`)
  }

  let warning: string | undefined
  if (chongHe.length > 0) {
    warning = '父母宫动，主早年家庭环境变动或父母关系不谐'
  }

  return {
    yearAnalysis: `年柱${bazi.year.stem}${bazi.year.branch}为父宫，${BRANCH_ELEMENT[bazi.year.branch]}气为主`,
    monthAnalysis: `月柱${bazi.month.stem}${bazi.month.branch}为母宫，${BRANCH_ELEMENT[bazi.month.branch]}气为主`,
    chongHe,
    warning,
  }
}

// ============================================================
// 兄弟姐妹分析
// ============================================================

export function analyzeSiblings(bazi: BaziChart): SiblingAnalysis {
  let biJieCount = 0
  for (const p of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    if (p.tenGod === '比肩' || p.tenGod === '劫财') biJieCount++
  }

  let interpretation: string
  if (biJieCount >= 3) {
    interpretation = '比劫过重，兄弟姐妹缘分深厚但竞争也激烈'
  } else if (biJieCount >= 1) {
    interpretation = '有一到两位兄弟姐妹，彼此能互相扶持'
  } else {
    interpretation = '比劫不显，兄弟姐妹缘分较浅或为独生子女'
  }

  return { biJieCount, interpretation }
}

// ============================================================
// 综合六亲分析入口
// ============================================================

export function analyzeSixRelatives(bazi: BaziChart, gender: '男' | '女'): SixRelativesResult {
  return {
    father: locateFather(bazi, gender),
    mother: locateMother(bazi, gender),
    parentsPalace: analyzeParentsPalace(bazi),
    siblings: analyzeSiblings(bazi),
  }
}

// ============================================================
// AI编造检测
// ============================================================

const FABRICATED_PHRASES = [
  // 家庭场景编造
  '打压式教育', '重男轻女', '童年压抑', '疏离原生家庭',
  '缺乏关爱', '情感滋养', '物质满足', '控制欲强',
  '家庭暴力', '不负责任', '冷漠无情',
  // 父星编造
  '性格刚烈', '管教严厉', '父亲严厉', '父亲暴躁',
  '沉默寡言', '望子成龙', '恨铁不成钢',
  // 母星编造
  '持家节俭', '感情不和', '家庭主妇', '全职太太',
  '母亲软弱', '过度保护', '唠叨啰嗦', '溺爱',
  // 建议编造
  '主动疏离', '搬离原生', '断绝关系',
  '暖色调', '远离家人',
]

export function detectFabrication(text: string): { hasFabrication: boolean; issues: string[] } {
  const issues: string[] = []

  for (const phrase of FABRICATED_PHRASES) {
    if (text.includes(phrase)) {
      issues.push(`检测到AI编造内容：「${phrase}」—— 八字无法推导此具体情节`)
    }
  }

  return { hasFabrication: issues.length > 0, issues }
}
