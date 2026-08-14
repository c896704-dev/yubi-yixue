import { useState, useRef, useEffect } from 'react'
import type { AnalysisResult } from '../../types'
import type { ChatMessage } from '../../utils/ai'
import { sendQAMessage, buildQASystemPrompt } from '../../utils/ai'
import { Button } from '../../components/ui/Button'

interface BaziChatProps {
  result: AnalysisResult | null
}

const btnStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '32px',
  right: '28px',
  zIndex: 9999,
  width: '56px',
  height: '56px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #006666, #004d4d)',
  color: '#fbfaf5',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 6px 24px rgba(0, 77, 77, 0.30), 0 2px 6px rgba(0, 0, 0, 0.12)',
  transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease',
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '88px',
  right: '24px',
  zIndex: 9999,
  width: '360px',
  maxWidth: 'calc(100vw - 32px)',
  height: '480px',
  maxHeight: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '18px',
  background: 'var(--xuan-zhi)',
  boxShadow: '0 12px 40px rgba(0, 51, 51, 0.18)',
  border: '1px solid rgba(0, 77, 77, 0.12)',
  borderTop: '2px solid #d4af37',
  animation: 'scaleIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
}

const suggestions = [
  '我的命局适合做什么行业？',
  '我近期的运势怎么样？',
  '我需要注意什么健康问题？',
  '我的性格有什么特点？',
]

const serifFont = '"Noto Serif SC", "Songti SC", serif'

export function BaziChat({ result }: BaziChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  const context = result
    ? `八字：${result.bazi.year.stem}${result.bazi.year.branch} ${result.bazi.month.stem}${result.bazi.month.branch} ${result.bazi.day.stem}${result.bazi.day.branch} ${result.bazi.hour.stem}${result.bazi.hour.branch}，日主${result.bazi.dayMaster}（${result.bazi.dayMasterElement}），${result.bodyStrength || ''}，格局${result.geJu || ''}`
    : ''
  const systemPrompt = result
    ? buildQASystemPrompt(context, `${result.person.name}，${result.person.gender}`)
    : ''

  const handleSend = async (text?: string) => {
    if (!result) return
    const content = text || input
    if (!content.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages); setInput(''); setLoading(true)
    try {
      const reply = await sendQAMessage([{ role: 'system', content: systemPrompt }, ...newMessages])
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '抱歉，AI 服务暂时不可用，请稍后重试。' }])
    } finally { setLoading(false) }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={btnStyle}
        title="AI 命理解惑"
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 77, 77, 0.4), 0 0 0 3px rgba(212, 175, 55, 0.3)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 77, 77, 0.30), 0 2px 6px rgba(0, 0, 0, 0.12)' }}
      >
        <span style={{ fontFamily: serifFont, fontSize: 13, fontWeight: 700, userSelect: 'none', lineHeight: 1, letterSpacing: '0.1em' }}>
          解惑
        </span>
      </button>
    )
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid rgba(0, 77, 77, 0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006666, #004d4d)', color: '#fbfaf5', fontSize: 12, fontWeight: 600, flexShrink: 0, fontFamily: serifFont }}>
            解惑
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--dai-qing-dark)', fontFamily: serifFont, letterSpacing: '0.04em' }}>AI 命理解惑</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0, 77, 77, 0.55)', background: 'rgba(0, 77, 77, 0.06)', border: 'none', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'rgba(0, 77, 77, 0.035)' }}>
        {!result ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 16px' }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006666, #004d4d)', color: '#fbfaf5', fontSize: 14, fontWeight: 600, marginBottom: 12, fontFamily: serifFont }}>
              解惑
            </span>
            <p style={{ fontSize: 14, color: 'var(--dai-qing-dark)', margin: '0 0 4px', fontWeight: 500, fontFamily: serifFont }}>AI 命理解惑</p>
            <p style={{ fontSize: 12, color: 'rgba(0, 77, 77, 0.55)', margin: 0 }}>
              请先完成八字排盘，即可与 AI 命理师对话
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => handleSend(s)} style={{ padding: '4px 12px', fontSize: 12, borderRadius: '99px', background: 'var(--xuan-zhi)', color: 'var(--dai-qing)', cursor: 'pointer', transition: 'background 0.12s', border: '1px solid rgba(0, 77, 77, 0.16)', fontFamily: 'inherit' }}>
                {s}
              </button>
            ))}
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%', padding: '8px 12px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', borderRadius: '14px', ...(m.role === 'user' ? { background: 'linear-gradient(135deg, #006666, #004d4d)', color: '#fbfaf5', borderBottomRightRadius: '4px' } : { background: 'var(--xuan-zhi)', color: 'var(--dai-qing-dark)', border: '1px solid rgba(0, 77, 77, 0.12)', borderBottomLeftRadius: '4px' }) }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, padding: '4px', color: 'rgba(0, 77, 77, 0.5)' }}>AI 正在思考...</div>}
        <div ref={endRef} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px 16px', borderTop: '1px solid rgba(0, 77, 77, 0.08)', flexShrink: 0 }}>
        <input
          style={{ flex: 1, padding: '8px 12px', fontSize: 14, borderRadius: '99px', outline: 'none', border: '1px solid rgba(0, 77, 77, 0.16)', background: 'rgba(0, 77, 77, 0.045)', color: 'var(--dai-qing-dark)', fontFamily: 'inherit' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={result ? '输入问题...' : '请先完成排盘'}
          disabled={!result}
        />
        <Button size="sm" onClick={() => handleSend()} loading={loading} disabled={!result || !input.trim()}>发送</Button>
      </div>
    </div>
  )
}
