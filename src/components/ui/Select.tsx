import type { SelectHTMLAttributes, ReactNode } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: ReactNode
}

export function Select({ label, error, className = '', id, children, ...props }: SelectProps) {
  const selectId = id || label
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="input-label">{label}</label>
      )}
      <select
        id={selectId}
        className={`select ${error ? 'input-error' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  )
}
