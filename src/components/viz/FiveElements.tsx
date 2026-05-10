export interface ElementData {
  name: string
  value: number
  maxValue: number
  status?: string
}

interface FiveElementsProps {
  elements: ElementData[]
  className?: string
}

const elementColors: Record<string, string> = {
  '木': 'text-positive-400',
  '火': 'text-negative-400',
  '土': 'text-brand-500',
  '金': 'text-gold-400',
  '水': 'text-water-400',
}

const elementBgColors: Record<string, string> = {
  '木': 'bg-positive-400',
  '火': 'bg-negative-400',
  '土': 'bg-brand-500',
  '金': 'bg-gold-400',
  '水': 'bg-water-400',
}

const elementRingBg: Record<string, string> = {
  '木': 'bg-positive-50',
  '火': 'bg-negative-50',
  '土': 'bg-brand-50',
  '金': 'bg-gold-50',
  '水': 'bg-water-50',
}

export function FiveElements({ elements, className = '' }: FiveElementsProps) {
  const maxR = 28

  return (
    <div className={`flex justify-center gap-6 flex-wrap ${className}`}>
      {elements.map((el) => {
        const ratio = el.maxValue > 0 ? el.value / el.maxValue : 0
        const r = 6 + ratio * (maxR - 6)
        const colorClass = elementColors[el.name] || 'text-[#8C8C8C]'
        const bgClass = elementBgColors[el.name] || 'bg-[#B8B8B8]'
        const ringClass = elementRingBg[el.name] || 'bg-paper-50'

        return (
          <div key={el.name} className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center" style={{ width: maxR * 2 + 8, height: maxR * 2 + 8 }}>
              <div className={`rounded-full ${ringClass}`} style={{ width: maxR * 2, height: maxR * 2 }} />
              <div
                className={`absolute rounded-full flex items-center justify-center text-white font-bold text-lg ${bgClass}`}
                style={{ width: r * 2, height: r * 2 }}
              >
                {el.name}
              </div>
            </div>
            <span className={`text-sm font-semibold ${colorClass}`}>{el.value}</span>
            {el.status && <span className="text-[11px] text-[#8C8C8C]">{el.status}</span>}
          </div>
        )
      })}
    </div>
  )
}
