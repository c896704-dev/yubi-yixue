import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'gold' | 'positive' | 'negative'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'badge-default',
  gold: 'badge-gold',
  positive: 'badge-positive',
  negative: 'badge-negative',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return <span className={`badge ${variantClass[variant]} ${className}`}>{children}</span>
}
