import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
  title?: string
  desc?: string
}

export function PageContainer({ children, className = '', title, desc }: PageContainerProps) {
  return (
    <main className={`page-wrap ${className}`}>
      {title && (
        <div className="page-header">
          <h1 className="page-header-title">{title}</h1>
          {desc && <p className="page-header-desc">{desc}</p>}
        </div>
      )}
      {children}
      <div className="page-ink-bottom" />
    </main>
  )
}
