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
    <div className="flex flex-col gap-1">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="text-negative-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {help && !error && <span className="text-[11px] text-[#B8B8B8]">{help}</span>}
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  )
}
