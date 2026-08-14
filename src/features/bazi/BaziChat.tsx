import { useState, useRef, useEffect } from 'react'
import type { AnalysisResult } from '../../types'
import type { ChatMessage } from '../../utils/ai'
import { sendQAMessage, buildQASystemPrompt } from '../../utils/ai'
import { Button } from '../../components/ui/Button'
import { MessageSquare, X } from '../../components/ui/Icon'

interface BaziChatProps {
  result: AnalysisResult | null
}

const suggestions = [
  '我的命局适合做什么行业？',
  '我近期的运势怎么样？',
  '我需要注意什么健康问题？',
  '我的性格有什么特点？',
]

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
        className="ds-fab"
        title="AI 命理解惑"
      >
        <MessageSquare size={20} />
      </button>
    )
  }

  return (
    <div className="ds-chat-panel">
      <div className="ds-chat-head">
        <div className="ds-chat-head-left">
          <span className="ds-chat-avatar"><MessageSquare size={14} /></span>
          <div>
            <div className="ds-chat-title">AI 命理解惑</div>
            <div className="ds-chat-sub">古籍为证 · 可溯源</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="ds-modal-close" aria-label="关闭">
          <X size={15} />
        </button>
      </div>

      <div className="ds-chat-body">
        {!result ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 16px' }}>
            <span className="ds-chat-avatar" style={{ width: 40, height: 40, marginBottom: 12 }}>
              <MessageSquare size={18} />
            </span>
            <p className="font-serif font-bold" style={{ color: 'var(--dai-qing)', marginBottom: 4 }}>AI 命理解惑</p>
            <p style={{ fontSize: 12, color: 'rgba(0,77,77,0.55)' }}>
              请先完成八字排盘，即可与 AI 命理师对话
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="ds-chat-suggestions">
            {suggestions.map((s) => (
              <button key={s} className="ds-chat-suggestion" onClick={() => handleSend(s)}>{s}</button>
            ))}
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div key={i} className={`ds-chat-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
            <div className={`ds-chat-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="ds-chat-loading">AI 正在思考...</div>}
        <div ref={endRef} />
      </div>

      <div className="ds-chat-foot">
        <input
          className="ds-chat-input"
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
