import { Card } from '../../components/ui/Card'
import { ReportMarkdown } from '../../report/ReportMarkdown'

interface CompatReportProps {
  reportMarkdown: string
}

/**
 * 合盘详细报告（纯模板正文）。
 * AI 合盘解读已后置到 CompatPage 的报告末尾——引擎结论先行、模型叙事随后。
 */
export function CompatReport({ reportMarkdown }: CompatReportProps) {
  return (
    <div id="compat-report">
      <Card title="合盘详细报告">
        <div className="report"><ReportMarkdown>{reportMarkdown}</ReportMarkdown></div>
      </Card>
    </div>
  )
}
