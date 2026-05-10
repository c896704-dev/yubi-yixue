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

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const context = `八字：${result.bazi.year.stem}${result.bazi.year.branch} ${result.bazi.month.stem}${result.bazi.month.branch} ${result.bazi.day.stem}${result.bazi.day.branch} ${result.bazi.hour.stem}${result.bazi.hour.branch}，日主${result.bazi.dayMaster}（${result.bazi.dayMasterElement}），${result.bodyStrength || ''}，格局${result.geJu || ''}`
  const systemPrompt = buildQASystemPrompt(context, `${result.person.name}，${result.person.gender}`)

  const handleSend = async (text?: string) => {
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
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-[52px] h-[52px] rounded-full bg-brand-500 text-white flex items-center justify-center z-30 shadow-card-hover hover:bg-brand-600 transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[520px] bg-white rounded-xl shadow-overlay flex flex-col z-30 overflow-hidden border border-[#E8E0D8] animate-scale-in">
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#E8E0D8] bg-paper-50">
        <span className="font-serif text-sm font-semibold text-[#2C2C2C]">AI 命理问答</span>
        <button onClick={() => setOpen(false)} className="text-[#8C8C8C] hover:text-[#2C2C2C] p-1 cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 rounded-full border border-[#E8E0D8] bg-white text-[11px] text-[#8C8C8C] cursor-pointer hover:bg-paper-50 hover:text-[#2C2C2C] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`mb-3 flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-brand-500 text-white rounded-xl rounded-br'
                : 'bg-paper-50 text-[#2C2C2C] rounded-xl rounded-bl'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-[11px] text-[#8C8C8C] p-2">AI 正在思考...</div>}
        <div ref={endRef} />
      </div>

      <div className="p-2.5 border-t border-[#E8E0D8] flex gap-2">
        <input
          className="input flex-1 !text-sm"
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
