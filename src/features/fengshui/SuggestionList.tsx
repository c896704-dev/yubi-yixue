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
  high: { label: '高', color: '#C4664A' },
  medium: { label: '中', color: '#B8A070' },
  low: { label: '低', color: '#4A9E9E' },
}

const categoryLabel: Record<string, string> = {
  layout: '户型', environment: '环境', energy: '理气', timely: '流年',
}

function SuggestionItem({ s }: { s: Suggestion }) {
  const [open, setOpen] = useState(false)
  const p = priorityConfig[s.priority] || priorityConfig.medium

  return (
    <div className="border rounded-lg overflow-hidden mb-2" style={{ borderColor: 'var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <span className="inline-block px-1.5 py-px rounded text-[10px] text-white shrink-0" style={{ backgroundColor: p.color }}>
          {p.label}优先级
        </span>
        <span className="font-medium text-sm flex-1" style={{ color: 'var(--fg)' }}>{s.title}</span>
        <span className="text-[10px] shrink-0 px-1.5 py-px rounded" style={{ color: 'var(--muted)', backgroundColor: 'var(--bg)' }}>
          {categoryLabel[s.category] || s.category}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform shrink-0 ${open ? 'rotate-90' : ''}`}
          style={{ color: 'var(--muted)' }}
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2" style={{ backgroundColor: 'var(--surface)' }}>
          {s.description && (
            <div>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>问题描述：</span>
              <span className="text-xs" style={{ color: 'var(--fg)' }}>{s.description}</span>
            </div>
          )}
          {s.principle && (
            <div>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>风水原理：</span>
              <span className="text-xs" style={{ color: 'var(--fg)' }}>{s.principle}</span>
            </div>
          )}
          {s.solution && (
            <div className="p-2.5 rounded-lg border" style={{ backgroundColor: '#E8F0E8', borderColor: '#C8DCC8' }}>
              <span className="text-xs font-semibold" style={{ color: '#5A7A5A' }}>改善方法：</span>
              <div className="text-xs" style={{ color: '#4A6A4A' }}>{s.solution}</div>
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
      <h3 className="text-[17px] font-bold mb-3 pb-2 border-b-2" style={{ color: 'var(--fg)', borderColor: 'var(--border)' }}>
        改善建议 ({suggestions.length})
      </h3>
      {suggestions.map((s, i) => <SuggestionItem key={i} s={s} />)}
    </div>
  )
}
