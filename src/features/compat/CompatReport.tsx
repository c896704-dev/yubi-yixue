import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'

interface CompatReportProps {
  reportMarkdown: string
  aiInsight?: string | null
  aiLoading?: boolean
  aiError?: string | null
}

export function CompatReport({ reportMarkdown, aiInsight, aiLoading, aiError }: CompatReportProps) {
  return (
    <div className="flex flex-col gap-5">
      {aiInsight || aiLoading ? (
        <div className="ai-insight">
          <h3 className="font-[family-name:var(--font-title)] text-base font-semibold mb-4" style={{ color: 'var(--fg)' }}>AI 合盘解读</h3>
          {aiLoading && <Loading text="AI 正在分析..." />}
          {aiError && <p className="text-sm" style={{ color: 'var(--danger)' }}>{aiError}</p>}
          {aiInsight && (
            <div className="report"><ReactMarkdown remarkPlugins={[remarkGfm]}>{aiInsight}</ReactMarkdown></div>
          )}
        </div>
      ) : null}
      <Card title="合盘详细报告">
        <div className="report"><ReactMarkdown remarkPlugins={[remarkGfm]}>{reportMarkdown}</ReactMarkdown></div>
      </Card>
    </div>
  )
}
