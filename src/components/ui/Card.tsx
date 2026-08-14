import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  title?: string
  /** 悬停浮起效果 */
  hover?: boolean
}

export function Card({ children, title, hover, className = '', ...props }: CardProps) {
  return (
    <div className={`ds-card ${hover ? 'ds-card-hover' : ''} ${className}`} {...props}>
      {title && <h3 className="ds-card-head">{title}</h3>}
      {children}
    </div>
  )
}
