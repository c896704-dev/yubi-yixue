import type { SelectHTMLAttributes, ReactNode } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: ReactNode
}

export function Select({ label, error, className = '', id, children, ...props }: SelectProps) {
  const selectId = id || label
  return (
    <div className="field-wrap">
      {label && <label htmlFor={selectId} className="field-label">{label}</label>}
      <div className="select-wrap">
        <select id={selectId} className={`select ${error ? 'error' : ''} ${className}`} {...props}>
          {children}
        </select>
        <span className="select-arrow" aria-hidden="true">▼</span>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
