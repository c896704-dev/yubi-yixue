import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label
  return (
    <div className="field-wrap">
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <input id={inputId} className={`field ${error ? 'error' : ''} ${className}`} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
