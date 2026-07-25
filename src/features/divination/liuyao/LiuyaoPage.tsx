import { useState, useCallback, useEffect, useMemo } from 'react'
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

  // 数字模式
  const [num1, setNum1] = useState('')
  const [num2, setNum2] = useState('')
  const [num3, setNum3] = useState('')
  const [activeLiuyaoHex, setActiveLiuyaoHex] = useState('original')

  /** 构建六爻代码层分析 */
  const buildLiuyaoCodeAnalysis = (r: LiuyaoResult, q: string): string | null => {
    const naja = r.naja
    if (!naja) return null
    const lines = naja.lines
    // 用神定位
    const ys = determineLiuyaoYongShen(lines, q)
    // 四神体系
    const sishen = analyzeSiShen(lines, ys.primary.index)
    // 旺衰分析
    const str = analyzeMoonDayStrength(
      ys.primary.line, ys.primary.line.wuxing!,
      sishen.yuan.line, sishen.yuan.wuxing,
      sishen.ji.line, sishen.ji.wuxing,
      naja.monthWuxing, naja.dayWuxing,
    )
    // 应期
    const yq = computeYingQiLiuyao(ys.primary.line.wuxing!, naja.isStatic, naja.monthWuxing)

    return `**用神定位：** ${ys.info}

**四神体系：** ${sishen.summary}

- ${sishen.yuan.info}
- ${sishen.ji.info}
- ${sishen.chou.info}

**月日旺衰：** ${str.summary}

- ${str.yong.month}
- ${str.yong.day}

**应期推算：** ${yq.map(y=>y.timeWindow).join('；')}

**卦局：** ${naja.isLiuChong?'六冲卦':'非六冲卦'}，${naja.isStatic?'静卦':'有动爻'}，${naja.palaceName}宫${naja.palaceElement}`
  }

  // Derived analysis text — used both in UI and AI prompt
  const analysisText = useMemo(() => {
    if (!result) return null
    return buildLiuyaoCodeAnalysis(result, question)
  }, [result, question])

  /** 自动 AI 解读 */
  const autoInterpret = useCallback(async (r: LiuyaoResult, q: string) => {
    if (!q.trim()) return // 未填问题则跳过AI解读
    setInterpreting(true)
    setInterpretError(null)
    try {
      // 构建代码层分析
      const codeAnalysis = buildLiuyaoCodeAnalysis(r, q)
      const text = await generateLiuyaoInterpretation(r, q, undefined, codeAnalysis)
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
          <Button variant="clear" size="sm" onClick={handleReset}>← 重新起卦</Button>
        </div>

        {/* 基础信息 */}
        {result.naja?.sizhu && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[11px] rounded-lg p-3"
            style={{ color: 'var(--muted)', backgroundColor: 'var(--bg)' }}>
            <span>公历：{result.naja.castTime}</span>
            <span>|</span>
            <span>四柱：{result.naja.sizhu.year.full} {result.naja.sizhu.month.full} {result.naja.sizhu.day.full} {result.naja.sizhu.hour.full}</span>
            <span>|</span>
            <span>月令：{result.naja.jieqi}</span>
            <span>|</span>
            <span>策数：{result.naja.ceShu} 轨数：{result.naja.guiShu}</span>
          </div>
        )}

        {/* 卦象展示 + 卦局分析 */}
        <Card>
          <div className="flex flex-col md:flex-row justify-center gap-8 items-start print-hexagrams">
            <HexagramDisplay
              hexagram={result.originalHexagram}
              label="本卦"
              changingPositions={result.changingPositions}
            />
            {result.changedHexagram && (
              <div className="flex items-center self-center text-2xl font-[family-name:var(--font-title)] md:self-start md:mt-12"
                style={{ color: 'var(--muted)' }}>
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

          {/* 六爻纳甲排盘表 */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            {/* 月建日辰信息栏 */}
            {result.naja && (
              <div className="flex flex-wrap gap-4 justify-center mb-4 text-xs" style={{ color: 'var(--muted)' }}>
                <span>宫：<b style={{ color: 'var(--fg)' }}>{result.naja.palaceName}</b>（{result.naja.palaceElement}）</span>
                <span>月建：<b style={{ color: 'var(--fg)' }}>{result.naja.monthZhi}月{result.naja.monthWuxing}</b></span>
                <span>日辰：<b style={{ color: 'var(--fg)' }}>{result.naja.dayZhi}日{result.naja.dayWuxing}</b></span>
                {result.naja.isLiuChong && <span className="font-semibold" style={{ color: 'var(--danger)' }}>六冲卦</span>}
                {result.naja.isStatic && <span style={{ color: 'var(--primary)' }}>静卦</span>}
              </div>
            )}

            {/* 纳甲表头 */}
            <div className="grid grid-cols-6 gap-1 text-[10px] text-center font-semibold mb-1 px-1"
              style={{ color: 'var(--muted)' }}>
              <span>爻位</span><span>干支</span><span>五行</span><span>六亲</span><span>世应</span><span>阴阳</span>
            </div>

            {/* 纳甲表体 — 从上往下显示 */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              {[...(result.naja?.lines || result.lines)].reverse().map((line, i) => {
                const pos = 6 - i
                const posNames = ['','初','二','三','四','五','上']
                const isShi = line.shiying === '世'
                const isYing = line.shiying === '应'
                return (
                  <div key={i} className="grid grid-cols-6 gap-1 text-xs text-center py-2 px-1 items-center"
                    style={{
                      borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
                      backgroundColor: line.changing ? 'var(--negative-bg)' : isShi ? 'var(--primary-light)' : undefined,
                    }}>
                    <span style={{ color: 'var(--muted)' }}>{posNames[pos]}爻</span>
                    <span className="font-semibold tracking-wide" style={{ color: 'var(--fg)' }}>{line.gan || ''}{line.zhi || ''}</span>
                    <span>{line.wuxing || ''}</span>
                    <span>{line.liuqin || ''}</span>
                    <span>
                      {isShi && <span className="inline-block px-1.5 py-px rounded text-[10px] font-semibold"
                        style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)' }}>世</span>}
                      {isYing && <span className="inline-block px-1.5 py-px rounded text-[10px] font-semibold"
                        style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)' }}>应</span>}
                    </span>
                    <span style={line.value ? {} : { color: 'var(--muted)' }}>
                      {line.value ? '⚊' : '⚋'}
                      {line.changing && <span className="ml-0.5" style={{ color: 'var(--danger)' }}>{line.value ? '○' : '×'}</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 卦局分析（嵌入卦象卡片底部） */}
          {result.naja && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                  <span style={{ color: 'var(--muted)' }}>卦局：</span>
                  <span className="font-semibold" style={{ color: 'var(--fg)' }}>
                    {result.naja.isLiuChong?'六冲卦':result.naja.isLiuHe?'六合卦':'非冲非合'}
                  </span>
                  {result.naja.isLiuChong && <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>六冲主快散变动</p>}
                  {result.naja.isLiuHe && <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>六合主和聚长久</p>}
                </div>
                {result.naja.chiShiLiqin && (
                  <div className="p-2.5 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                    <span style={{ color: 'var(--muted)' }}>持世：</span>
                    <span className="font-semibold" style={{ color: 'var(--fg)' }}>{result.naja.chiShiLiqin}持世</span>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{result.naja.chiShiText}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* 代码分析与应期推算 */}
        <Card title="代码分析与应期推算">
          {analysisText && (
            <div className="text-sm leading-relaxed p-4 rounded-lg mb-3"
              style={{ color: 'var(--fg)', backgroundColor: 'var(--bg)' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisText}</ReactMarkdown>
            </div>
          )}
          {result.naja && (() => {
            const naja = result.naja!
            const ys = determineLiuyaoYongShen(naja.lines, question)
            const yq = computeYingQiLiuyao(ys.primary.line.wuxing!, naja.isStatic, naja.monthWuxing)
            if (!yq || yq.length === 0) return null
            return (
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-sm mb-1" style={{ color: 'var(--fg)' }}>应期推算</div>
                {yq.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded p-2"
                    style={{ backgroundColor: 'var(--primary-light)' }}>
                    <span className="font-semibold min-w-[80px]" style={{ color: 'var(--primary-hover)' }}>{item.method}</span>
                    <span className="flex-1 font-bold" style={{ color: 'var(--primary)' }}>{item.timeWindow}</span>
                  </div>
                ))}
              </div>
            )
          })()}
          {!analysisText && !result.naja && <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>等待 AI 解读完成...</p>}
        </Card>

        {/* AI 解读 */}
        <Card title="AI 解读">
          <div className="text-sm italic mb-3" style={{ color: 'var(--muted)' }}>
            所问之事：{question || '（未填写）'}
          </div>

          {interpreting && <Loading text="卦象推演中..." />}

          {interpretError && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--negative-bg)', color: 'var(--danger)' }}>
              {interpretError}
              <Button variant="clear" size="sm" onClick={handleReinterpret} className="ml-2">
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
            <div className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>等待 AI 解读完成...</div>
          )}
        </Card>

        {/* 卦辞释义 */}
        <Card title="卦辞释义">
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>{result.originalHexagram.judgment}</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{result.originalHexagram.meaning}</p>
          {result.changedHexagram && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>
                变卦 · {result.changedHexagram.name}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{result.changedHexagram.meaning}</p>
            </div>
          )}
        </Card>

        {/* 传统断语 — tab切换本卦/变卦 */}
        {(() => {
          const hexOpts = [
            { key: 'original', label: '本卦', name: result.originalName },
            ...(result.changedName ? [{ key: 'changed', label: '变卦', name: result.changedName }] : []),
          ]
          const active = hexOpts.find(o => o.key === activeLiuyaoHex) || hexOpts[0]
          const dy = getDuanYu(active.name)
          const allDims = (name: string) => {
            const d = getDuanYu(name); if (!d) return []
            return Object.entries(d).filter(([k]) => ['运势','事业','家运','考试','求财','婚姻','诉讼','出行'].includes(k))
          }
          return (
            <Card title="传统断语">
              <div className="flex gap-1 mb-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                {hexOpts.map(opt => (
                  <button key={opt.key} onClick={() => setActiveLiuyaoHex(opt.key)}
                    className="px-3 py-1.5 text-xs rounded-t transition-colors"
                    style={activeLiuyaoHex === opt.key ? { backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600 } : { color: 'var(--muted)' }}>
                    {opt.label} · {opt.name}
                  </button>
                ))}
              </div>
              {dy ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(dy).filter(([k]) => ['运势','事业','家运','考试','求财','婚姻','诉讼','出行'].includes(k)).map(([k, v]) => (
                    <div key={k} className="p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                      <span className="font-semibold" style={{ color: 'var(--fg)' }}>{k}</span>
                      <span className="ml-1" style={{ color: 'var(--fg)' }}>{v as string}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs" style={{ color: 'var(--muted)' }}>暂无</p>}
              {/* 打印时显示所有卦断语 */}
              <div className="hidden print:block mt-4">
                {hexOpts.map(opt => {
                  const dims = allDims(opt.name)
                  if (dims.length === 0) return null
                  return (
                    <div key={opt.key}>
                      <h4 className="text-sm font-[family-name:var(--font-title)] font-bold mb-1">{opt.label} · {opt.name}</h4>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {dims.map(([k, v]) => (<div key={k} className="p-1"><b>{k}</b> {v as string}</div>))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })()}

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
          <span className="field-label">所占之事 <span style={{ color: 'var(--danger)' }}>*</span></span>
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
              style={method === m ? { backgroundColor: 'var(--primary)', color: 'white' } : { backgroundColor: 'var(--bg)', color: 'var(--muted)' }}
            >
              {m === 'coin' ? '摇卦' : m === 'number' ? '数字' : '随机'}
            </button>
          ))}
        </div>

        {/* 摇卦模式 */}
        {method === 'coin' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
              诚心默念所问之事，点击摇卦，共需六次（从初爻至上爻）
            </div>

            {/* 已摇的爻 */}
            {shakeLines.length > 0 && (
              <div className="w-full max-w-[200px] space-y-1 mb-2">
                {shakeLines.map((line, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
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
                        style={line.changing ? { color: 'var(--danger)' } : { color: 'var(--muted)' }}>
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
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              输入三个数字（0-999），分别对应上卦、下卦、动爻
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="field-label">上卦数</span>
                <input className="field" type="number" value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="如 3" />
              </div>
              <div>
                <span className="field-label">下卦数</span>
                <input className="field" type="number" value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="如 6" />
              </div>
              <div>
                <span className="field-label">动爻数</span>
                <input className="field" type="number" value={num3} onChange={(e) => setNum3(e.target.value)} placeholder="如 9" />
              </div>
            </div>
            <Button onClick={handleNumberCast} size="lg">起卦</Button>
          </div>
        )}

        {/* 随机模式 */}
        {method === 'random' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-center" style={{ color: 'var(--muted)' }}>
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
