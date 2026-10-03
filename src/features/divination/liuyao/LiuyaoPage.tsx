import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { RefreshCw } from '../../../components/ui/Icon'
import { Loading } from '../../../components/ui/Loading'
import { ReportMarkdown } from '../../../report/ReportMarkdown'
import { HexagramDisplay } from '../HexagramDisplay'
import type { LiuyaoResult, YaoLine, DivinationRecord } from '../types'
import { coinShake, numberCast, randomCast, buildCoinResult } from '../utils/liuyao'
import { generateLiuyaoInterpretation, buildDivinationQASystemPrompt } from '../../../utils/ai'
import { saveDivinationRecord } from '../../../utils/db'
import { ChatPanel } from '../../../components/ui/ChatPanel'
import { ReportView } from '../../../report/ReportView'
import { LIUYAO_SPEC } from './liuyaoSpec'
import { buildLiuyaoAnalysisView, buildLiuyaoAnalysisContext } from './liuyaoAnalysis'
import { determineLiuyaoYongShen } from '../utils/liuyao-yongshen'
import { analyzeSiShen } from '../../../utils/sishen'
import { analyzeMoonDayStrength } from '../../../utils/strength'
import { computeYingQiLiuyao } from '../../../utils/yingqi'
import { getDuanYu } from '../../../utils/duanyu'

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
  // 摇卦锁：防止快速连点导致同一次回调重复追加爻（闭包竞态）
  const shakingRef = useRef(false)

  // 数字模式
  const [num1, setNum1] = useState('')
  const [num2, setNum2] = useState('')
  const [num3, setNum3] = useState('')
  const [activeLiuyaoHex, setActiveLiuyaoHex] = useState('original')

  /** 六爻代码层分析的派生量：显示版与 AI 版共用同一套计算，保证两边结论一致 */
  const analysisText = useMemo(() => {
    if (!result) return null
    return buildLiuyaoAnalysisView(result, question)
  }, [result, question])

  const recordIdRef = useRef<string | null>(null)

  /** 自动 AI 解读 */
  const autoInterpret = useCallback(async (r: LiuyaoResult, q: string) => {
    if (!q.trim()) return // 未填问题则跳过AI解读
    setInterpreting(true)
    setInterpretError(null)

    // 第一步：先生成 id 和 label
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    const label = `${r.originalName}${r.changedName ? ' 之 ' + r.changedName : ''}`
    recordIdRef.current = id

    // 第二步：立即保存基础记录（不含 AI 解读）
    const record: DivinationRecord = {
      id, type: 'liuyao', method: r.method, question: q,
      hexagramData: r, aiInterpretation: null, createdAt: Date.now(), label,
    }
    await saveDivinationRecord(record)

    // 第三步：请求 AI，完成后更新记录
    try {
      // AI 输入取自已声明在 LIUYAO_SPEC.aiContext 上的同一个 builder——
      // 与显示用的 buildLiuyaoAnalysisView 同源不同用，改显示不会再削 AI 上下文
      const codeAnalysis = buildLiuyaoAnalysisContext(r, q)
      const text = await generateLiuyaoInterpretation(r, q, undefined, codeAnalysis)
      setInterpretation(text)
      // 用 AI 解读更新已保存的记录
      await saveDivinationRecord({ ...record, aiInterpretation: text })
    } catch (e: any) {
      setInterpretError(e.message || 'AI解读失败')
    } finally {
      setInterpreting(false)
    }
  }, [])

  const handleShake = useCallback(() => {
    if (!question.trim()) return
    if (shakeCount >= 6) return
    // 防止同一闭包内重复追加（连点竞态）
    if (shakingRef.current) return
    shakingRef.current = true
    try {
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
    } finally {
      // 下一帧释放锁，确保连点只追加一次
      setTimeout(() => { shakingRef.current = false }, 0)
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
    shakingRef.current = false
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
          <Button variant="clear" size="sm" onClick={handleReset}>← 重新起卦</Button>
        </div>

        {/* 基础信息 */}
        {result.naja?.sizhu && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[11px] rounded-lg p-3"
            style={{ color: 'rgba(0,77,77,0.55)', backgroundColor: 'var(--bg)' }}>
            <span>公历：{result.naja.castTime}</span>
            <span>|</span>
            <span>四柱：{result.naja.sizhu.year.full} {result.naja.sizhu.month.full} {result.naja.sizhu.day.full} {result.naja.sizhu.hour.full}</span>
            <span>|</span>
            <span>月令：{result.naja.jieqi}</span>
            <span>|</span>
            <span>策数：{result.naja.ceShu} 轨数：{result.naja.guiShu}</span>
          </div>
        )}

        {/* 报告结构由 LIUYAO_SPEC 描述：卦象 / 卦理分析 / 卦辞释义 / 传统断语 / AI 解读。
            序号、锚点、目录、折叠、AI 承载由 ReportView 统一处理。 */}
        <ReportView
          spec={LIUYAO_SPEC}
          ctx={{
            result: {
              result, question, analysisText, interpreting, interpretError, interpretation,
              activeLiuyaoHex, setActiveLiuyaoHex, handleReinterpret,
            },
            ai: {
              'ai-liuyao': {
                text: interpretation,
                loading: interpreting,
                error: interpretError,
                // 三个按钮（重试 / 首次等待）收敛为卡头一个，行为不变
                action: !interpreting ? (
                  <Button variant="ghost" size="sm" onClick={handleReinterpret} className="no-print">
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
            type: 'liuyao',
            originalName: result.originalName,
            changedName: result.changedName || undefined,
            judgment: result.originalHexagram?.judgment,
            question,
            lines: (result.naja?.lines || result.lines).map((l: any) => {
              const posName = l.index === 1 ? '初' : l.index === 2 ? '二' : l.index === 3 ? '三' : l.index === 4 ? '四' : l.index === 5 ? '五' : '上'
              return `${posName}爻 ${l.gan||''}${l.zhi||''} ${l.wuxing||''} ${l.liuqin||''} ${l.shiying||''} ${l.value?'阳':'阴'}${l.changing?'(动)':''}`
            }).join('；'),
            naja: result.naja ? `${result.naja.palaceName}宫${result.naja.palaceElement}，${result.naja.isLiuChong?'六冲卦，':''}${result.naja.isStatic?'静卦':'有动爻'}，月建${result.naja.monthZhi}月${result.naja.monthWuxing}，日辰${result.naja.dayZhi}日${result.naja.dayWuxing}` : '',
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
        <Button variant="clear" size="sm" onClick={onBack}>← 返回</Button>
      </div>

      <Card title="六爻起卦">
        {/* 所问之事 - 必须先填写 */}
        <div className="mb-4">
          <span className="ds-label">所占之事 <span style={{ color: 'var(--danger)' }}>*</span></span>
          <input
            className="field"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请诚心默念所问之事，如：近期事业前程如何？"
          />
          {!question.trim() && (
            <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>请先填写所占之事，方可起卦</p>
          )}
        </div>
        {/* 方法选择 */}
        <div className="flex gap-1 mb-6">
          {(['coin', 'number', 'random'] as Method[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className="flex-1 py-2 px-4 rounded-lg text-sm cursor-pointer transition-all"
              style={method === m ? { backgroundColor: 'var(--primary)', color: '#fbfaf5' } : { backgroundColor: 'var(--bg)', color: 'rgba(0,77,77,0.55)' }}
            >
              {m === 'coin' ? '摇卦' : m === 'number' ? '数字' : '随机'}
            </button>
          ))}
        </div>

        {/* 摇卦模式 */}
        {method === 'coin' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm mb-2" style={{ color: 'rgba(0,77,77,0.55)' }}>
              诚心默念所问之事，点击摇卦，共需六次（从初爻至上爻）
            </div>

            {/* 已摇的爻 */}
            {shakeLines.length > 0 && (
              <div className="w-full max-w-[200px] space-y-1 mb-2">
                {shakeLines.map((line, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <span className="text-xs" style={{ color: 'rgba(0,77,77,0.55)' }}>
                      {i === 0 ? '初爻' : i === 1 ? '二爻' : i === 2 ? '三爻' : i === 3 ? '四爻' : i === 4 ? '五爻' : '上爻'}
                    </span>
                    <span className="flex items-center gap-2">
                      {line.value === 1 ? (
                        <div className="w-10 h-[4px] rounded-sm" style={{ backgroundColor: 'var(--fg)' }} />
                      ) : (
                        <div className="flex gap-[6px] w-10">
                          <div className="flex-1 h-[4px] rounded-sm" style={{ backgroundColor: 'var(--fg)' }} />
                          <div className="flex-1 h-[4px] rounded-sm" style={{ backgroundColor: 'var(--fg)' }} />
                        </div>
                      )}
                      <span className={`text-xs ${line.changing ? 'font-semibold' : ''}`}
                        style={line.changing ? { color: 'var(--danger)' } : { color: 'rgba(0,77,77,0.55)' }}>
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
                <div className="font-[family-name:var(--font-title)]" style={{ color: 'var(--success)' }}>六爻已成，正在排盘...</div>
              )}
            </div>
          </div>
        )}

        {/* 数字模式 */}
        {method === 'number' && (
          <div className="flex flex-col gap-4">
            <div className="text-sm" style={{ color: 'rgba(0,77,77,0.55)' }}>
              输入三个数字（0-999），分别对应上卦、下卦、动爻
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div>
                <span className="ds-label">上卦数</span>
                <input className="field" type="number" value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="如 3" />
              </div>
              <div>
                <span className="ds-label">下卦数</span>
                <input className="field" type="number" value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="如 6" />
              </div>
              <div>
                <span className="ds-label">动爻数</span>
                <input className="field" type="number" value={num3} onChange={(e) => setNum3(e.target.value)} placeholder="如 9" />
              </div>
            </div>
            <Button onClick={handleNumberCast} size="lg">起卦</Button>
          </div>
        )}

        {/* 随机模式 */}
        {method === 'random' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-center" style={{ color: 'rgba(0,77,77,0.55)' }}>
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
