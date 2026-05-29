import type { ReactNode } from 'react'

interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  help?: string
  children: ReactNode
}

export function FormField({ label, error, required, help, children }: FormFieldProps) {
  return (
    <div className="field-wrap">
      {label && (
        <label className="field-label">
          {label}
          {required && <span style={{ color: 'var(--danger)' }} className="ml-1">*</span>}
        </label>
      )}
      {children}
      {help && !error && <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{help}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
