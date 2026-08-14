import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label htmlFor={inputId} className="ds-label">{label}</label>}
      <input id={inputId} className={`ds-field ${error ? 'error' : ''} ${className}`} {...props} />
      {error && <span className="ds-field-error">{error}</span>}
    </div>
  )
}
