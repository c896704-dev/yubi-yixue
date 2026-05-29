import type { ReactNode } from 'react'

type BadgeVariant = 'primary' | 'muted' | 'success' | 'danger' | 'warning'
type LegacyVariant = 'cyan' | 'mist' | 'green' | 'red' | 'blue'
type AnyVariant = BadgeVariant | LegacyVariant

interface BadgeProps {
  variant?: AnyVariant
  children: ReactNode
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  primary: 'badge-primary',
  muted: 'badge-muted',
  success: 'badge-success',
  danger: 'badge-danger',
  warning: 'badge-warning',
}

const legacyMap: Record<string, BadgeVariant> = {
  cyan: 'primary',
  mist: 'muted',
  green: 'success',
  red: 'danger',
  blue: 'primary',
}

function resolveVariant(v: AnyVariant): BadgeVariant {
  return legacyMap[v] || (v as BadgeVariant)
}

export function Badge({ variant = 'muted', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantClass[resolveVariant(variant)]} ${className}`}>
      {children}
    </span>
  )
}
