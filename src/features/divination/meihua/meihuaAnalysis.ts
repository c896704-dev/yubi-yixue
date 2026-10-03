import type { MeihuaResult } from '../types'
import { evalTiYongComprehensive } from '../../../utils/tiyong'
import { computeYingQiMeihua } from '../../../utils/yingqi'

/**
 * 梅花易数「代码层分析」的两个版本 —— 与六爻同一套解法（根因 B 的正式替代）。
 *
 * 旧实现是一个 builder 加 `forAI` 开关；现在拆成同源不同用的两个函数：
 *  - buildMeihuaAnalysisView    → 章节 body（省略页面已用结构化块呈现的应期结论）
 *  - buildMeihuaAnalysisContext → 章节 aiContext（完整表述，含应期，喂给模型）
 */

/** 体用与应期的派生量：两版共用，保证结论不分叉 */
function computeMeihuaAnalysis(r: MeihuaResult) {
  const tiyong = evalTiYongComprehensive(
    r.tiYong.tiElement, r.tiYong.yongElement,
    r.seasonalStrength.tiState, r.seasonalStrength.yongState,
  )
  const yingqi = computeYingQiMeihua(
    r.tiYong.tiElement, r.tiYong.yongElement,
    r.tiYong.ti.number, r.tiYong.yong.number, r.changingYao,
  )
  return { tiyong, yingqi }
}

/** 显示版：应期结论由页面下方的结构化块逐条呈现，正文不再重复 */
export function buildMeihuaAnalysisView(r: MeihuaResult): string {
  const { tiyong } = computeMeihuaAnalysis(r)
  return [
    `**体用综合评估：** ${tiyong.verdict}`,
    `**力量对比：** ${tiyong.monthly}，${tiyong.correction}`,
    `**一体百用：** ${r.tiBaiYong.summary}`,
    `**卦气旺衰：** ${r.seasonalStrength.summary}`,
  ].join('\n\n')
}

/** AI 版：保留应期，显示侧再精简也不会削掉模型依据 */
export function buildMeihuaAnalysisContext(r: MeihuaResult): string {
  const { tiyong, yingqi } = computeMeihuaAnalysis(r)
  return [
    `**体用综合评估：** ${tiyong.verdict}`,
    `**力量对比：** ${tiyong.monthly}，${tiyong.correction}`,
    `**一体百用：** ${r.tiBaiYong.summary}`,
    `**应期推算：** ${yingqi.map((y) => y.timeWindow).join('；')}`,
    `**卦气旺衰：** ${r.seasonalStrength.summary}`,
  ].join('\n\n')
}
