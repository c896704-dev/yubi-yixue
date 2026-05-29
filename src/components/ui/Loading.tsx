interface LoadingProps { className?: string; text?: string }

export function Loading({ className = '', text }: LoadingProps) {
  return (
    <div className={`loading ${className}`}>
      <div className="loading-spinner" />
      {text && <span className="loading-text">{text}</span>}
    </div>
  )
}
