import type { AnalysisResult } from '../../types'
import type { ReportSpec } from '../../report/types'
import { CareerCityMap } from '../../components/viz/CareerCityMap'
import {
  PillarTable, ElementBars, ShenShaGrid, YongShenBadges, FortuneTimelineV2,
} from './BaziViz'
import {
  renderFundamentalReportView, renderPersonalityReport, renderCareerReport,
  renderIntelligenceReport, renderFamilyDeepReport, renderCompatibilityPreview,
  renderHealthReport, renderLifeStagesReport, renderRiskReport, renderAppearanceReport,
  buildBaziAiContext,
} from '../../utils/analysis'

// 章节正文直接返回 Markdown 字符串，由 ReportView 统一渲染
// （并做「去掉与卡头同名的首行标题 / 去掉标题行 emoji」的显示侧规范化，见 report/chapterMarkdown.ts）

/**
 * 八字命盘详批的章节编排。
 *
 * 这是 Batch 4 的核心：章节表从模板层（旧的 `buildReportSections()`）搬到描述层，
 * 序号、锚点、目录、折叠、AI 承载全部交给 ReportView；页面不再手工拼章节。
 *
 * 说明：
 * - 「命盘基础信息」是排盘结果本身，作为第一章；其后才是分析章节。
 * - 原页面在命盘表下方还有一对「身强身弱 / 格局」大卡，与首屏结论条、以及乾坤定盘里的
 *   「格局定性」表重复（审计 P-04：同一事实在四处出现）。首屏结论条已覆盖该信息，
 *   故本次不再重复渲染那一对卡片。
 * - AI 总评保持原有位置（紧随乾坤定盘之后，P1 的 AI-4 决定），但现在是 spec 里的一章，
 *   页面不再手工摆放。其 `aiContext` 与页面发请求时调用的是同一个 buildBaziAiContext。
 */
export const BAZI_SPEC: ReportSpec<AnalysisResult> = {
  title: '命盘详批',
  chapters: [
    {
      id: 'bazi-chart', title: '命盘基础信息', kind: 'data', collapsible: false,
      body: (c) => <PillarTable result={c.result} />,
    },
    {
      id: 'section-fundamental', title: '乾坤定盘', kind: 'data',
      // 显示版：不重复首屏结论条已有的「格局定性」表，方法论说明移到章末（审计 P-04/P-05/P-08）
      body: (c) => renderFundamentalReportView(c.result),
      aside: (c) => (
        <>
          <ElementBars result={c.result} />
          <h4 className="comp-subtitle">用神体系</h4>
          <YongShenBadges result={c.result} />
          <h4 className="comp-subtitle">神煞一览</h4>
          <ShenShaGrid result={c.result} />
        </>
      ),
    },

    // ── AI 总评（承载统一，正文一字不改） ────────────────────
    {
      id: 'ai-bazi', title: 'AI 解读 · 总评', kind: 'ai',
      aiContext: (c) => buildBaziAiContext(c.result),
    },

    // ── 深度分析报告 ────────────────────────────────────────
    { id: 'section-personality', title: '性格全息图谱', kind: 'data', body: (c) => renderPersonalityReport(c.result) },
    {
      id: 'section-career', title: '事业前程', kind: 'data',
      body: (c) => renderCareerReport(c.result),
      aside: (c) => <CareerCityMap result={c.result} />,
    },
    { id: 'section-intelligence', title: '智识天赋', kind: 'data', body: (c) => renderIntelligenceReport(c.result) },
    { id: 'section-family', title: '家庭与婚恋', kind: 'data', body: (c) => renderFamilyDeepReport(c.result) + '\n' + renderCompatibilityPreview(c.result) },
    { id: 'section-health', title: '健康养生', kind: 'data', body: (c) => renderHealthReport(c.result) },
    {
      id: 'section-lifestages', title: '运程长卷', kind: 'data',
      body: (c) => renderLifeStagesReport(c.result),
      aside: (c) => <FortuneTimelineV2 result={c.result} />,
    },
    { id: 'section-risk', title: '判官直言', kind: 'data', body: (c) => renderRiskReport(c.result) },

    // ── 附录 ────────────────────────────────────────────────
    {
      id: 'section-appearance', title: '面相身形', kind: 'data',
      appendix: true, defaultOpen: false,
      body: (c) => renderAppearanceReport(c.result),
    },
  ],
}
