import type { CompatibilityResult, AnalysisResult } from '../../types'
import type { ReportSpec, ReportContext } from '../../report/types'
import { buildCompatSections } from '../../utils/compatibility'
import { BaziChart } from '../../components/viz/BaziChart'

export interface CompatReportInput {
  /** 引擎的合盘结果（报告正文来源） */
  compat: CompatibilityResult
  /** 双方八字详情用（合盘 result 里只有简化盘） */
  male: AnalysisResult
  female: AnalysisResult
}

/**
 * 章节正文直接返回 Markdown 字符串，由 ReportView 统一渲染（见 report/chapterMarkdown.ts）。
 * `body` 的 string 形式只适用于**静态**文本；合婚的章节内容随结果变化，走函数形式。
 */

/**
 * 章节按 result 缓存：spec 是静态的，若每次取值都调 buildCompatSections，
 * 一次渲染会重算十几遍整份报告串。用 WeakMap 绑定到 result 对象，结果换了自然失效。
 */
const sectionCache = new WeakMap<CompatibilityResult, ReturnType<typeof buildCompatSections>>()
const sectionsOf = (r: CompatibilityResult) => {
  let v = sectionCache.get(r)
  if (!v) { v = buildCompatSections(r); sectionCache.set(r, v) }
  return v
}

/**
 * 合盘报告章节编排。
 *
 * 章节内容仍由 `renderEnhancedCompatibilityReport` 统一产出（那 8 段共享 8 个局部量，
 * 硬拆成 8 个函数只是搬运参数），`buildCompatSections` 按报告自身的二级标题切出边界，
 * 并把序号剥掉——序号只由 ReportView 派生（与八字/识人同一规则）。
 *
 * AI 合盘解读的输入取自 result1/result2（见 useBazi 的 fetchAiInsight），与报告串无关，
 * 因此**不需要 aiContext**。
 */
export const COMPAT_SPEC: ReportSpec<CompatReportInput> = {
  title: '合盘详细报告',
  chapters: [
    // 8 个模板章节：顺序与 buildCompatSections 的稳定顺序一一对应
    ...(['overview', 'fundamental', 'personality', 'health', 'career', 'family', 'fortune', 'verdict'] as const)
      .map((id, i) => ({
        id: `compat-${id}`,
        title: (c: ReportContext<CompatReportInput>) => sectionsOf(c.result.compat)[i]?.title ?? `第 ${i + 1} 章`,
        kind: 'data' as const,
        body: (c: ReportContext<CompatReportInput>) => sectionsOf(c.result.compat)[i]?.md ?? '',
      })),

    {
      id: 'compat-charts', title: '双方八字详情', kind: 'data',
      body: (c) => (
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
          <div className="ds-card"><BaziChart bazi={c.result.male.bazi} person={c.result.male.person} /></div>
          <div className="ds-card"><BaziChart bazi={c.result.female.bazi} person={c.result.female.person} /></div>
        </div>
      ),
    },

    { id: 'ai-compat', title: 'AI 解读 · 合盘', kind: 'ai' },
  ],
}
