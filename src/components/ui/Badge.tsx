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
  primary: 'ds-chip-zhong',
  muted: 'ds-chip-ink',
  success: 'ds-chip-ji',
  danger: 'ds-chip-xiong',
  warning: 'ds-chip-gold',
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
    <span className={`ds-chip ${variantClass[resolveVariant(variant)]} ${className}`}>
      {children}
    </span>
  )
}
