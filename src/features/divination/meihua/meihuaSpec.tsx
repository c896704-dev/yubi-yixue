import type { ReportSpec } from '../../../report/types'
import { buildMeihuaAnalysisContext } from './meihuaAnalysis'
import {
  MeihuaHexSection, MeihuaTiYongSection, MeihuaAnalysisSection,
  MeihuaGuaCiSection, MeihuaDuanYuSection, MeihuaZhuanTiSection,
  type MeihuaCtx,
} from './meihuaSections'

/**
 * 梅花易数卦例报告章节编排。
 *
 * 与六爻同一套结构：顺序 = 数组顺序，序号由 ReportView 派生；
 * 「卦理分析与应期推算」带 `aiContext`（完整版代码层分析），
 * 显示用精简版、AI 用完整版，同源不同用。
 */
export const MEIHUA_SPEC: ReportSpec<MeihuaCtx> = {
  title: '梅花易数卦例',
  chapters: [
    {
      id: 'mh-hex', title: '卦象', kind: 'data', collapsible: false,
      body: (c) => <MeihuaHexSection p={c.result} />,
    },
    {
      id: 'mh-tiyong', title: '体用生克分析', kind: 'data',
      body: (c) => <MeihuaTiYongSection p={c.result} />,
    },
    {
      id: 'mh-analysis', title: '卦理分析与应期推算', kind: 'data',
      body: (c) => <MeihuaAnalysisSection p={c.result} />,
      aiContext: (c) => buildMeihuaAnalysisContext(c.result.result),
    },
    {
      id: 'mh-guaci', title: '卦辞释义', kind: 'data',
      body: (c) => <MeihuaGuaCiSection p={c.result} />,
    },
    {
      id: 'mh-duanyu', title: '传统断语', kind: 'data',
      body: (c) => <MeihuaDuanYuSection p={c.result} />,
    },
    {
      id: 'mh-zhuanti', title: '专题占断', kind: 'data',
      body: (c) => <MeihuaZhuanTiSection p={c.result} />,
    },
    { id: 'ai-meihua', title: 'AI 解读 · 断卦', kind: 'ai' },
  ],
}
