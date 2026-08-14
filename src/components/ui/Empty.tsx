import { BookOpen } from './Icon'

interface EmptyProps { message?: string; className?: string }

export function Empty({ message = '暂无数据', className = '' }: EmptyProps) {
  return (
    <div className={`ds-empty ${className}`}>
      <span className="ds-empty-icon"><BookOpen size={34} strokeWidth={1.4} /></span>
      <span className="ds-empty-text">{message}</span>
    </div>
  )
}
