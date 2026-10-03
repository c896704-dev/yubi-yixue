import type { LiuyaoResult } from '../types'
import { determineLiuyaoYongShen } from '../utils/liuyao-yongshen'
import { analyzeSiShen } from '../../../utils/sishen'
import { analyzeMoonDayStrength } from '../../../utils/strength'
import { computeYingQiLiuyao } from '../../../utils/yingqi'

/**
 * 六爻「代码层分析」的两个版本 —— 这是根因 B 的正式解法。
 *
 * 旧实现只有一个 builder 加 `forAI` 开关：显示要精简、AI 要完整，于是同一段内容
 * 被迫维护两个分支，改显示就会牵动 AI 上下文。现在拆成两个**同源不同用**的函数：
 *  - buildLiuyaoAnalysisView   → 章节 body（省略页面已用结构化块另行呈现的内容）
 *  - buildLiuyaoAnalysisContext → 章节 aiContext（完整表述，喂给模型）
 * 两者都调 computeAnalysis，结论不会分叉；显示侧再精简也不会削掉 AI 的应期依据。
 */

function computeAnalysis(r: LiuyaoResult, q: string) {
    const naja = r.naja
    if (!naja) return null
    const ys = determineLiuyaoYongShen(naja.lines, q)
    const sishen = analyzeSiShen(naja.lines, ys.primary.index)
    const str = analyzeMoonDayStrength(
      ys.primary.line, ys.primary.line.wuxing!,
      sishen.yuan.line, sishen.yuan.wuxing,
      sishen.ji.line, sishen.ji.wuxing,
      naja.monthWuxing, naja.dayWuxing,
    )
    const yq = computeYingQiLiuyao(ys.primary.line.wuxing!, naja.isStatic, naja.monthWuxing)
    return { naja, ys, sishen, str, yq }
  }

  /**
   * **显示版**：省略页面已用结构化块另行呈现的内容
   * （四神体系散文＝下方三条列表；应期结论＝下方「应期推算」块）。
   */
export function buildLiuyaoAnalysisView(r: LiuyaoResult, q: string): string | null {
    const a = computeAnalysis(r, q)
    if (!a) return null
    const { naja, ys, sishen, str } = a
    return [
      `**用神定位：** ${ys.info}`,
      [sishen.yuan.info, sishen.ji.info, sishen.chou.info].map((s) => `- ${s}`).join('\n'),
      `**月日旺衰：** ${str.summary}`,
      [str.yong.month, str.yong.day].map((s) => `- ${s}`).join('\n'),
      `**卦局：** ${naja.isLiuChong ? '六冲卦' : '非六冲卦'}，${naja.isStatic ? '静卦' : '有动爻'}，${naja.palaceName}宫${naja.palaceElement}`,
    ].join('\n\n')
  }

  /**
   * **AI 版**：完整表述，作为喂给模型的上下文。
   * 与显示版同源而非同一份——显示侧精简不会再削掉 AI 的应期依据，
   * 这正是原先 `forAI` 开关被淘汰的原因。
   */
export function buildLiuyaoAnalysisContext(r: LiuyaoResult, q: string): string | null {
    const a = computeAnalysis(r, q)
    if (!a) return null
    const { naja, ys, sishen, str, yq } = a
    return [
      `**用神定位：** ${ys.info}`,
      `**四神体系：** ${sishen.summary}`,
      [sishen.yuan.info, sishen.ji.info, sishen.chou.info].map((s) => `- ${s}`).join('\n'),
      `**月日旺衰：** ${str.summary}`,
      [str.yong.month, str.yong.day].map((s) => `- ${s}`).join('\n'),
      `**应期推算：** ${yq.map((y) => y.timeWindow).join('；')}`,
      `**卦局：** ${naja.isLiuChong ? '六冲卦' : '非六冲卦'}，${naja.isStatic ? '静卦' : '有动爻'}，${naja.palaceName}宫${naja.palaceElement}`,
    ].join('\n\n')
  }
