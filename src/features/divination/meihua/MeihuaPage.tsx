import { useState, useCallback, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Loading } from '../../../components/ui/Loading'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { HexagramDisplay } from '../HexagramDisplay'
import { elementColors } from '../utils/trigrams'
import type { MeihuaResult, DivinationRecord } from '../types'
import { meihuaNumberCast, meihuaCurrentTimeCast, meihuaTextCast } from '../utils/meihua'
import { generateMeihuaInterpretation, buildDivinationQASystemPrompt } from '../../../utils/ai'
import { saveDivinationRecord } from '../../../utils/db'
import { ChatPanel } from '../../../components/ui/ChatPanel'

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

  /** 自动 AI 解读 */
  const autoInterpret = useCallback(async (r: MeihuaResult, q: string) => {
    if (!q.trim()) return
    setInterpreting(true)
    setInterpretError(null)
    try {
      const text = await generateMeihuaInterpretation(r, q)
      setInterpretation(text)
      // 自动保存记录
      const label = `${r.originalHexagram.name} 之 ${r.changedHexagram.name}`
      const record: DivinationRecord = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        type: 'meihua',
        method: r.method,
        question: q,
        hexagramData: r,
        aiInterpretation: text,
        createdAt: Date.now(),
        label,
      }
      await saveDivinationRecord(record)
    } catch (e: any) {
      setInterpretError(e.message || 'AI解读失败')
    } finally {
      setInterpreting(false)
    }
  }, [])

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
  }, [])

  // 结果阶段
  if (phase === 'result' && result) {
    const tyColor = elementColors[result.tiYong.tiElement]
    const yyColor = elementColors[result.tiYong.yongElement]
    const relColor = result.tiYong.relation === '体用比和' || result.tiYong.relation === '用生体'
      ? 'text-positive-600 bg-positive-50 border-positive-200'
      : result.tiYong.relation === '体克用'
      ? 'text-brand-600 bg-brand-50 border-brand-200'
      : 'text-negative-600 bg-negative-50 border-negative-200'

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="ghost" size="sm" onClick={handleReset}>← 重新起卦</Button>
        </div>

        {/* AI 解读 */}
        <Card title="AI 解读">
          <div className="text-sm text-[#8C8C8C] italic mb-3">
            所问之事：{question || '（未填写）'}
          </div>

          {interpreting && <Loading text="御笔判官正在解卦..." />}

          {interpretError && (
            <div className="p-3 bg-negative-50 text-negative-600 rounded-lg text-sm">
              {interpretError}
              <Button variant="ghost" size="sm" onClick={() => result && autoInterpret(result, question)} className="ml-2">重试</Button>
            </div>
          )}

          {interpretation && (
            <div className="report">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{interpretation}</ReactMarkdown>
            </div>
          )}

          {!interpreting && !interpretError && !interpretation && (
            <div className="text-sm text-[#8C8C8C] text-center py-4">等待 AI 解读完成...</div>
          )}
        </Card>

        {/* 本卦 + 互卦 + 变卦 */}
        <Card>
          <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 items-start print-hexagrams">
            <HexagramDisplay
              hexagram={result.originalHexagram}
              label="本卦"
              changingPositions={[result.changingYao]}
            />
            <div className="flex items-center self-center text-xl text-[#8C8C8C] font-serif md:self-start md:mt-12">
              →
            </div>
            <HexagramDisplay
              hexagram={result.huHexagram}
              label="互卦"
            />
            <div className="flex items-center self-center text-xl text-[#8C8C8C] font-serif md:self-start md:mt-12">
              →
            </div>
            <HexagramDisplay
              hexagram={result.changedHexagram}
              label="变卦"
            />
          </div>
        </Card>

        {/* 体用生克 */}
        <Card title="体用生克分析">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-4 rounded-lg text-center ${tyColor.bg} ${tyColor.border} border`}>
              <div className="text-xs text-[#8C8C8C] mb-1">体卦（我）</div>
              <div className="text-2xl font-serif mb-1">{result.tiYong.ti.symbol}</div>
              <div className={`font-semibold ${tyColor.text}`}>{result.tiYong.ti.name} · {result.tiYong.tiElement}</div>
              <div className="text-xs text-[#8C8C8C] mt-1">{result.tiYong.ti.image} · {result.tiYong.ti.direction}</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${yyColor.bg} ${yyColor.border} border`}>
              <div className="text-xs text-[#8C8C8C] mb-1">用卦（事）</div>
              <div className="text-2xl font-serif mb-1">{result.tiYong.yong.symbol}</div>
              <div className={`font-semibold ${yyColor.text}`}>{result.tiYong.yong.name} · {result.tiYong.yongElement}</div>
              <div className="text-xs text-[#8C8C8C] mt-1">{result.tiYong.yong.image} · {result.tiYong.yong.direction}</div>
            </div>
          </div>
          <div className={`p-3 rounded-lg border text-center ${relColor}`}>
            <span className="font-serif font-bold text-lg">{result.tiYong.relation}</span>
            <p className="text-sm mt-1">{result.tiYong.judgment}</p>
          </div>
        </Card>

        {/* 卦辞释义 */}
        <Card title="卦辞释义">
          <p className="text-sm text-[#8C8C8C] leading-relaxed mb-3">{result.originalHexagram.judgment}</p>
          <p className="text-sm text-[#2C2C2C] leading-relaxed mb-4">{result.originalHexagram.meaning}</p>
          <div className="border-t border-[#E8E0D8] pt-3">
            <p className="text-xs text-[#8C8C8C] mb-1">互卦 · {result.huHexagram.name}</p>
            <p className="text-sm text-[#2C2C2C] leading-relaxed mb-3">{result.huHexagram.meaning}</p>
            <p className="text-xs text-[#8C8C8C] mb-1">变卦 · {result.changedHexagram.name}</p>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">{result.changedHexagram.meaning}</p>
          </div>
        </Card>

        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => window.print()}>打印报告</Button>
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
        <Button variant="ghost" size="sm" onClick={onBack}>← 返回</Button>
      </div>

      <Card title="梅花易数起卦">
        {/* 所占之事 - 必须先填写 */}
        <div className="mb-4">
          <span className="input-label">所占之事 <span className="text-negative-500">*</span></span>
          <input
            className="input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请诚心默念所问之事，如：婚姻是否顺遂？"
          />
          {!question.trim() && (
            <p className="text-xs text-negative-500 mt-1">请先填写所占之事，方可起卦</p>
          )}
        </div>
        {/* 方法选择 */}
        <div className="flex gap-1 mb-6">
          {(['number', 'time', 'text'] as Method[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm cursor-pointer transition-all ${
                method === m
                  ? 'bg-brand-500 text-white'
                  : 'bg-paper-200 text-[#8C8C8C]'
              }`}
            >
              {m === 'number' ? '数字' : m === 'time' ? '时间' : '文字'}
            </button>
          ))}
        </div>

        {/* 数字模式 */}
        {method === 'number' && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-[#8C8C8C]">
              输入三个数字，对应上卦、下卦、动爻（第三数可选）
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="input-label">上卦数</span>
                <input className="input" type="number" value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="第一个数" />
              </div>
              <div>
                <span className="input-label">下卦数</span>
                <input className="input" type="number" value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="第二个数" />
              </div>
              <div>
                <span className="input-label">动爻数（选填）</span>
                <input className="input" type="number" value={num3} onChange={(e) => setNum3(e.target.value)} placeholder="第三个数" />
              </div>
            </div>
            <Button onClick={handleNumberCast} size="lg">起卦</Button>
          </div>
        )}

        {/* 时间模式 */}
        {method === 'time' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-[#8C8C8C] text-center">
              以当前时间起卦，取年月日时之数推算卦象
            </div>
            <div className="p-4 bg-paper-200 rounded-lg text-center">
              <div className="text-sm text-[#8C8C8C]">当前时间</div>
              <div className="font-serif text-lg text-[#2C2C2C]">{timeLabel}</div>
            </div>
            <Button onClick={handleTimeCast} size="lg">以此时起卦</Button>
          </div>
        )}

        {/* 文字模式 */}
        {method === 'text' && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-[#8C8C8C]">
              输入2-4个汉字（如人名、地名、物品名），按笔画数推算卦象
            </div>
            <div>
              <span className="input-label">起卦文字</span>
              <input
                className="input"
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
