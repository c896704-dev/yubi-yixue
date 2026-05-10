/**
 * 命理知识白名单校验器
 *
 * 硬编码的命理基础知识库，用于拦截AI生成或人工输入中的命理知识错误。
 * 所有校验基于《渊海子平》《三命通会》等经典，无流派争议。
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../constants'
import { STEM_ELEMENT } from '../constants'

// ============================================================
// 1. 天干五合白名单（仅有五组，不可增删）
// ============================================================

const GAN_HE: ReadonlySet<string> = new Set([
  '甲己', '己甲', '乙庚', '庚乙', '丙辛', '辛丙',
  '丁壬', '壬丁', '戊癸', '癸戊',
])

export function isValidGanHe(a: string, b: string): boolean {
  return GAN_HE.has(a + b)
}

// ============================================================
// 2. 地支六合白名单（仅有六组）
// ============================================================

const ZHI_LIU_HE: ReadonlySet<string> = new Set([
  '子丑', '丑子', '寅亥', '亥寅', '卯戌', '戌卯',
  '辰酉', '酉辰', '巳申', '申巳', '午未', '未午',
])

export function isValidZhiLiuHe(a: string, b: string): boolean {
  return ZHI_LIU_HE.has(a + b)
}

// ============================================================
// 3. 地支三合局白名单（仅有四组）
// ============================================================

const SAN_HE_JU: ReadonlySet<string> = new Set([
  '申子辰', '巳酉丑', '寅午戌', '亥卯未',
])

export function isValidSanHe(triple: string): boolean {
  return SAN_HE_JU.has(triple)
}

// ============================================================
// 4. 十干帝旺位白名单（用于月刃格等校验）
// ============================================================

const DI_WANG: Record<HeavenlyStem, EarthlyBranch> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
  '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥',
}

export function getDiWang(stem: HeavenlyStem): EarthlyBranch {
  return DI_WANG[stem]
}

export function isDiWang(stem: HeavenlyStem, branch: EarthlyBranch): boolean {
  return DI_WANG[stem] === branch
}

// ============================================================
// 5. 十干临官（禄）位白名单
// ============================================================

const LIN_GUAN: Record<HeavenlyStem, EarthlyBranch> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
}

export function isLinGuan(stem: HeavenlyStem, branch: EarthlyBranch): boolean {
  return LIN_GUAN[stem] === branch
}

// ============================================================
// 6. 五行生克关系白名单
// ============================================================

const GENERATES: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const CONTROLS: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

export function isValidGenerate(a: FiveElement, b: FiveElement): boolean {
  return GENERATES[a] === b
}

export function isValidControl(a: FiveElement, b: FiveElement): boolean {
  return CONTROLS[a] === b
}

// ============================================================
// 7. 天干五合化气
// ============================================================

const HUA_QI: Record<string, FiveElement> = {
  '甲己': '土', '己甲': '土',
  '乙庚': '金', '庚乙': '金',
  '丙辛': '水', '辛丙': '水',
  '丁壬': '木', '壬丁': '木',
  '戊癸': '火', '癸戊': '火',
}

export function getHuaQi(a: string, b: string): FiveElement | null {
  return HUA_QI[a + b] || null
}

// ============================================================
// 8. AI文案校验函数
// ============================================================

export interface ValidationIssue {
  type: 'fake_gan_he' | 'fake_zhi_he' | 'fake_element_claim' | 'fake_sheng_ke'
  claim: string
  reason: string
}

/**
 * 校验AI生成的命理文案中是否存在知识性错误
 */
export function validateAIClaims(
  aiText: string,
  elementDistribution: Record<FiveElement, number>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // 检测"X与Y天干五合"陈述中的假合
  const ganHePattern = /([甲乙丙丁戊己庚辛壬癸])([甲乙丙丁戊己庚辛壬癸])\s*(?:天干)?(?:五)?合/g
  let match
  while ((match = ganHePattern.exec(aiText)) !== null) {
    const [, a, b] = match!
    if (a && b && a !== b && !isValidGanHe(a, b)) {
      issues.push({
        type: 'fake_gan_he',
        claim: match[0],
        reason: `"${a}${b}合"不存在。天干五合仅有甲己、乙庚、丙辛、丁壬、戊癸五组。`,
      })
    }
  }

  // 检测"无X金/木/水/火/土"但实际五行分布中该元素>0
  const elementNames = ['金', '木', '水', '火', '土']
  for (const elem of elementNames) {
    const hasPattern = new RegExp(`(?:八字|命局|男方|女方|原局).{0,10}(?:无|没有|缺|少)${elem}`, 'g')
    let m
    while ((m = hasPattern.exec(aiText)) !== null) {
      const e = elem as FiveElement
      if (elementDistribution[e] !== undefined && elementDistribution[e] > 0.5) {
        issues.push({
          type: 'fake_element_claim',
          claim: m[0],
          reason: `文案声称"无${elem}"，但实际五行分布中${elem}=${elementDistribution[e]?.toFixed(1)}分，该陈述与数据矛盾。`,
        })
      }
    }
    // 也检测反向断言
    const onlyPattern = new RegExp(`(?:八字|命局|男方|女方|原局).{0,10}(?:只有|仅有|仅剩|剩下).{0,5}${elem}`, 'g')
    // 跳过这个复杂的检测，主要关注"无某五行"
  }

  // 检测声明某五行"最旺"但实际不是
  const maxElem = Object.entries(elementDistribution).sort((a, b) => b[1] - a[1])[0]?.[0]
  for (const elem of elementNames) {
    if (elem === maxElem) continue
    const wangPattern = new RegExp(`(?:${elem})(?:气|行)?(?:最旺|最盛|最强|极旺)`, 'g')
    let m
    while ((m = wangPattern.exec(aiText)) !== null) {
      if (maxElem && elementDistribution[maxElem as FiveElement]! > (elementDistribution[elem as FiveElement] || 0) + 1) {
        issues.push({
          type: 'fake_element_claim',
          claim: m[0],
          reason: `文案称"${elem}最旺"，但实际最旺是${maxElem}（${elementDistribution[maxElem as FiveElement]?.toFixed(1)}分），${elem}仅${elementDistribution[elem as FiveElement]?.toFixed(1)}分。`,
        })
      }
    }
  }

  return issues
}

/**
 * 校验天干五合陈述（轻量版，用于快速检查）
 */
export function checkGanHeClaim(text: string): { valid: boolean; fakePairs: string[] } {
  const fakePairs: string[] = []
  const pattern = /([甲乙丙丁戊己庚辛壬癸])([甲乙丙丁戊己庚辛壬癸])合/g
  let m
  while ((m = pattern.exec(text)) !== null) {
    const [, a, b] = m!
    if (a && b && a !== b && !isValidGanHe(a, b)) {
      fakePairs.push(`${a}${b}合`)
    }
  }
  return { valid: fakePairs.length === 0, fakePairs }
}
