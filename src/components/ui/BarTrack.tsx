import type { ReactNode } from 'react'

/**
 * 条形轨道 + 填充 + 数值。
 *
 * 八字「五行能量」与合婚「三维评分」各有一套内联实现，轨道高度、圆角、配色规则
 * 都不一致。这里只统一**条的视觉**，不强行统一整行布局——两处的行结构本就不同
 * （八字单行「标签|条|值|喜忌」，合婚两行「标签+说明」换行「条|值」），
 * 硬套一个组件只会让其中一处变差。
 */
export function BarTrack({
  value,
  max = 100,
  color,
  display,
  minPct = 4,
}: {
  value: number
  /** 归一化上限（八字五行用最大值归一，合婚用 100） */
  max?: number
  color?: string
  /** 数值文本，默认取整 */
  display?: ReactNode
  /** 最小值条宽百分比，避免 0 值时条完全消失 */
  minPct?: number
}) {
  const pct = Math.min(100, Math.max(minPct, Math.round((value / Math.max(max, 1)) * 100)))
  return (
    <>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="bar-value">{display ?? Math.round(value)}</span>
    </>
  )
}
