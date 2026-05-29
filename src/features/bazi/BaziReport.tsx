import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'

interface BaziReportProps {
  markdown: string
}

export function BaziReport({ markdown }: BaziReportProps) {
  return (
    <Card title="深度分析报告">
      <div className="report">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </Card>
  )
}

interface AiInsightCardProps {
  insight: string | null
  loading?: boolean
  error?: string | null
}

export function AiInsightCard({ insight, loading, error }: AiInsightCardProps) {
  return (
    <div className="ai-insight">
      <h3 className="ai-insight-title">AI 命理分析</h3>
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
