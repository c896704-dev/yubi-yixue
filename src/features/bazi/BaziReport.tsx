import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import type { AnalysisResult } from '../../types'
import type { ReportSection } from '../../utils/analysis'

interface BaziReportProps {
  markdown?: string
  sections?: ReportSection[]
  result?: AnalysisResult | null
}

/** 折叠章节卡片：桌面默认按 defaultOpen，打印时强制展开 */
function ReportSectionCard({ section, result, index }: {
  section: ReportSection
  result: AnalysisResult
  index: number
}) {
  const [open, setOpen] = useState(section.defaultOpen)
  const md = section.render(result)

  return (
    <div className="report-section" id={`section-${section.id}`}>
      <button
        className="report-section-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="report-section-num">{section.num}</span>
        <span className="report-section-icon">{section.icon}</span>
        <span className="report-section-title">{section.title}</span>
        <span className={`report-section-toggle ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="report-section-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

/** 五行能量可视化条形图（替换 markdown █ 代码块） */
function ElementBars({ result }: { result: AnalysisResult }) {
  const dist = result.fiveElementDistribution
  const maxVal = Math.max(...Object.values(dist), 1)
  const colors: Record<string, string> = {
    '木': 'linear-gradient(90deg, #7A9A7A, #4d7a4d)',
    '火': 'linear-gradient(90deg, #c96a5a, #a33)',
    '土': 'linear-gradient(90deg, #b8a35a, #8a742e)',
    '金': 'linear-gradient(90deg, #b8ada0, #8a8072)',
    '水': 'linear-gradient(90deg, #6a9ab8, #3d6f8f)',
  }
  return (
    <div className="element-bars">
      {(['木', '火', '土', '金', '水'] as const).map((el) => {
        const val = dist[el] || 0
        const pct = Math.max(4, Math.round((val / maxVal) * 100))
        return (
          <div key={el} className="element-bar-row">
            <span className="element-bar-label">{el}</span>
            <div className="element-bar-track">
              <div className="element-bar-fill" style={{ width: `${pct}%`, background: colors[el] }} />
            </div>
            <span className="element-bar-value">{val.toFixed(1)}</span>
          </div>
        )
      })}
    </div>
  )
}

/** 大运时间轴（替换 4 张分离表格） */
function FortuneTimeline({ result }: { result: AnalysisResult }) {
  const fortunes = result.bigFortunes || []
  const current = result.currentFortune
  const favorable = result.favorableElements
  const unfavorable = result.unfavorableElements
  if (fortunes.length === 0) return null

  return (
    <div className="fortune-timeline">
      {fortunes.map((f, i) => {
        const isCurrent = current && f.startAge === current.startAge
        const isFav = favorable.includes(f.element)
        const isUnfav = unfavorable.includes(f.element)
        return (
          <div key={i} className={`fortune-node ${isCurrent ? 'current' : ''} ${isFav ? 'fav' : isUnfav ? 'unfav' : ''}`}>
            <div className="fortune-age">{f.startAge}-{f.endAge}岁</div>
            <div className="fortune-ganzhi">{f.stem}{f.branch}</div>
            <div className="fortune-meta">
              <span className="fortune-tenGod">{f.tenGod}</span>
              <span className="fortune-nayin">{f.naYin}</span>
              {isCurrent && <span className="fortune-now">当前</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function BaziReport({ markdown, sections, result }: BaziReportProps) {
  // 新式：sections 驱动（含折叠/目录），旧式 markdown 兜底
  if (sections && result) {
    return (
      <Card title="深度分析报告">
        <div className="report">
          {/* 目录导航 */}
          <nav className="report-toc" aria-label="报告目录">
            {sections.map((s) => (
              <a key={s.id} href={`#section-${s.id}`} className="report-toc-item">
                <span className="report-toc-num">{s.num}</span>
                <span className="report-toc-icon">{s.icon}</span>
                <span>{s.title}</span>
              </a>
            ))}
          </nav>

          {sections.map((s, i) => (
            <ReportSectionCard key={s.id} section={s} result={result} index={i} />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card title="深度分析报告">
      <div className="report">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </Card>
  )
}

export { ElementBars, FortuneTimeline }

interface AiInsightCardProps {
  insight: string | null
  loading?: boolean
  error?: string | null
}

export function AiInsightCard({ insight, loading, error }: AiInsightCardProps) {
  return (
    <div className="ai-insight">
      <h3 className="ai-insight-title">AI 总评</h3>
      {loading && <Loading text="AI 正在分析中..." />}
      {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
      {insight && (
        <div className="report">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{insight}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
