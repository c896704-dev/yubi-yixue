import type { Hexagram } from './types'
import { elementColors } from './utils/trigrams'

interface HexagramDisplayProps {
  hexagram: Hexagram
  label?: string
  changingPositions?: number[]
  className?: string
}

/**
 * 卦画显示组件
 * 用 CSS 绘制传统卦画：阳爻━，阴爻━ ━
 * 爻从下往上排列（初爻在最下）
 */
export function HexagramDisplay({
  hexagram,
  label,
  changingPositions = [],
  className = '',
}: HexagramDisplayProps) {
  const color = elementColors[hexagram.palaceElement]
  const lines = getLinesFromSymbol(hexagram.symbol)

  return (
    <div className={`text-center ${className}`}>
      {label && (
        <div className="text-xs mb-2" style={{ color: 'var(--muted)' }}>{label}</div>
      )}
      {/* 卦画：从下往上显示则需要 reverse，从上往下渲染 */}
      <div className="inline-flex flex-col items-center my-2">
        {lines.map((line, i) => {
          const pos = i + 1
          const isChanging = changingPositions.includes(pos)
          return (
            <div key={i} className="flex items-center justify-center" style={{ minHeight: 22 }}>
              {/* 动爻标记：固定宽度占位，保证对齐 */}
              <span className="inline-block w-5 text-center text-xs font-bold" style={{ color: 'var(--danger)' }}>
                {isChanging ? (line === 1 ? '○' : '×') : ''}
              </span>
              {line === 1 ? (
                <div className="w-[60px] h-[6px] rounded-sm" style={{ backgroundColor: 'var(--fg)' }} />
              ) : (
                <div className="flex gap-[10px] w-[60px]">
                  <div className="flex-1 h-[6px] rounded-sm" style={{ backgroundColor: 'var(--fg)' }} />
                  <div className="flex-1 h-[6px] rounded-sm" style={{ backgroundColor: 'var(--fg)' }} />
                </div>
              )}
              {/* 右侧留白保持对称 */}
              <span className="inline-block w-5" />
            </div>
          )
        })}
      </div>
      {/* 卦名 */}
      <div className={`font-[family-name:var(--font-title)] text-lg font-bold ${color.text}`}>
        {hexagram.name}
      </div>
      {/* 上下卦 */}
      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
        上{hexagram.upperTrigram}下{hexagram.lowerTrigram}
      </div>
      {/* 五行 */}
      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${color.bg} ${color.text} ${color.border} border`}>
        {hexagram.palaceElement}
      </span>
    </div>
  )
}

/** 从卦画符号提取6爻（从下往上：index0=初爻） */
function getLinesFromSymbol(symbol: number): number[] {
  const lines: number[] = []
  for (let i = 0; i < 6; i++) {
    lines.push((symbol >> i) & 1)
  }
  return lines
}
