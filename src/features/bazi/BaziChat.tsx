import { useState, useRef, useEffect } from 'react'
import type { AnalysisResult } from '../../types'
import type { ChatMessage } from '../../utils/ai'
import { sendQAMessage, buildQASystemPrompt } from '../../utils/ai'
import { Button } from '../../components/ui/Button'

interface BaziChatProps {
  result: AnalysisResult
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

  const context = `八字：${result.bazi.year.stem}${result.bazi.year.branch} ${result.bazi.month.stem}${result.bazi.month.branch} ${result.bazi.day.stem}${result.bazi.day.branch} ${result.bazi.hour.stem}${result.bazi.hour.branch}，日主${result.bazi.dayMaster}（${result.bazi.dayMasterElement}），${result.bodyStrength || ''}，格局${result.geJu || ''}`
  const systemPrompt = buildQASystemPrompt(context, `${result.person.name}，${result.person.gender}`)

  const handleSend = async (text?: string) => {
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
        className="chat-toggle"
        title="AI 命理问答"
      >
        <span className="font-[family-name:var(--font-title)] text-lg font-bold select-none leading-none">灵</span>
      </button>
    )
  }

  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div className="chat-head-left">
          <span className="chat-icon">灵</span>
          <span className="chat-title">AI 命理问答</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="modal-close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="chat-body">
        {messages.length === 0 && (
          <div className="chat-suggestions">
            {suggestions.map((s) => (
              <button key={s} onClick={() => handleSend(s)} className="chat-suggestion">{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}>
            <div className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="chat-loading">AI 正在思考...</div>}
        <div ref={endRef} />
      </div>

      <div className="chat-foot">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入问题..."
        />
        <Button size="sm" onClick={() => handleSend()} loading={loading} disabled={!input.trim()}>发送</Button>
      </div>
    </div>
  )
}
