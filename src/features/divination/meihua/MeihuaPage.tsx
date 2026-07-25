import { useState, useCallback, useEffect, useMemo, type CSSProperties } from 'react'
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

  /** 梅花易数代码层分析 */
  const buildMeihuaCodeAnalysis = (r: MeihuaResult) => {
    const tiyong = evalTiYongComprehensive(
      r.tiYong.tiElement, r.tiYong.yongElement,
      r.seasonalStrength.tiState, r.seasonalStrength.yongState,
    )
    const yingqi = computeYingQiMeihua(
      r.tiYong.tiElement, r.tiYong.yongElement,
      r.tiYong.ti.number, r.tiYong.yong.number, r.changingYao,
    )
    return `**体用综合评估：** ${tiyong.verdict}

**力量对比：** ${tiyong.monthly}，${tiyong.correction}

**一体百用：** ${r.tiBaiYong.summary}

**应期推算：** ${yingqi.map(y=>y.timeWindow).join('；')}

**卦气旺衰：** ${r.seasonalStrength.summary}`
  }

  const meihuaAnalysis = useMemo(() => {
    if (!result) return null
    return buildMeihuaCodeAnalysis(result)
  }, [result])

  /** 自动 AI 解读 */
  const autoInterpret = useCallback(async (r: MeihuaResult, q: string) => {
    if (!q.trim()) return
    setInterpreting(true)
    setInterpretError(null)
    try {
      const ma = buildMeihuaCodeAnalysis(r)
      const text = await generateMeihuaInterpretation(r, q, omen, ma)
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
    const tyColor = elementColors[result.tiYong.tiElement]
    const yyColor = elementColors[result.tiYong.yongElement]
    const relStyle: CSSProperties = result.tiYong.relation === '体用比和' || result.tiYong.relation === '用生体'
      ? { color: 'var(--success)', backgroundColor: 'var(--positive-bg)', borderColor: 'var(--success)' }
      : result.tiYong.relation === '体克用'
      ? { color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary-light)' }
      : { color: 'var(--danger)', backgroundColor: 'var(--negative-bg)', borderColor: 'var(--danger)' }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="clear" size="sm" onClick={handleReset}>← 重新起卦</Button>
        </div>

        {/* 天道信息头 */}
        {(() => {
          const now = new Date(result.timestamp)
          const sizhu = getSizhu(now.getFullYear(), now.getMonth()+1, now.getDate(), now.getHours())
          const lunar = getLunarMonth(now)
          const mNames: Record<string,string> = { number:'数字起卦', time:'时间起卦', text:'文字起卦' }
          return (
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[11px] rounded-lg p-3 mb-0"
              style={{ color: 'var(--muted)', backgroundColor: 'var(--bg)' }}>
              <span>公历：{now.getFullYear()}-{String(now.getMonth()+1).padStart(2,'0')}-{String(now.getDate()).padStart(2,'0')} {String(now.getHours()).padStart(2,'0')}:{String(now.getMinutes()).padStart(2,'0')}</span>
              <span>|</span>
              <span>四柱：{sizhu.year.gan}{sizhu.year.zhi} {sizhu.month.gan}{sizhu.month.zhi} {sizhu.day.gan}{sizhu.day.zhi} {sizhu.hour.gan}{sizhu.hour.zhi}</span>
              <span>|</span>
              <span>月令：{lunar.name}</span>
              <span>|</span>
              <span>起卦：{mNames[result.method]}</span>
            </div>
          )
        })()}

        {/* 本卦 + 互卦 + 变卦 + 错卦 + 综卦 */}
        <Card>
          <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 items-start print-hexagrams">
            <HexagramDisplay
              hexagram={result.originalHexagram}
              label="本卦"
              changingPositions={[result.changingYao]}
            />
            <div className="flex items-center self-center text-xl font-[family-name:var(--font-title)] md:self-start md:mt-12"
              style={{ color: 'var(--muted)' }}>
              →
            </div>
            <HexagramDisplay
              hexagram={result.huHexagram}
              label="互卦"
            />
            <div className="flex items-center self-center text-xl font-[family-name:var(--font-title)] md:self-start md:mt-12"
              style={{ color: 'var(--muted)' }}>
              →
            </div>
            <HexagramDisplay
              hexagram={result.changedHexagram}
              label="变卦"
            />
            {result.cuoHexagram && (
              <>
                <div className="flex items-center self-center text-xl font-[family-name:var(--font-title)] md:self-start md:mt-12"
                  style={{ color: 'var(--muted)' }}>
                  ·
                </div>
                <HexagramDisplay
                  hexagram={result.cuoHexagram}
                  label="错卦"
                />
              </>
            )}
            {result.zongHexagram && (
              <>
                <div className="flex items-center self-center text-xl font-[family-name:var(--font-title)] md:self-start md:mt-12"
                  style={{ color: 'var(--muted)' }}>
                  ·
                </div>
                <HexagramDisplay
                  hexagram={result.zongHexagram}
                  label="综卦"
                />
              </>
            )}
          </div>
          <div className="text-xs text-center mt-3" style={{ color: 'var(--muted)' }}>
            本卦为始 → 互卦为过程 → 变卦为终；错卦观对立面 · 综卦换位思考
          </div>
        </Card>

        {/* 体用生克 */}
        <Card title="体用生克分析">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-4 rounded-lg text-center ${tyColor.bg} ${tyColor.border} border`}>
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>体卦（我）</div>
              <div className="text-2xl font-[family-name:var(--font-title)] mb-1">{result.tiYong.ti.symbol}</div>
              <div className={`font-semibold ${tyColor.text}`}>{result.tiYong.ti.name} · {result.tiYong.tiElement}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{result.tiYong.ti.image} · {result.tiYong.ti.direction}</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${yyColor.bg} ${yyColor.border} border`}>
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>用卦（事）</div>
              <div className="text-2xl font-[family-name:var(--font-title)] mb-1">{result.tiYong.yong.symbol}</div>
              <div className={`font-semibold ${yyColor.text}`}>{result.tiYong.yong.name} · {result.tiYong.yongElement}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{result.tiYong.yong.image} · {result.tiYong.yong.direction}</div>
            </div>
          </div>
          <div className="p-3 rounded-lg border text-center" style={relStyle}>
            <span className="font-[family-name:var(--font-title)] font-bold text-lg">{result.tiYong.relation}</span>
            <p className="text-sm mt-1">{result.tiYong.judgment}</p>
          </div>
        </Card>

        {/* 代码分析与应期推算 */}
        <Card title="代码分析与应期推算">
          {meihuaAnalysis && (
            <div className="text-sm leading-relaxed p-4 rounded-lg mb-3"
              style={{ color: 'var(--fg)', backgroundColor: 'var(--bg)' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{meihuaAnalysis}</ReactMarkdown>
            </div>
          )}
          {result.yingQi && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-light)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--primary-hover)' }}>应期推算（卦气法 + 卦数法）</div>
              <div className="text-xs"><span className="font-semibold">推算依据：</span>{result.yingQi.description}</div>
              <div className="text-sm font-bold mt-2 rounded p-2.5 text-center"
                style={{ color: 'var(--primary)', backgroundColor: 'var(--surface)' }}>
                {result.yingQi.timeRange}
              </div>
            </div>
          )}
          {!meihuaAnalysis && !result.yingQi && <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>等待 AI 解读完成...</p>}
        </Card>

        {/* AI 解读 */}
        <Card title="AI 解读">
          <div className="text-sm italic mb-3" style={{ color: 'var(--muted)' }}>
            所问之事：{question || '（未填写）'}
          </div>

          {/* F-3: 起卦过程 */}
          {result.calcProcess && (
            <div className="text-xs leading-relaxed p-3 rounded-lg mb-3 whitespace-pre-line"
              style={{ color: 'var(--muted)', backgroundColor: 'var(--bg)' }}>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>起卦过程：</span>
              {result.calcProcess}
            </div>
          )}

          {interpreting && <Loading text="卦象推演中..." />}

          {interpretError && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--negative-bg)', color: 'var(--danger)' }}>
              {interpretError}
              <Button variant="clear" size="sm" onClick={() => result && autoInterpret(result, question)} className="ml-2">重试</Button>
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
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--fg)' }}>{result.originalHexagram.meaning}</p>
          <div style={{ borderTop: '1px solid var(--border)' }} className="pt-3">
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>互卦 · {result.huHexagram.name}</p>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--fg)' }}>{result.huHexagram.meaning}</p>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>变卦 · {result.changedHexagram.name}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{result.changedHexagram.meaning}</p>
            {result.cuoHexagram && (
              <>
                <p className="text-xs mb-1 mt-3" style={{ color: 'var(--muted)' }}>错卦 · {result.cuoHexagram.name}</p>
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--fg)' }}>{result.cuoHexagram.meaning}</p>
              </>
            )}
            {result.zongHexagram && (
              <>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>综卦 · {result.zongHexagram.name}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{result.zongHexagram.meaning}</p>
              </>
            )}
          </div>
        </Card>

        {/* 64卦断语 — 可切换本/互/变/错/综 */}
        {(() => {
          const hexOpts = [
            { key: 'original', label: '本卦', h: result.originalHexagram },
            { key: 'mutual', label: '互卦', h: result.huHexagram },
            { key: 'changing', label: '变卦', h: result.changedHexagram },
            ...(result.cuoHexagram ? [{ key: 'cuo', label: '错卦', h: result.cuoHexagram }] : []),
            ...(result.zongHexagram ? [{ key: 'zong', label: '综卦', h: result.zongHexagram }] : []),
          ] as { key: string; label: string; h: any }[]
          const active = hexOpts.find(o => o.key === activeDuanHex) || hexOpts[0]
          const dy = getDuanYu(active.h.name)
          return (
            <Card title="传统断语">
              <div className="flex gap-1 mb-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                {hexOpts.map(opt => (
                  <button key={opt.key} onClick={() => setActiveDuanHex(opt.key)}
                    className="px-3 py-1.5 text-xs rounded-t transition-colors"
                    style={activeDuanHex === opt.key ? { backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600 } : { color: 'var(--muted)' }}>
                    {opt.label} · {opt.h.name}
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
              ) : <p className="text-xs" style={{ color: 'var(--muted)' }}>暂无故辞可考</p>}
              {/* 打印时显示所有卦断语 */}
              <div className="hidden print:block mt-4">
                {hexOpts.map(opt => {
                  const d = getDuanYu(opt.h.name)
                  if (!d) return null
                  const dims = Object.entries(d).filter(([k]) => ['运势','事业','家运','考试','求财','婚姻','诉讼','出行'].includes(k))
                  if (dims.length === 0) return null
                  return (
                    <div key={opt.key}>
                      <h4 className="text-sm font-[family-name:var(--font-title)] font-bold mb-1">{opt.label} · {opt.h.name}</h4>
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

        {/* 十八占专题断 */}
        {(() => {
          const zt = getEighteenZhan(question, result.tiYong.relation)
          if (!zt) return null
          return (
            <Card title="专题占断">
              <div className="text-xs leading-relaxed p-3 rounded-lg border"
                style={{ color: 'var(--fg)', backgroundColor: 'var(--info-bg)', borderColor: 'var(--info-bg)' }}>
                <span className="font-semibold" style={{ color: 'var(--info)' }}>按《梅花易数》十八占法则：</span>
                <p className="mt-1">{zt}</p>
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
          <span className="field-label">所占之事 <span style={{ color: 'var(--danger)' }}>*</span></span>
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
          <span className="field-label">外应（选填）</span>
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
              style={method === m ? { backgroundColor: 'var(--primary)', color: 'white' } : { backgroundColor: 'var(--bg)', color: 'var(--muted)' }}
            >
              {m === 'number' ? '数字' : m === 'time' ? '时间' : '文字'}
            </button>
          ))}
        </div>

        {/* 数字模式 */}
        {method === 'number' && (
          <div className="flex flex-col gap-4">
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              输入三个数字，对应上卦、下卦、动爻（第三数可选）
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="field-label">上卦数</span>
                <input className="field" type="number" value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="第一个数" />
              </div>
              <div>
                <span className="field-label">下卦数</span>
                <input className="field" type="number" value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="第二个数" />
              </div>
              <div>
                <span className="field-label">动爻数（选填）</span>
                <input className="field" type="number" value={num3} onChange={(e) => setNum3(e.target.value)} placeholder="第三个数" />
              </div>
            </div>
            <Button onClick={handleNumberCast} size="lg">起卦</Button>
          </div>
        )}

        {/* 时间模式 */}
        {method === 'time' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-center" style={{ color: 'var(--muted)' }}>
              以当前时间起卦，取年月日时之数推算卦象
            </div>
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg)' }}>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>当前时间</div>
              <div className="font-[family-name:var(--font-title)] text-lg" style={{ color: 'var(--fg)' }}>{timeLabel}</div>
            </div>
            <Button onClick={handleTimeCast} size="lg">以此时起卦</Button>
          </div>
        )}

        {/* 文字模式 */}
        {method === 'text' && (
          <div className="flex flex-col gap-4">
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              输入2-4个汉字（如人名、地名、物品名），按笔画数推算卦象
            </div>
            <div>
              <span className="field-label">起卦文字</span>
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
