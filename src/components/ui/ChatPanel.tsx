import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage } from '../../utils/ai'
import { sendQAMessage } from '../../utils/ai'
import { Button } from './Button'
import { MessageSquare, X } from './Icon'

interface ChatPanelProps {
  mode: string
  systemPrompt: string
  suggestions?: string[]
}

export function ChatPanel({ mode, systemPrompt, suggestions = [] }: ChatPanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = useCallback(async (text?: string) => {
    const content = text || input
    if (!content.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const reply = await sendQAMessage([{ role: 'system', content: systemPrompt }, ...newMessages])
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '抱歉，AI 服务暂时不可用，请稍后重试。' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, systemPrompt])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="ds-fab"
        title={`AI ${mode}`}
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
            <div className="ds-chat-title">AI {mode}</div>
            <div className="ds-chat-sub">古籍为证 · 可溯源</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="ds-modal-close" aria-label="关闭">
          <X size={15} />
        </button>
      </div>

      <div className="ds-chat-body">
        {messages.length === 0 && suggestions.length > 0 && (
          <div className="ds-chat-suggestions">
            {suggestions.map((s) => (
              <button key={s} onClick={() => handleSend(s)} className="ds-chat-suggestion">{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ds-chat-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
            <div className={`ds-chat-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
              {m.content}
            </div>
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
          placeholder="输入问题..."
        />
        <Button size="sm" onClick={() => handleSend()} loading={loading} disabled={!input.trim()}>
          发送
        </Button>
      </div>
    </div>
  )
}
