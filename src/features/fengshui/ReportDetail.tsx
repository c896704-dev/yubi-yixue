import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/Loading'
import { ScoreGauge } from '../../components/viz/ScoreGauge'
import { PalaceGrid } from '../../components/viz/PalaceGrid'
import { ProsConsList } from './ProsConsList'
import { SuggestionList } from './SuggestionList'
import { ChatPanel } from '../../components/ui/ChatPanel'
import { buildFengshuiQASystemPrompt } from '../../utils/ai'
import { getRecordDetail } from '../../services/fengshuiApi'

interface ReportDetailProps {
  recordId: string
  onBack: () => void
}

export function ReportDetail({ recordId, onBack }: ReportDetailProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getRecordDetail(recordId)
      .then((res: any) => setData(res.data || res))
      .finally(() => setLoading(false))
  }, [recordId])

  if (loading) return <Loading text="加载报告中..." />
  if (!data) return <Card><p>报告未找到</p></Card>

  const detail = data.detail_data || data
  const rawPalace = detail.ninePalace
  const palaceList = rawPalace?.palaces ?? (Array.isArray(rawPalace) ? rawPalace : [])
  const cells = palaceList.map((p: any) => ({
    label: p.position || p.room || p.name || '',
    number: p.score || p.number || 0,
    element: p.element,
    score: p.score,
    isCenter: p.isCenter,
    subLabel: p.missing ? (p.severity ? `${p.severity}度缺角` : '缺角') : undefined,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div><Button variant="ghost" size="sm" onClick={onBack}>← 返回列表</Button></div>
      <Card><div className="text-center"><ScoreGauge score={detail.overallScore || data.overall_score || 0} label="综合评分" /></div></Card>
      {detail.summary && <Card title="分析总结"><p className="text-[15px] text-[#2C2C2C] leading-relaxed">{detail.summary}</p></Card>}
      {cells.length > 0 && <Card title="九宫方位分析"><PalaceGrid cells={cells} /></Card>}
      {(detail.strengths?.length > 0 || detail.weaknesses?.length > 0) && (
        <Card><ProsConsList strengths={detail.strengths} weaknesses={detail.weaknesses} /></Card>
      )}
      {detail.suggestions?.length > 0 && (
        <Card><SuggestionList suggestions={detail.suggestions} /></Card>
      )}
      {data.ai_report && (
        <Card title="AI 分析报告">
          <div className="report"><ReactMarkdown remarkPlugins={[remarkGfm]}>{data.ai_report}</ReactMarkdown></div>
        </Card>
      )}
      <div className="flex gap-4 justify-center">
        <Button variant="secondary" onClick={onBack}>返回列表</Button>
        <Button variant="secondary" onClick={() => window.print()}>打印报告</Button>
      </div>
      <ChatPanel
        mode="风水问答"
        systemPrompt={buildFengshuiQASystemPrompt({
          orientation: detail.orientation || '',
          layout: detail.layout || detail.summary || '',
          ninePalace: detail.ninePalace ? JSON.stringify(detail.ninePalace) : '',
          strengths: JSON.stringify(detail.strengths || []),
          weaknesses: JSON.stringify(detail.weaknesses || []),
          overallScore: detail.overallScore || data.overall_score,
        })}
        suggestions={[
          '此户型风水总体如何？',
          '哪个方位最需要特别注意？',
          '如何化解不利的格局？',
          '适合什么生肖的人居住？',
          '财运位和健康位在哪里？',
        ]}
      />
    </div>
  )
}
