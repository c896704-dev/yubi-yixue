interface LoadingProps { className?: string; text?: string; dots?: boolean }

export function Loading({ className = '', text, dots }: LoadingProps) {
  return (
    <div className={`ds-loading ${className}`}>
      {dots ? (
        <span className="ds-dots"><span /><span /><span /></span>
      ) : (
        <div className="ds-spinner" />
      )}
      {text && <span className="ds-loading-text">{text}</span>}
    </div>
  )
}
