import { useState } from 'react'

interface Suggestion {
  priority: string
  category: string
  title: string
  description?: string
  principle?: string
  solution?: string
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: '高', color: 'bg-negative-400' },
  medium: { label: '中', color: 'bg-gold-400' },
  low: { label: '低', color: 'bg-water-400' },
}

const categoryLabel: Record<string, string> = {
  layout: '户型', environment: '环境', energy: '理气', timely: '流年',
}

function SuggestionItem({ s }: { s: Suggestion }) {
  const [open, setOpen] = useState(false)
  const p = priorityConfig[s.priority] || priorityConfig.medium

  return (
    <div className="border border-[#E8E0D8] rounded-lg overflow-hidden mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left bg-white hover:bg-paper-50 transition-colors"
      >
        <span className={`inline-block px-1.5 py-px rounded text-[10px] text-white ${p.color}`}>
          {p.label}优先级
        </span>
        <span className="font-medium text-sm text-[#2C2C2C] flex-1">{s.title}</span>
        <span className="text-[10px] text-[#8C8C8C] bg-paper-100 px-1.5 py-px rounded">
          {categoryLabel[s.category] || s.category}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        >
          <path d="M4 2l4 4-4 4" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {s.description && (
            <div>
              <span className="text-xs font-semibold text-[#8C8C8C]">问题描述：</span>
              <span className="text-xs text-[#2C2C2C]">{s.description}</span>
            </div>
          )}
          {s.principle && (
            <div>
              <span className="text-xs font-semibold text-[#8C8C8C]">风水原理：</span>
              <span className="text-xs text-[#2C2C2C]">{s.principle}</span>
            </div>
          )}
          {s.solution && (
            <div className="bg-positive-50 p-2.5 rounded-lg border border-positive-200">
              <span className="text-xs font-semibold text-positive-600">改善方法：</span>
              <div className="text-xs text-positive-700 whitespace-pre-line leading-relaxed mt-1">{s.solution}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface SuggestionListProps {
  suggestions?: Suggestion[]
}

export function SuggestionList({ suggestions }: SuggestionListProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div>
      <h3 className="text-[17px] font-bold text-[#2C2C2C] mb-3 pb-2 border-b-2 border-[#E8E0D8]">
        💡 改善建议 ({suggestions.length})
      </h3>
      {suggestions.map((s, i) => <SuggestionItem key={i} s={s} />)}
    </div>
  )
}
