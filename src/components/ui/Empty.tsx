interface EmptyProps { message?: string; className?: string }

export function Empty({ message = '暂无数据', className = '' }: EmptyProps) {
  return (
    <div className={`empty ${className}`}>
      <svg className="empty-icon" width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="8" width="32" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <line x1="4" y1="14" x2="36" y2="14" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="14" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        <line x1="14" y1="29" x2="22" y2="29" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      </svg>
      <span className="empty-text">{message}</span>
    </div>
  )
}
