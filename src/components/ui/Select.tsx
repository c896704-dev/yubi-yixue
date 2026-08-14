import type { SelectHTMLAttributes, ReactNode } from 'react'
import { ChevronDown } from './Icon'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: ReactNode
}

export function Select({ label, error, className = '', id, children, ...props }: SelectProps) {
  const selectId = id || label
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label htmlFor={selectId} className="ds-label">{label}</label>}
      <div className="ds-select-wrap">
        <select id={selectId} className={`ds-select ${error ? 'error' : ''} ${className}`} {...props}>
          {children}
        </select>
        <span className="ds-select-arrow" aria-hidden="true"><ChevronDown size={12} /></span>
      </div>
      {error && <span className="ds-field-error">{error}</span>}
    </div>
  )
}
