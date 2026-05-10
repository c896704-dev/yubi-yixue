import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { ImageUpload } from '../../components/form/ImageUpload'
import { Loading } from '../../components/ui/Loading'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ScoreGauge } from '../../components/viz/ScoreGauge'
import { ProsConsList } from './ProsConsList'
import { SuggestionList } from './SuggestionList'
import { ChatPanel } from '../../components/ui/ChatPanel'
import { buildFengshuiQASystemPrompt } from '../../utils/ai'
import { useFengshui } from '../../hooks/useFengshui'

export function LocationAnalysis() {
  const { loading, result, error, runLocationAnalysis, reset } = useFengshui()
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [mode, setMode] = useState<'text' | 'image'>('text')
  const [orientation, setOrientation] = useState('south')
  const [buildingYear, setBuildingYear] = useState('')
  const handleAnalyze = async () => {
    if (mode === 'text' && !description) return
    if (mode === 'image' && !image) return
    try {
      await runLocationAnalysis({
        images: mode === 'image' && image ? [image] : undefined,
        description: mode === 'text' ? description : undefined,
        orientation,
        buildingYear: buildingYear ? Number(buildingYear) : undefined,
        mode: 'simple',
      } as any)
    } catch {}
  }

  if (result) {
    const d = (result as any).data || result
    return (
      <div className="flex flex-col gap-6">
        <Card><div className="text-center"><ScoreGauge score={d.overallScore || 0} label="楼盘评分" /></div></Card>
        {d.summary && <Card title="分析总结"><p className="text-[15px] text-[#2C2C2C] leading-relaxed">{d.summary}</p></Card>}
        {(d.strengths?.length > 0 || d.weaknesses?.length > 0) && (
          <Card><ProsConsList strengths={d.strengths} weaknesses={d.weaknesses} /></Card>
        )}
        {d.suggestions?.length > 0 && (
          <Card><SuggestionList suggestions={d.suggestions} /></Card>
        )}
        {d.environment && (
          <Card title="环境分析">
            <div className="text-sm text-[#8C8C8C] leading-relaxed whitespace-pre-wrap">
              {typeof d.environment === 'string' ? d.environment : JSON.stringify(d.environment, null, 2)}
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
            orientation: d.orientation || '',
            layout: d.summary || '',
            ninePalace: d.ninePalace ? JSON.stringify(d.ninePalace) : '',
            strengths: JSON.stringify(d.strengths || []),
            weaknesses: JSON.stringify(d.weaknesses || []),
            overallScore: d.overallScore,
          })}
          suggestions={[
            '此楼盘风水总体如何？',
            '周边环境有什么形煞？',
            '适合经商还是居住？',
            '哪个朝向更好？',
            '需要注意什么风水问题？',
          ]}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="楼盘位置分析">
        <div className="flex flex-col gap-4">
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm cursor-pointer transition-all ${
                mode === 'text' ? 'bg-brand-500 text-white' : 'bg-paper-200 text-[#8C8C8C]'
              }`}
            >文字描述</button>
            <button
              type="button"
              onClick={() => setMode('image')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm cursor-pointer transition-all ${
                mode === 'image' ? 'bg-brand-500 text-white' : 'bg-paper-200 text-[#8C8C8C]'
              }`}
            >上传图片</button>
          </div>

          {mode === 'text' ? (
            <div>
              <span className="input-label">描述楼盘周边环境</span>
              <textarea className="input resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述楼盘位置、周边道路、建筑分布、自然环境等..." rows={5} />
            </div>
          ) : (
            <ImageUpload value={image} onChange={setImage} label="上传周边环境照片" />
          )}

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

          {error && <span className="input-error-msg">{error}</span>}

          <Button onClick={handleAnalyze} loading={loading} disabled={(mode === 'text' && !description) || (mode === 'image' && !image)} size="lg">开始分析</Button>
        </div>
      </Card>

      {loading && <Card><Loading size={40} text="AI 正在分析楼盘环境，请稍候..." /></Card>}
    </div>
  )
}
