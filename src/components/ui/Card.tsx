import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  title?: string
}

export function Card({ children, title, className = '', ...props }: CardProps) {
  return (
    <div className={`card ${className}`} {...props}>
      {title && <h3 className="card-header">{title}</h3>}
      {children}
    </div>
  )
}
