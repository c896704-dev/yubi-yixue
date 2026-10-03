import { useState, useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { RefreshCw } from '../../../components/ui/Icon'
import { Loading } from '../../../components/ui/Loading'
import { ReportMarkdown } from '../../../report/ReportMarkdown'
import { HexagramDisplay } from '../HexagramDisplay'
import { elementColors } from '../utils/trigrams'
import type { MeihuaResult, DivinationRecord } from '../types'
import { meihuaNumberCast, meihuaCurrentTimeCast, meihuaTextCast } from '../utils/meihua'
import { generateMeihuaInterpretation, buildDivinationQASystemPrompt } from '../../../utils/ai'
import { saveDivinationRecord } from '../../../utils/db'
import { ChatPanel } from '../../../components/ui/ChatPanel'
import { ReportView } from '../../../report/ReportView'
import { MEIHUA_SPEC } from './meihuaSpec'
import { buildMeihuaAnalysisView, buildMeihuaAnalysisContext } from './meihuaAnalysis'
import { evalTiYongComprehensive } from '../../../utils/tiyong'
import { computeYingQiMeihua } from '../../../utils/yingqi'
import { getDuanYu } from '../../../utils/duanyu'
import { getEighteenZhan } from '../../../utils/zhantiduans'
import { getSizhu } from '../../../utils/ganzhi'
import { getLunarMonth } from '../utils/meihua'

interface MeihuaPageProps {
  onBack: () => void
  viewingRecord?: DivinationRecord
}

type Method = 'number' | 'time' | 'text'
type Phase = 'input' | 'result'

export function MeihuaPage({ onBack, viewingRecord }: MeihuaPageProps) {
  const [method, setMethod] = useState<Method>('number')
  const [phase, setPhase] = useState<Phase>(viewingRecord ? 'result' : 'input')
  const [result, setResult] = useState<MeihuaResult | null>(
    viewingRecord?.type === 'meihua' ? viewingRecord.hexagramData as MeihuaResult : null
  )
  const [question, setQuestion] = useState(viewingRecord?.question || '')
  const [interpretation, setInterpretation] = useState<string | null>(
    viewingRecord?.aiInterpretation || null
  )
  const [interpreting, setInterpreting] = useState(false)
  const [interpretError, setInterpretError] = useState<string | null>(null)
  const [omen, setOmen] = useState('')  // F-12: 外应
  const [activeDuanHex, setActiveDuanHex] = useState('original')

  // 从记录查看时跳过输入阶段
  useEffect(() => {
    if (viewingRecord?.type === 'meihua') {
      setPhase('result')
      setResult(viewingRecord.hexagramData as MeihuaResult)
      setQuestion(viewingRecord.question || '')
      setInterpretation(viewingRecord.aiInterpretation || null)
    }
  }, [viewingRecord])

  // 数字模式
  const [num1, setNum1] = useState('')
  const [num2, setNum2] = useState('')
  const [num3, setNum3] = useState('')

  // 文字模式
  const [textInput, setTextInput] = useState('')

  const meihuaAnalysis = useMemo(() => {
    if (!result) return null
    return buildMeihuaAnalysisView(result)
  }, [result])

  const recordIdRef = useRef<string | null>(null)

  /** 自动 AI 解读 */
  const autoInterpret = useCallback(async (r: MeihuaResult, q: string) => {
    if (!q.trim()) return
    setInterpreting(true)
    setInterpretError(null)

    // 第一步：先生成 id 和 label，立即保存基础记录
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    const label = `${r.originalHexagram.name} 之 ${r.changedHexagram.name}`
    recordIdRef.current = id

    const record: DivinationRecord = {
      id, type: 'meihua', method: r.method, question: q,
      hexagramData: r, aiInterpretation: null, createdAt: Date.now(), label,
    }
    await saveDivinationRecord(record)

    // 第二步：请求 AI，完成后更新记录
    try {
      const ma = buildMeihuaAnalysisContext(r)
      const text = await generateMeihuaInterpretation(r, q, omen, ma)
      setInterpretation(text)
      await saveDivinationRecord({ ...record, aiInterpretation: text })
    } catch (e: any) {
      setInterpretError(e.message || 'AI解读失败')
    } finally {
      setInterpreting(false)
    }
  }, [omen])

  const handleNumberCast = useCallback(() => {
    if (!question.trim()) return
    const n1 = parseInt(num1) || Math.floor(Math.random() * 100)
    const n2 = parseInt(num2) || Math.floor(Math.random() * 100)
    const n3 = num3 ? parseInt(num3) : undefined
    const r = meihuaNumberCast(n1, n2, n3)
    setResult(r)
    setPhase('result')
    autoInterpret(r, question)
  }, [num1, num2, num3, question, autoInterpret])

  const handleTimeCast = useCallback(() => {
    if (!question.trim()) return
    const r = meihuaCurrentTimeCast()
    setResult(r)
    setPhase('result')
    autoInterpret(r, question)
  }, [question, autoInterpret])

  const handleTextCast = useCallback(() => {
    if (!question.trim() || !textInput.trim()) return
    const r = meihuaTextCast(textInput.trim())
    setResult(r)
    setPhase('result')
    autoInterpret(r, question)
  }, [textInput, question, autoInterpret])

  const handleReset = useCallback(() => {
    setPhase('input')
    setResult(null)
    setInterpretation(null)
    setInterpretError(null)
    setNum1('')
    setNum2('')
    setNum3('')
    setTextInput('')
    setQuestion('')
    setOmen('')
    setActiveDuanHex('original')
  }, [])

  // 结果阶段
  if (phase === 'result' && result) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="clear" size="sm" onClick={handleReset}>← 重新起卦</Button>
        </div>

        {/* 报告结构由 MEIHUA_SPEC 描述：卦象 / 体用生克 / 卦理分析 / 卦辞释义 / 传统断语 / 专题占断 / AI 解读。
            序号、锚点、目录、折叠、AI 承载由 ReportView 统一处理。 */}
        <ReportView
          spec={MEIHUA_SPEC}
          ctx={{
            result: { result, meihuaAnalysis, interpretation, interpreting, interpretError, activeDuanHex, setActiveDuanHex, autoInterpret, question },
            ai: {
              'ai-meihua': {
                text: interpretation,
                loading: interpreting,
                error: interpretError,
                action: !interpreting ? (
                  <Button variant="ghost" size="sm" onClick={() => result && autoInterpret(result, question)} className="no-print">
                    <RefreshCw size={13} style={{ marginRight: 6 }} />
                    {interpretError ? '重试解读' : interpretation ? '重新解读' : '生成解读'}
                  </Button>
                ) : null,
              },
            },
          }}
        />
        <div className="flex justify-center">
          <Button variant="mist" onClick={() => window.print()}>打印报告</Button>
        </div>

        <ChatPanel
          mode="算卦问答"
          systemPrompt={buildDivinationQASystemPrompt({
            type: 'meihua',
            originalName: result.originalHexagram.name,
            changedName: result.changedHexagram.name,
            judgment: result.originalHexagram.judgment,
            question,
            tiYong: `体卦${result.tiYong.ti.name}（${result.tiYong.tiElement}），用卦${result.tiYong.yong.name}（${result.tiYong.yongElement}），${result.tiYong.relation}`,
            seasonal: `${result.seasonalStrength?.monthName || ''} ${result.seasonalStrength?.summary || ''}`,
            yingQi: result.yingQi?.timeRange || '',
            cuoZong: `${result.cuoHexagram ? '错卦：' + result.cuoHexagram.name : ''}${result.zongHexagram ? ' 综卦：' + result.zongHexagram.name : result.zongHexagram === null ? ' 无综卦' : ''}`,
          })}
          suggestions={[
            '此卦的体用关系怎么理解？',
            '所问之事近期会有转机吗？',
            '互卦对中间过程有什么影响？',
            '需要注意避免什么问题？',
            '有没有贵人相助的迹象？',
          ]}
        />
      </div>
    )
  }

  // 输入阶段
  const now = new Date()
  const timeLabel = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}时${now.getMinutes()}分`

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="clear" size="sm" onClick={onBack}>← 返回</Button>
      </div>

      <Card title="梅花易数起卦">
        {/* 所占之事 - 必须先填写 */}
        <div className="mb-4">
          <span className="ds-label">所占之事 <span style={{ color: 'var(--danger)' }}>*</span></span>
          <input
            className="field"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请诚心默念所问之事，如：婚姻是否顺遂？"
          />
          {!question.trim() && (
            <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>请先填写所占之事，方可起卦</p>
          )}
        </div>

        {/* F-12: 外应记录（选填） */}
        <div className="mb-4">
          <span className="ds-label">外应（选填）</span>
          <input
            className="field"
            value={omen}
            onChange={(e) => setOmen(e.target.value)}
            placeholder="起卦时身边发生的值得注意之事，如：鸡鸣、风吹帘动、人来电话..."
          />
        </div>

        {/* 方法选择 */}
        <div className="flex gap-1 mb-6">
          {(['number', 'time', 'text'] as Method[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className="flex-1 py-2 px-4 rounded-lg text-sm cursor-pointer transition-all"
              style={method === m ? { backgroundColor: 'var(--primary)', color: '#fbfaf5' } : { backgroundColor: 'var(--bg)', color: 'rgba(0,77,77,0.55)' }}
            >
              {m === 'number' ? '数字' : m === 'time' ? '时间' : '文字'}
            </button>
          ))}
        </div>

        {/* 数字模式 */}
        {method === 'number' && (
          <div className="flex flex-col gap-4">
            <div className="text-sm" style={{ color: 'rgba(0,77,77,0.55)' }}>
              输入三个数字，对应上卦、下卦、动爻（第三数可选）
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div>
                <span className="ds-label">上卦数</span>
                <input className="field" type="number" value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="第一个数" />
              </div>
              <div>
                <span className="ds-label">下卦数</span>
                <input className="field" type="number" value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="第二个数" />
              </div>
              <div>
                <span className="ds-label">动爻数（选填）</span>
                <input className="field" type="number" value={num3} onChange={(e) => setNum3(e.target.value)} placeholder="第三个数" />
              </div>
            </div>
            <Button onClick={handleNumberCast} size="lg">起卦</Button>
          </div>
        )}

        {/* 时间模式 */}
        {method === 'time' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-center" style={{ color: 'rgba(0,77,77,0.55)' }}>
              以当前时间起卦，取年月日时之数推算卦象
            </div>
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg)' }}>
              <div className="text-sm" style={{ color: 'rgba(0,77,77,0.55)' }}>当前时间</div>
              <div className="font-[family-name:var(--font-title)] text-lg" style={{ color: 'var(--fg)' }}>{timeLabel}</div>
            </div>
            <Button onClick={handleTimeCast} size="lg">以此时起卦</Button>
          </div>
        )}

        {/* 文字模式 */}
        {method === 'text' && (
          <div className="flex flex-col gap-4">
            <div className="text-sm" style={{ color: 'rgba(0,77,77,0.55)' }}>
              输入2-4个汉字（如人名、地名、物品名），按笔画数推算卦象
            </div>
            <div>
              <span className="ds-label">起卦文字</span>
              <input
                className="field"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="如：梅花易数"
                maxLength={10}
              />
            </div>
            <Button onClick={handleTextCast} size="lg" disabled={!textInput.trim()}>
              起卦
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
