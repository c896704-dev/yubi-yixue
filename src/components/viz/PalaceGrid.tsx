interface PalaceCell {
  label: string
  number: number
  element?: string
  subLabel?: string
  score?: number
  isCenter?: boolean
}

interface PalaceGridProps {
  cells: PalaceCell[]
  centerLabel?: string
  className?: string
}

const elementTextColors: Record<string, string> = {
  '木': 'text-positive-400',
  '火': 'text-negative-400',
  '土': 'text-brand-500',
  '金': 'text-gold-400',
  '水': 'text-water-400',
}

function scoreTextColor(s: number): string {
  if (s >= 80) return 'text-positive-400'
  if (s >= 60) return 'text-gold-400'
  return 'text-negative-400'
}

export function PalaceGrid({ cells, centerLabel, className = '' }: PalaceGridProps) {
  // If cells already has 9 items with center at index 4, use as-is. Otherwise insert center.
  const hasCenter = cells.length === 9 && cells[4]?.isCenter
  const gridCells = hasCenter ? [...cells] : [...cells.slice(0, 4), {
    label: centerLabel || '中宫',
    number: 5,
    element: '土',
    isCenter: true,
  }, ...cells.slice(4)]

  // Ensure exactly 9 cells
  while (gridCells.length < 9) {
    gridCells.push({ label: '', number: 0 })
  }

  return (
    <div className={`grid grid-cols-3 gap-1.5 max-w-[420px] mx-auto ${className}`}>
      {gridCells.slice(0, 9).map((cell, i) => {
        const isCenter = cell.isCenter || i === 4
        const elColor = elementTextColors[cell.element || ''] || 'text-[#2C2C2C]'
        return (
          <div
            key={i}
            className={`flex flex-col items-center justify-center gap-0.5 bg-white rounded-lg p-2 aspect-square ${
              isCenter ? 'border-2 border-brand-500' : 'border border-[#E8E0D8]'
            }`}
          >
            <span className={`font-serif font-bold ${isCenter ? 'text-lg' : 'text-[15px]'} ${elColor}`}>
              {cell.number || '—'}
            </span>
            <span className="text-[11px] font-semibold text-[#8C8C8C]">{cell.label}</span>
            {cell.subLabel && <span className="text-[11px] text-[#B8B8B8]">{cell.subLabel}</span>}
            {cell.score !== undefined && (
              <span className={`text-[11px] mt-0.5 ${scoreTextColor(cell.score)}`}>{cell.score}分</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
