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

const impactStyle: Record<string, { dot: string; bg: string; text: string }> = {
  '高': { dot: 'bg-negative-400', bg: 'bg-negative-50', text: 'text-negative-400' },
  '中': { dot: 'bg-gold-400', bg: 'bg-gold-50', text: 'text-gold-600' },
  '低': { dot: 'bg-water-400', bg: 'bg-water-50', text: 'text-water-500' },
}

const typeLabel: Record<string, string> = {
  layout: '户型', energy: '理气', environment: '环境', timely: '流年',
}

const diffColor: Record<string, string> = {
  '简单': 'bg-positive-100 text-positive-700',
  '中等': 'bg-gold-100 text-gold-700',
  '装修级': 'bg-negative-100 text-negative-700',
}

const costColor: Record<string, string> = {
  '免费': 'bg-positive-100 text-positive-700',
  '极低': 'bg-positive-100 text-positive-700',
  '低': 'bg-water-100 text-water-700',
  '中': 'bg-gold-100 text-gold-700',
  '高': 'bg-negative-100 text-negative-700',
}

function WeaknessItem({ item }: { item: FengshuiItem }) {
  const [expanded, setExpanded] = useState(false)
  const impact = (item.impact && impactStyle[item.impact]) || impactStyle['中']
  const hasSolutions = item.solutions && item.solutions.length > 0

  return (
    <div className={`p-3 mb-2 rounded-lg border ${impact.bg} border-[#ffe58f] border-l-[4px]`}>
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0 mt-0.5">❌</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#2C2C2C] text-sm">{item.item || item.title}</span>
            {item.impact && (
              <span className={`inline-block px-1.5 py-px rounded text-[10px] leading-[18px] text-white ${impact.dot}`}>
                {item.impact}影响
              </span>
            )}
            {item.type && (
              <span className="text-[10px] text-brand-700 bg-brand-100 px-1.5 py-px rounded">
                {typeLabel[item.type] || item.type}
              </span>
            )}
          </div>
          {(item.detail || item.description) && (
            <p className="mt-1 text-xs text-[#6B4C3B] leading-relaxed">
              {item.detail || item.description}
            </p>
          )}

          {/* 🆕 化解方案 */}
          {hasSolutions && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium cursor-pointer"
              >
                查看化解方案 ({item.solutions!.length})
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {expanded && (
                <div className="mt-2 space-y-2">
                  {item.solutions!.map((s, i) => (
                    <div key={i} className="p-2.5 bg-white rounded-lg border border-positive-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-positive-700">{s.method}</span>
                        <span className={`text-[10px] px-1.5 py-px rounded ${diffColor[s.difficulty] || 'bg-paper-100 text-[#8C8C8C]'}`}>
                          {s.difficulty}
                        </span>
                        <span className={`text-[10px] px-1.5 py-px rounded ${costColor[s.cost] || 'bg-paper-100 text-[#8C8C8C]'}`}>
                          {s.cost}
                        </span>
                      </div>
                      <p className="text-xs text-[#4C4C4C] leading-relaxed">{s.description}</p>
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
    <div className="p-3 mb-2 rounded-lg border bg-positive-50 border-positive-200 border-l-[4px] border-l-positive-400">
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0 mt-0.5">✅</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#2C2C2C] text-sm">{item.item || item.title}</span>
            {item.impact && (
              <span className={`inline-block px-1.5 py-px rounded text-[10px] leading-[18px] text-white ${(item.impact && impactStyle[item.impact]) ? impactStyle[item.impact].dot : 'bg-gold-400'}`}>
                {item.impact}影响
              </span>
            )}
            {item.type && (
              <span className="text-[10px] text-brand-700 bg-brand-100 px-1.5 py-px rounded">
                {typeLabel[item.type] || item.type}
              </span>
            )}
          </div>
          {(item.detail || item.description) && (
            <p className="mt-1 text-xs text-[#6B4C3B] leading-relaxed">
              {item.detail || item.description}
            </p>
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
          <h3 className="text-[17px] font-bold text-positive-400 mb-3 pb-2 border-b-2 border-positive-200">
            ✅ 主要优点 ({strengths!.length})
          </h3>
          {strengths!.map((s, i) => <ProsItem key={`s-${i}`} item={s} />)}
        </div>
      )}
      {hasWeaknesses && (
        <div>
          <h3 className="text-[17px] font-bold text-negative-400 mb-3 pb-2 border-b-2 border-negative-200">
            ❌ 主要缺点 ({weaknesses!.length})
          </h3>
          {weaknesses!.map((w, i) => <WeaknessItem key={`w-${i}`} item={w} />)}
        </div>
      )}
    </div>
  )
}
