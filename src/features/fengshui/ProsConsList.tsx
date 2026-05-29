import { useState } from 'react'

interface FengshuiItem {
  item: string
  impact?: string
  type?: string
  detail?: string
  title?: string
  description?: string
  solutions?: Array<{
    method: string
    difficulty: string
    cost: string
    description: string
  }>
}

const impactStyle: Record<string, string> = {
  '高': '#C4664A',
  '中': '#B8A070',
  '低': '#4A9E9E',
}

const typeLabel: Record<string, string> = {
  layout: '户型', energy: '理气', environment: '环境', timely: '流年',
}

function WeaknessItem({ item }: { item: FengshuiItem }) {
  const [expanded, setExpanded] = useState(false)
  const impact = item.impact ? (impactStyle[item.impact] || impactStyle['中']) : impactStyle['中']
  const hasSolutions = item.solutions && item.solutions.length > 0

  return (
    <div className="p-3 mb-2 rounded-lg border" style={{ backgroundColor: '#F5E6E0', borderColor: '#E5DCC8', borderLeft: `4px solid ${impact}` }}>
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0 mt-0.5" style={{ color: 'var(--muted)' }}>◌</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{item.item || item.title}</span>
            {item.impact && (
              <span className="inline-block px-1.5 py-px rounded text-[10px] text-white" style={{ backgroundColor: impact }}>{item.impact}影响</span>
            )}
            {item.type && (
              <span className="text-[10px] px-1.5 py-px rounded" style={{ color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)' }}>{typeLabel[item.type] || item.type}</span>
            )}
          </div>
          {(item.detail || item.description) && (
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--fg)' }}>{item.detail || item.description}</p>
          )}

          {hasSolutions && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs font-medium cursor-pointer bg-transparent border-none"
                style={{ color: 'var(--primary)' }}
              >
                查看化解方案 ({item.solutions!.length})
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {expanded && (
                <div className="mt-2 space-y-2 print:hidden">
                  {item.solutions!.map((s, i) => (
                    <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--primary-light)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: 'var(--primary-hover)' }}>{s.method}</span>
                        <span className="text-[10px] px-1.5 py-px rounded" style={{ color: 'var(--fg)', backgroundColor: 'var(--bg)' }}>{s.difficulty}</span>
                        <span className="text-[10px] px-1.5 py-px rounded" style={{ color: 'var(--fg)', backgroundColor: 'var(--bg)' }}>{s.cost}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--fg)' }}>{s.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProsItem({ item }: { item: FengshuiItem }) {
  return (
    <div className="p-3 mb-2 rounded-lg border" style={{ backgroundColor: '#E8F0E8', borderColor: '#C8DCC8', borderLeft: '4px solid #7A9A7A' }}>
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0 mt-0.5" style={{ color: 'var(--muted)' }}>◉</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{item.item || item.title}</span>
            {item.impact && (
              <span className="inline-block px-1.5 py-px rounded text-[10px] text-white" style={{ backgroundColor: impactStyle[item.impact] || '#B8A070' }}>{item.impact}影响</span>
            )}
            {item.type && (
              <span className="text-[10px] px-1.5 py-px rounded" style={{ color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)' }}>{typeLabel[item.type] || item.type}</span>
            )}
          </div>
          {(item.detail || item.description) && (
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--fg)' }}>{item.detail || item.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface ProsConsListProps {
  strengths?: FengshuiItem[]
  weaknesses?: FengshuiItem[]
}

export function ProsConsList({ strengths, weaknesses }: ProsConsListProps) {
  const hasStrengths = strengths && strengths.length > 0
  const hasWeaknesses = weaknesses && weaknesses.length > 0

  if (!hasStrengths && !hasWeaknesses) return null

  return (
    <div>
      {hasStrengths && (
        <div className="mb-6">
          <h3 className="text-[17px] font-bold mb-3 pb-2 border-b-2" style={{ color: '#5A7A5A', borderColor: '#C8DCC8' }}>
            ◉ 主要优点 ({strengths!.length})
          </h3>
          {strengths!.map((s, i) => <ProsItem key={`s-${i}`} item={s} />)}
        </div>
      )}
      {hasWeaknesses && (
        <div>
          <h3 className="text-[17px] font-bold mb-3 pb-2 border-b-2" style={{ color: '#B05840', borderColor: '#E5CCB8' }}>
            ◌ 主要缺点 ({weaknesses!.length})
          </h3>
          {weaknesses!.map((w, i) => <WeaknessItem key={`w-${i}`} item={w} />)}
        </div>
      )}
    </div>
  )
}
