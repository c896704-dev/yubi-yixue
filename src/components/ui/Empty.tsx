interface EmptyProps {
  message?: string
  className?: string
}

export function Empty({ message = '暂无数据', className = '' }: EmptyProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-[#B8B8B8] ${className}`}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4">
        <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="8" y1="20" x2="56" y2="20" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
        <line x1="22" y1="36" x2="42" y2="36" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" />
        <line x1="22" y1="44" x2="36" y2="44" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" />
      </svg>
      <span className="text-sm">{message}</span>
    </div>
  )
}
