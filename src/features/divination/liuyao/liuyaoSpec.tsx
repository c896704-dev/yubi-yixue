import type { ReportSpec } from '../../../report/types'
import { buildLiuyaoAnalysisContext } from './liuyaoAnalysis'
import {
  LiuyaoHexSection, LiuyaoAnalysisSection, LiuyaoGuaCiSection, LiuyaoDuanYuSection,
  type LiuyaoCtx,
} from './liuyaoSections'

/**
 * 六爻卦例报告章节编排。
 *
 * - 顺序 = 数组顺序；序号由 ReportView 派生（本文件不出现任何章节序号）
 * - 「卦理分析与应期推算」章节带 `aiContext`：喂给模型的**完整**代码层分析，
 *   与显示用的精简版同源不同用（见 liuyaoAnalysis.ts 的说明）。
 *   页面的 AI 调用经 `collectAiContext(LIUYAO_SPEC, ctx)` 取，不再自己拼字符串。
 * - AI 解读章节 `kind:'ai'`，正文由 `ctx.ai` 在运行时提供，正文一字不改。
 */
export const LIUYAO_SPEC: ReportSpec<LiuyaoCtx> = {
  title: '六爻卦例',
  chapters: [
    {
      id: 'ly-hex', title: '卦象', kind: 'data', collapsible: false,
      body: (c) => <LiuyaoHexSection p={c.result} />,
    },
    {
      id: 'ly-analysis', title: '卦理分析与应期推算', kind: 'data',
      body: (c) => <LiuyaoAnalysisSection p={c.result} />,
      aiContext: (c) => buildLiuyaoAnalysisContext(c.result.result, c.result.question) ?? '',
    },
    {
      id: 'ly-guaci', title: '卦辞释义', kind: 'data',
      body: (c) => <LiuyaoGuaCiSection p={c.result} />,
    },
    {
      id: 'ly-duanyu', title: '传统断语', kind: 'data',
      body: (c) => <LiuyaoDuanYuSection p={c.result} />,
    },
    { id: 'ai-liuyao', title: 'AI 解读 · 断卦', kind: 'ai' },
  ],
}
