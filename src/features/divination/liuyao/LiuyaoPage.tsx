import { useState, useCallback, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Loading } from '../../../components/ui/Loading'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { HexagramDisplay } from '../HexagramDisplay'
import type { LiuyaoResult, YaoLine, DivinationRecord } from '../types'
import { coinShake, numberCast, randomCast, buildCoinResult } from '../utils/liuyao'
import { generateLiuyaoInterpretation, buildDivinationQASystemPrompt } from '../../../utils/ai'
import { saveDivinationRecord } from '../../../utils/db'
import { ChatPanel } from '../../../components/ui/ChatPanel'

interface LiuyaoPageProps {
  onBack: () => void
  viewingRecord?: DivinationRecord
}

type Method = 'coin' | 'number' | 'random'
type Phase = 'input' | 'result'

export function LiuyaoPage({ onBack, viewingRecord }: LiuyaoPageProps) {
  const [method, setMethod] = useState<Method>('coin')
  const [phase, setPhase] = useState<Phase>(viewingRecord ? 'result' : 'input')
  const [result, setResult] = useState<LiuyaoResult | null>(
    viewingRecord?.type === 'liuyao' ? viewingRecord.hexagramData as LiuyaoResult : null
  )
  const [question, setQuestion] = useState(viewingRecord?.question || '')
  const [interpretation, setInterpretation] = useState<string | null>(
    viewingRecord?.aiInterpretation || null
  )
  const [interpreting, setInterpreting] = useState(false)
  const [interpretError, setInterpretError] = useState<string | null>(null)

  // 从记录查看时跳过输入阶段
  useEffect(() => {
    if (viewingRecord?.type === 'liuyao') {
      setPhase('result')
      setResult(viewingRecord.hexagramData as LiuyaoResult)
      setQuestion(viewingRecord.question || '')
      setInterpretation(viewingRecord.aiInterpretation || null)
    }
  }, [viewingRecord])

  // 摇卦模式
  const [shakeLines, setShakeLines] = useState<YaoLine[]>([])
  const [shakeCount, setShakeCount] = useState(0)

  // 数字模式
  const [num1, setNum1] = useState('')
  const [num2, setNum2] = useState('')
  const [num3, setNum3] = useState('')

  /** 自动 AI 解读 */
  const autoInterpret = useCallback(async (r: LiuyaoResult, q: string) => {
    if (!q.trim()) return // 未填问题则跳过AI解读
    setInterpreting(true)
    setInterpretError(null)
    try {
      const text = await generateLiuyaoInterpretation(r, q)
      setInterpretation(text)
      // 自动保存记录
      const label = `${r.originalName}${r.changedName ? ' 之 ' + r.changedName : ''}`
      const record: DivinationRecord = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        type: 'liuyao',
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

  const handleShake = useCallback(() => {
    if (!question.trim()) return
    if (shakeCount >= 6) return
    const { lines } = coinShake()
    const newLines = [...shakeLines, lines[shakeCount]]
    setShakeLines(newLines)
    const next = shakeCount + 1
    setShakeCount(next)
    if (next >= 6) {
      const coinResult = buildCoinResult(newLines)
      setResult(coinResult)
      setPhase('result')
      autoInterpret(coinResult, question)
    }
  }, [shakeCount, shakeLines, question, autoInterpret])

  const handleNumberCast = useCallback(() => {
    if (!question.trim()) return
    const n1 = parseInt(num1) || Math.floor(Math.random() * 100)
    const n2 = parseInt(num2) || Math.floor(Math.random() * 100)
    const n3 = parseInt(num3) || Math.floor(Math.random() * 100)
    const r = numberCast(n1, n2, n3)
    setResult(r)
    setPhase('result')
    autoInterpret(r, question)
  }, [num1, num2, num3, question, autoInterpret])

  const handleRandomCast = useCallback(() => {
    if (!question.trim()) return
    const r = randomCast()
    setResult(r)
    setPhase('result')
    autoInterpret(r, question)
  }, [question, autoInterpret])

  const handleReinterpret = useCallback(async () => {
    if (!result) return
    setInterpreting(true)
    setInterpretError(null)
    try {
      const text = await generateLiuyaoInterpretation(result, question)
      setInterpretation(text)
    } catch (e: any) {
      setInterpretError(e.message || 'AI解读失败')
    } finally {
      setInterpreting(false)
    }
  }, [result, question])

  const handleReset = useCallback(() => {
    setPhase('input')
    setResult(null)
    setInterpretation(null)
    setInterpretError(null)
    setShakeLines([])
    setShakeCount(0)
    setNum1('')
    setNum2('')
    setNum3('')
    setQuestion('')
  }, [])

  // 结果阶段
  if (phase === 'result' && result) {
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
              <Button variant="ghost" size="sm" onClick={handleReinterpret} className="ml-2">
                重试
              </Button>
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

        {/* 卦象展示 */}
        <Card>
          <div className="flex flex-col md:flex-row justify-center gap-8 items-start print-hexagrams">
            <HexagramDisplay
              hexagram={result.originalHexagram}
              label="本卦"
              changingPositions={result.changingPositions}
            />
            {result.changedHexagram && (
              <div className="flex items-center self-center text-2xl text-[#8C8C8C] font-serif md:self-start md:mt-12">
                →
              </div>
            )}
            {result.changedHexagram && (
              <HexagramDisplay
                hexagram={result.changedHexagram}
                label="变卦"
              />
            )}
          </div>

          {/* 六爻详情 */}
          <div className="mt-6 border-t border-[#E8E0D8] pt-4">
            <div className="text-xs text-[#8C8C8C] mb-2 text-center">六爻（从下往上）</div>
            <div className="space-y-1 max-w-[300px] mx-auto print:max-w-none">
              {[...result.lines].reverse().map((line, i) => {
                const pos = 6 - i
                return (
                  <div key={i} className="flex items-center justify-between text-sm py-0.5">
                    <span className="text-[#8C8C8C] w-16 text-right">
                      {pos === 6 ? '上爻' : pos === 5 ? '五爻' : pos === 4 ? '四爻' : pos === 3 ? '三爻' : pos === 2 ? '二爻' : '初爻'}
                    </span>
                    <span className={line.value === 1 ? 'text-[#2C2C2C]' : 'text-[#8C8C8C]'}>
                      {line.value === 1 ? '━━━ 阳' : '━━ ━━ 阴'}
                    </span>
                    <span className={`text-xs w-16 ${line.changing ? 'text-negative-500 font-semibold' : 'text-[#8C8C8C]'}`}>
                      {line.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* 卦辞释义 */}
        <Card title="卦辞释义">
          <p className="text-sm text-[#8C8C8C] leading-relaxed mb-3">{result.originalHexagram.judgment}</p>
          <p className="text-sm text-[#2C2C2C] leading-relaxed">{result.originalHexagram.meaning}</p>
          {result.changedHexagram && (
            <div className="mt-4 pt-4 border-t border-[#E8E0D8]">
              <p className="text-sm font-semibold text-[#2C2C2C] mb-1">
                变卦 · {result.changedHexagram.name}
              </p>
              <p className="text-sm text-[#2C2C2C] leading-relaxed">{result.changedHexagram.meaning}</p>
            </div>
          )}
        </Card>

        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => window.print()}>打印报告</Button>
        </div>

        <ChatPanel
          mode="算卦问答"
          systemPrompt={buildDivinationQASystemPrompt({
            type: 'liuyao',
            originalName: result.originalName,
            changedName: result.changedName || undefined,
            judgment: result.originalHexagram?.judgment,
            question,
            lines: result.lines.map((l: any) => {
              const posName = l.index === 1 ? '初' : l.index === 2 ? '二' : l.index === 3 ? '三' : l.index === 4 ? '四' : l.index === 5 ? '五' : '上'
              return `第${posName}爻：${l.value === 1 ? '阳' : '阴'}${l.changing ? '（动爻）' : ''}`
            }).join('；'),
          })}
          suggestions={[
            '此卦的总体吉凶如何？',
            '所问之事近期会有转机吗？',
            '变卦对结果有什么影响？',
            '需要注意避免什么问题？',
            '有没有贵人相助的迹象？',
          ]}
        />
      </div>
    )
  }

  // 输入阶段
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>← 返回</Button>
      </div>

      <Card title="六爻起卦">
        {/* 所问之事 - 必须先填写 */}
        <div className="mb-4">
          <span className="input-label">所占之事 <span className="text-negative-500">*</span></span>
          <input
            className="input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请诚心默念所问之事，如：近期事业前程如何？"
          />
          {!question.trim() && (
            <p className="text-xs text-negative-500 mt-1">请先填写所占之事，方可起卦</p>
          )}
        </div>
        {/* 方法选择 */}
        <div className="flex gap-1 mb-6">
          {(['coin', 'number', 'random'] as Method[]).map((m) => (
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
              {m === 'coin' ? '摇卦' : m === 'number' ? '数字' : '随机'}
            </button>
          ))}
        </div>

        {/* 摇卦模式 */}
        {method === 'coin' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-[#8C8C8C] mb-2">
              诚心默念所问之事，点击摇卦，共需六次（从初爻至上爻）
            </div>

            {/* 已摇的爻 */}
            {shakeLines.length > 0 && (
              <div className="w-full max-w-[200px] space-y-1 mb-2">
                {shakeLines.map((line, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <span className="text-[#8C8C8C] text-xs">
                      {i === 0 ? '初爻' : i === 1 ? '二爻' : i === 2 ? '三爻' : i === 3 ? '四爻' : i === 4 ? '五爻' : '上爻'}
                    </span>
                    <span className="flex items-center gap-2">
                      {line.value === 1 ? (
                        <div className="w-10 h-[4px] bg-[#2C2C2C] rounded-sm" />
                      ) : (
                        <div className="flex gap-[6px] w-10">
                          <div className="flex-1 h-[4px] bg-[#2C2C2C] rounded-sm" />
                          <div className="flex-1 h-[4px] bg-[#2C2C2C] rounded-sm" />
                        </div>
                      )}
                      <span className={`text-xs ${line.changing ? 'text-negative-500 font-semibold' : 'text-[#8C8C8C]'}`}>
                        {line.label}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center">
              {shakeCount < 6 ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-6xl animate-bounce">🪙</div>
                  <Button onClick={handleShake} size="lg">
                    摇卦（第 {shakeCount + 1}/6 次）
                  </Button>
                </div>
              ) : (
                <div className="text-positive-600 font-serif">六爻已成，正在排盘...</div>
              )}
            </div>
          </div>
        )}

        {/* 数字模式 */}
        {method === 'number' && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-[#8C8C8C]">
              输入三个数字（0-999），分别对应上卦、下卦、动爻
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="input-label">上卦数</span>
                <input className="input" type="number" value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="如 3" />
              </div>
              <div>
                <span className="input-label">下卦数</span>
                <input className="input" type="number" value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="如 6" />
              </div>
              <div>
                <span className="input-label">动爻数</span>
                <input className="input" type="number" value={num3} onChange={(e) => setNum3(e.target.value)} placeholder="如 9" />
              </div>
            </div>
            <Button onClick={handleNumberCast} size="lg">起卦</Button>
          </div>
        )}

        {/* 随机模式 */}
        {method === 'random' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-[#8C8C8C] text-center">
              一键随机起卦，系统自动生成完整六爻卦象
            </div>
            <div className="text-5xl">🎲</div>
            <Button onClick={handleRandomCast} size="lg">随机起卦</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
