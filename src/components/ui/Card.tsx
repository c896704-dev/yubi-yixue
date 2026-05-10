import type { ReactNode, HTMLAttributes } from 'react'

type CardVariant = 'default' | 'interactive' | 'tinted'
type CardPadding = 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  title?: string
  children: ReactNode
}

const variantClass: Record<CardVariant, string> = {
  default: 'card',
  interactive: 'card card-interactive',
  tinted: 'card card-tinted',
}

const paddingClass: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  variant = 'default',
  padding = 'md',
  title,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div className={`${variantClass[variant]} ${paddingClass[padding]} ${className}`} {...props}>
      {title && <div className="card-header">{title}</div>}
      {children}
    </div>
  )
}
