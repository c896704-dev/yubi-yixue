import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger-ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

// Backward-compatible legacy names
type LegacyVariant = 'solid' | 'mist' | 'clear' | 'red' | 'ink'
type AnyVariant = ButtonVariant | LegacyVariant

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AnyVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  'danger-ghost': 'btn-danger-ghost',
}

const legacyMap: Record<string, ButtonVariant> = {
  solid: 'primary',
  mist: 'secondary',
  clear: 'ghost',
  red: 'accent',
  ink: 'primary',
}

function resolveVariant(v: AnyVariant): ButtonVariant {
  return legacyMap[v] || (v as ButtonVariant)
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
      <path d="M8 2a6 6 0 0 1 5.2 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const resolved = resolveVariant(variant)
  return (
    <button
      className={`btn ${variantClass[resolved]} ${sizeClass[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
