import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { ReportView } from '../../report/ReportView'
import { FENGSHUI_SPEC } from './fengshuiSpec'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { ImageUpload } from '../../components/form/ImageUpload'
import { Loading } from '../../components/ui/Loading'
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
      <div className="flex flex-col gap-5">
        {/* 章节结构由 FENGSHUI_SPEC 描述。本页没有 AI 报告，
            故不传 ai 槽位——ReportView 会整章跳过（视为"本章不存在"）。 */}
        <ReportView
          spec={FENGSHUI_SPEC}
          ctx={{
            result: {
              scoreLabel: '楼盘评分',
              score: d.overallScore || 0,
              summary: d.summary,
              strengths: d.strengths,
              weaknesses: d.weaknesses,
              suggestions: d.suggestions,
              environment: typeof d.environment === 'string'
                ? d.environment
                : (d.environment ? JSON.stringify(d.environment, null, 2) : undefined),
            },
          }}
        />
        <div className="actions">
          <Button variant="mist" onClick={reset}>重新分析</Button>
          <Button variant="clear" onClick={() => window.print()}>打印报告</Button>
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
    <div className="flex flex-col gap-5">
      <Card title="楼盘位置分析">
        <div className="flex flex-col gap-4">
          <div className="ds-segmented mb-2">
            <button type="button" onClick={() => setMode('text')}
              className={`ds-seg-item ${mode === 'text' ? 'active' : ''}`}>文字描述</button>
            <button type="button" onClick={() => setMode('image')}
              className={`ds-seg-item ${mode === 'image' ? 'active' : ''}`}>上传图片</button>
          </div>

          {mode === 'text' ? (
            <div>
              <span className="ds-label">描述楼盘周边环境</span>
              <textarea className="field resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述楼盘位置、周边道路、建筑分布、自然环境等..." rows={5} />
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
              <span className="ds-label">建造年份（选填）</span>
              <input className="field" type="number" value={buildingYear} onChange={(e) => setBuildingYear(e.target.value)} placeholder="如 2020" />
            </div>
          </div>

          {error && <span className="ds-field-error">{error}</span>}

          <Button onClick={handleAnalyze} loading={loading} disabled={(mode === 'text' && !description) || (mode === 'image' && !image)} size="lg">开始分析</Button>
        </div>
      </Card>

      {loading && <Card><Loading text="AI 正在分析楼盘环境，请稍候..." /></Card>}
    </div>
  )
}
