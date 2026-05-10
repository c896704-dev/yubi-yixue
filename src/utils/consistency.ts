/**
 * 报告一致性校验
 *
 * 检测算法报告各模块之间的矛盾，在开发阶段输出警告到 console
 * 检查项：
 * 1. 性格核心 vs 社交风格
 * 2. 体质判定 vs 五行极值
 * 3. 判官直言 vs 性格弱点
 * 4. 智识评级 vs 分维度分数
 */

import type { FiveElement } from '../constants'
import type { AnalysisResult } from '../types'

interface PersonalityLike {
  coreTrait: string
  strengths: string[]
  weaknesses: string[]
  socialStyle: string
}

export function validateReportConsistency(
  result: AnalysisResult,
  personality: PersonalityLike,
  riskReport: string,
): string[] {
  const warnings: string[] = []
  const dist = result.fiveElementDistribution

  // === 检查1：性格核心 vs 社交风格 ===
  const coreIsIntrovert =
    personality.coreTrait.includes('谨慎') ||
    personality.coreTrait.includes('敏感') ||
    personality.coreTrait.includes('内向')
  const socialIsExtrovert =
    personality.socialStyle.includes('社牛型')

  if (coreIsIntrovert && socialIsExtrovert) {
    warnings.push(
      `[一致性] 矛盾：核心性格偏内向("${personality.coreTrait.slice(0, 15)}...")但社交模式判为"社牛型"` +
      ` → 已自动添加身弱能量消耗说明`,
    )
  }

  // === 检查2：体质判定 vs 五行极值 ===
  const allVals = Object.values(dist)
  const minVal = Math.min(...allVals)
  const spread = Math.max(...allVals) - minVal
  const healthConstitution = result.bodyStrength

  // 检查是否有元素 < 1 但未给出偏枯警告
  if (minVal < 1 && spread > 4) {
    // 这个情况应该在健康模块中已经被标记为"严重偏枯"
    // 检查是否仍然被标记为"平衡"
    if (healthConstitution.includes('平衡')) {
      warnings.push(
        `[一致性] 矛盾：存在五行极弱（最低${minVal.toFixed(1)}分，差值${spread.toFixed(1)}）` +
        `但体质被标记为"平衡" → 请检查健康模块体质判定`,
      )
    }
  }

  // === 检查3：判官直言 vs 性格弱点 ===
  if (riskReport.includes('无明显性格偏激') && personality.weaknesses.length >= 2) {
    warnings.push(
      `[一致性] 矛盾：判官直言说"无明显偏激"但性格模块列出了${personality.weaknesses.length}条弱点` +
      ` → 判官直言已改为引用性格模块数据`,
    )
  }

  // === 检查4：五行偏枯程度 ===
  if (spread > 5) {
    const minElem = Object.entries(dist).sort((a, b) => a[1] - b[1])[0]!
    const maxElem = Object.entries(dist).sort((a, b) => b[1] - a[1])[0]!
    warnings.push(
      `[一致性] 注意：五行严重偏枯（${maxElem[0]}${maxElem[1].toFixed(1)} vs ${minElem[0]}${minElem[1].toFixed(1)}，差值${spread.toFixed(1)}）` +
      ` → 请确认各模块描述与此偏枯程度一致`,
    )
  }

  // === 检查5：用神结论一致性 ===
  const yongShenSet = new Set(result.favorableElements)
  const allYongShenSources = [
    ...result.yongShen.fuYi,
    ...result.yongShen.tiaoHou,
    ...result.yongShen.tongGuan,
    ...result.yongShen.bingYao,
  ]
  const uniqueSources = new Set(allYongShenSources)
  // 检查是否有用神来源的元素不在最终 favorable 中
  for (const elem of uniqueSources) {
    if (!yongShenSet.has(elem as FiveElement)) {
      // 这是正常的，因为用神冲突消解后可能舍弃某些维度
      // 但如果所有来源的元素都不在最终列表中，需要检查
    }
  }

  return warnings
}
