interface ScoreGaugeProps {
  score: number
  label?: string
  size?: number
  className?: string
}

function scoreColor(s: number): string {
  if (s >= 80) return '#7A9A7A'
  if (s >= 60) return '#4A9E9E'
  return '#C4664A'
}

export function ScoreGauge({ score, label, size = 180, className = '' }: ScoreGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score))
  const scale = size / 180
  const radius = Math.round(70 * scale)
  const strokeWidth = Math.max(4, Math.round(10 * scale))
  const fontSize = Math.round(28 * scale)
  const labelFontSize = Math.round(11 * scale)
  const cx = size / 2
  const cy = Math.round(size * 0.65)
  const angle = (clamped / 100) * 180
  const rad = (angle - 90) * (Math.PI / 180)
  const x = cx + radius * Math.cos(rad)
  const y = cy + radius * Math.sin(rad)
  const largeArc = angle > 90 ? 1 : 0
  const color = scoreColor(clamped)
  const svgHeight = Math.round(size * 0.75)
  const trackColor = '#E0DDD5'
  const secondaryText = '#999'

  return (
    <div className={`flex flex-col items-center ${className}`} style={{ maxWidth: size }}>
      <svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`}>
        <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke={trackColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        {clamped > 0 && (
          <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        )}
        <text x={cx} y={cy - strokeWidth * 0.6} textAnchor="middle" className="font-[family-name:var(--font-title)] font-bold" style={{ fontSize, fill: color }}>
          {Math.round(clamped)}
        </text>
        <text x={cx} y={cy + strokeWidth * 1.6} textAnchor="middle" style={{ fontSize: labelFontSize, fill: secondaryText }}>分</text>
      </svg>
      {label && <span className="mt-1 text-sm font-semibold" style={{ color: 'var(--muted)' }}>{label}</span>}
    </div>
  )
}
