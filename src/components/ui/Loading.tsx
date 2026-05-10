interface LoadingProps {
  size?: number
  className?: string
  text?: string
}

export function Loading({ size = 32, className = '', text }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <svg
        className="animate-spin-slow"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="9" stroke="#E8E0D8" strokeWidth="2.5" />
        <path d="M12 3a9 9 0 0 1 7.8 4.5" stroke="#B8846B" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {text && <span className="text-xs text-[#8C8C8C]">{text}</span>}
    </div>
  )
}
