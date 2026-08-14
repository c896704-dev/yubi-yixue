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
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="ds-label">
          {label}
          {required && <span style={{ color: 'var(--danger)' }} className="ml-1">*</span>}
        </label>
      )}
      {children}
      {help && !error && <span className="text-[11px]" style={{ color: 'rgba(0,77,77,0.55)' }}>{help}</span>}
      {error && <span className="ds-field-error">{error}</span>}
    </div>
  )
}
