import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem { id: number; type: ToastType; message: string }
interface ToastContextValue { toast: (type: ToastType, message: string) => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })
export function useToast() { return useContext(ToastContext) }

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastMessage key={t.id} item={t} onDone={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const typeClass: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  info: 'toast-info',
}

const typeIcons: Record<ToastType, string> = {
  success: '✓', error: '✕', info: 'i',
}

function ToastMessage({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className={`toast ${typeClass[item.type]}`}>
      <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{typeIcons[item.type]}</span>
      {item.message}
    </div>
  )
}
