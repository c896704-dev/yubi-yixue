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

const elementColors: Record<string, string> = {
  '木': '#7A9A7A',
  '火': '#4A9E9E',
  '土': '#8A8A8A',
  '金': '#B8ADA0',
  '水': '#6A9AB8',
}

function scoreTextColor(s: number): string {
  if (s >= 80) return '#7A9A7A'
  if (s >= 60) return '#4A9E9E'
  return '#C4664A'
}

export function PalaceGrid({ cells, centerLabel, className = '' }: PalaceGridProps) {
  const hasCenter = cells.length === 9 && cells[4]?.isCenter
  const gridCells = hasCenter
    ? [...cells]
    : [
        ...cells.slice(0, 4),
        { label: centerLabel || '中宫', number: 5, element: '土', isCenter: true },
        ...cells.slice(4),
      ]

  while (gridCells.length < 9) {
    gridCells.push({ label: '', number: 0 })
  }

  return (
    <div className="palace-grid">
      {gridCells.slice(0, 9).map((cell, i) => {
        const isCenter = cell.isCenter || i === 4
        const elColor = elementColors[cell.element || ''] || '#999'

        return (
          <div
            key={i}
            className={`palace-cell ${isCenter ? 'center' : ''}`}
          >
            <div className="font-[family-name:var(--font-title)] font-bold text-[15px]" style={{ color: elColor }}>
              {cell.number || '—'}
            </div>
            <div className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{cell.label}</div>
            {cell.subLabel && <div className="text-[10px] mt-px" style={{ color: 'var(--muted)' }}>{cell.subLabel}</div>}
            {cell.score !== undefined && <div className="text-[10px] mt-px" style={{ color: scoreTextColor(cell.score) }}>{cell.score}分</div>}
          </div>
        )
      })}
    </div>
  )
}
