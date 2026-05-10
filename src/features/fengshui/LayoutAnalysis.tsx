import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { ImageUpload } from '../../components/form/ImageUpload'
import { Loading } from '../../components/ui/Loading'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ScoreGauge } from '../../components/viz/ScoreGauge'
import { PalaceGrid } from '../../components/viz/PalaceGrid'
import { ChatPanel } from '../../components/ui/ChatPanel'
import { buildFengshuiQASystemPrompt } from '../../utils/ai'
import { ProsConsList } from './ProsConsList'
import { SuggestionList } from './SuggestionList'
import { useFengshui } from '../../hooks/useFengshui'

export function LayoutAnalysis() {
  const { loading, result, error, runLayoutAnalysis, reset } = useFengshui()
  const [image, setImage] = useState<string | null>(null)
  const [orientation, setOrientation] = useState('south')
  const [buildingYear, setBuildingYear] = useState('')
  const [withBazi, setWithBazi] = useState(false)
  const [birthYear, setBirthYear] = useState('')
  const handleAnalyze = async () => {
    if (!image) return
    try {
      await runLayoutAnalysis({
        image, orientation,
        buildingYear: buildingYear ? Number(buildingYear) : undefined,
        mode: 'simple', withBazi,
        birthData: withBazi && birthYear ? { year: Number(birthYear) } : undefined,
      } as any)
    } catch {}
  }

  if (result) {
    const d = (result as any).data || result
    const rawPalace = d.ninePalace
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
        <Card><div className="text-center"><ScoreGauge score={d.overallScore || 0} label="综合评分" /></div></Card>
        {cells.length > 0 && <Card title="九宫方位分析"><PalaceGrid cells={cells} /></Card>}
        {d.summary && <Card title="分析总结"><p className="text-[15px] text-[#2C2C2C] leading-relaxed">{d.summary}</p></Card>}
        {(d.strengths?.length > 0 || d.weaknesses?.length > 0) && (
          <Card><ProsConsList strengths={d.strengths} weaknesses={d.weaknesses} /></Card>
        )}
        {d.suggestions?.length > 0 && (
          <Card><SuggestionList suggestions={d.suggestions} /></Card>
        )}
        {d.aiReport && (
          <Card title="AI 分析报告">
            <div className="report">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{d.aiReport}</ReactMarkdown>
            </div>
          </Card>
        )}
        <div className="flex gap-4 justify-center">
          <Button variant="secondary" onClick={reset}>重新分析</Button>
          <Button variant="secondary" onClick={() => window.print()}>打印报告</Button>
        </div>
        <ChatPanel
          mode="风水问答"
          systemPrompt={buildFengshuiQASystemPrompt({
            orientation: d.orientation || '坐北朝南',
            layout: d.layout || d.summary || '',
            ninePalace: d.ninePalace ? JSON.stringify(d.ninePalace) : '',
            strengths: JSON.stringify(d.strengths || []),
            weaknesses: JSON.stringify(d.weaknesses || []),
            overallScore: d.overallScore,
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

  return (
    <div className="flex flex-col gap-6">
      <Card title="户型图分析">
        <div className="flex flex-col gap-4">
          <ImageUpload value={image} onChange={setImage} label="上传户型图" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="朝向" value={orientation} onChange={(e) => setOrientation(e.target.value)}>
              <option value="south">坐北朝南</option>
              <option value="north">坐南朝北</option>
              <option value="east">坐西朝东</option>
              <option value="west">坐东朝西</option>
            </Select>
            <div>
              <span className="input-label">建造年份（选填）</span>
              <input className="input" type="number" value={buildingYear} onChange={(e) => setBuildingYear(e.target.value)} placeholder="如 2020" />
            </div>
          </div>
          <div className="flex gap-2 items-center mt-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#8C8C8C]">
              <input type="checkbox" checked={withBazi} onChange={(e) => setWithBazi(e.target.checked)} className="accent-brand-500" />
              结合生肖匹配
            </label>
            {withBazi && <input className="input !w-[120px]" type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="出生年份" />}
          </div>
          {error && <span className="input-error-msg">{error}</span>}
          <Button onClick={handleAnalyze} loading={loading} disabled={!image} size="lg">开始分析</Button>
        </div>
      </Card>
      {loading && <Card><Loading size={40} text="AI 正在分析户型图，请稍候..." /></Card>}
    </div>
  )
}
