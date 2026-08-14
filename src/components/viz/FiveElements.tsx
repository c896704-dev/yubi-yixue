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
  '木': '#2d6a4f',
  '火': '#9c3d54',
  '土': '#b8960f',
  '金': '#8a8072',
  '水': '#006666',
}

export function FiveElements({ elements, className = '' }: FiveElementsProps) {
  return (
    <div className={`elements ${className}`}>
      {elements.map((el) => {
        const ratio = el.maxValue > 0 ? el.value / el.maxValue : 0
        const color = elementColors[el.name] || 'rgba(0, 77, 77, 0.45)'
        const pct = Math.round(ratio * 100)

        return (
          <div key={el.name} className="element">
            {/* Name */}
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color,
              marginBottom: 6,
            }}>
              {el.name}
            </div>
            {/* Bar */}
            <div style={{
              width: 4,
              height: 80,
              borderRadius: 99,
              background: 'var(--quaternary)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${Math.max(pct, 4)}%`,
                borderRadius: 99,
                background: color,
                transition: 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
            {/* Value + percentage */}
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dai-qing-dark)', marginTop: 6 }}>
              {el.value}
            </div>
            {el.status && (
              <span style={{ fontSize: 10, color: 'rgba(0,77,77,0.45)', marginTop: 2 }}>{el.status}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
