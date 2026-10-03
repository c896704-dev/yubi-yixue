import type { ReportSpec } from '../../report/types'
import { ScoreGauge } from '../../components/viz/ScoreGauge'
import { PalaceGrid } from '../../components/viz/PalaceGrid'
import { ProsConsList } from './ProsConsList'
import { SuggestionList } from './SuggestionList'

/** 九宫格数据（与 PalaceGrid 的入参同构） */
export interface FengshuiCell {
  label: string
  number: number
  element?: string
  subLabel?: string
  score?: number
  isCenter?: boolean
}

/** 优劣势条目（与 ProsConsList 的入参同构） */
export interface FengshuiItem {
  item: string
  impact?: string
  type?: string
  detail?: string
  title?: string
  description?: string
}

/** 调整建议条目（与 SuggestionList 的入参同构） */
export interface FengshuiSuggestion {
  priority: string
  category: string
  title: string
  description?: string
  principle?: string
  solution?: string
}

/**
 * 风水报告的输入。三个报告页（记录详情 / 户型分析 / 楼盘位置）共用同一套章节，
 * 差异只在于给哪些字段、以及评分卡的标题。
 */
export interface FengshuiReportData {
  /** 评分卡标题：综合评分 / 楼盘评分 */
  scoreLabel: string
  score: number
  summary?: string
  cells?: FengshuiCell[]
  /** 楼盘位置分析专属 */
  environment?: string
  strengths?: FengshuiItem[]
  weaknesses?: FengshuiItem[]
  suggestions?: FengshuiSuggestion[]
}

/**
 * 风水分析报告章节编排。
 *
 * 风水板块在审计阶段被跳过，因此这是**首次**把这几个报告页纳入统一骨架：
 * 原先各页都是「一串 <Card>」手写拼装，章节没有标题（优劣势/建议两块甚至是无标题卡）、
 * 没有锚点、没有导航，AI 报告直接调 ReactMarkdown 绕过了共享渲染器。
 * 现统一为 ReportSpec，序号/锚点/目录/AI 承载交给 ReportView。
 *
 * 条件章节用 `when`：不满足时视为"本章不存在"，不占号（原先靠 `&&` 在 JSX 里过滤，
 * 效果相同但结构散落在页面中）。
 */
export const FENGSHUI_SPEC: ReportSpec<FengshuiReportData> = {
  title: '风水分析报告',
  chapters: [
    {
      id: 'fs-score', title: '综合评分', kind: 'data', collapsible: false,
      body: (c) => (
        <div className="text-center">
          <ScoreGauge score={c.result.score} label={c.result.scoreLabel} />
        </div>
      ),
    },
    {
      id: 'fs-summary', title: '分析总结', kind: 'data',
      when: (c) => Boolean(c.result.summary),
      body: (c) => <p className="text-[15px] leading-relaxed" style={{ color: 'var(--fg)' }}>{c.result.summary}</p>,
    },
    {
      id: 'fs-palace', title: '九宫方位分析', kind: 'data',
      when: (c) => (c.result.cells?.length ?? 0) > 0,
      body: (c) => <PalaceGrid cells={c.result.cells ?? []} />,
    },
    {
      id: 'fs-environment', title: '环境分析', kind: 'data',
      when: (c) => Boolean(c.result.environment),
      body: (c) => (
        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(0,77,77,0.55)' }}>
          {c.result.environment}
        </div>
      ),
    },
    {
      id: 'fs-proscons', title: '优势与不足', kind: 'data',
      when: (c) => (c.result.strengths?.length ?? 0) > 0 || (c.result.weaknesses?.length ?? 0) > 0,
      body: (c) => <ProsConsList strengths={c.result.strengths} weaknesses={c.result.weaknesses} />,
    },
    {
      id: 'fs-suggestions', title: '调整建议', kind: 'data',
      when: (c) => (c.result.suggestions?.length ?? 0) > 0,
      body: (c) => <SuggestionList suggestions={c.result.suggestions ?? []} />,
    },
    { id: 'ai-fengshui', title: 'AI 分析报告', kind: 'ai' },
  ],
}
