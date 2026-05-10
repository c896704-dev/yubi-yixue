import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  maxWidth?: number
  className?: string
}

export function PageContainer({ children, maxWidth = 1100, className = '' }: PageContainerProps) {
  return (
    <main
      className={`mx-auto px-6 py-12 animate-fade-in ${className}`}
      style={{ maxWidth }}
    >
      {children}
    </main>
  )
}
