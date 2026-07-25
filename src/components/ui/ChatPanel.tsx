import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage } from '../../utils/ai'
import { sendQAMessage } from '../../utils/ai'
import { Button } from './Button'

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
        className="chat-toggle"
        title={`AI ${mode}`}
      >
        <span style={{ fontFamily: 'var(--font-title)', fontSize: 18, fontWeight: 700, userSelect: 'none', lineHeight: 1 }}>灵</span>
      </button>
    )
  }

  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div className="chat-head-left">
          <span className="chat-icon">灵</span>
          <span className="chat-title">AI {mode}</span>
        </div>
        <button onClick={() => setOpen(false)} className="modal-close">✕</button>
      </div>

      <div className="chat-body">
        {messages.length === 0 && suggestions.length > 0 && (
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
        <Button size="sm" onClick={() => handleSend()} loading={loading} disabled={!input.trim()}>
          发送
        </Button>
      </div>
    </div>
  )
}
