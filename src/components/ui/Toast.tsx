import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

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
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastMessage key={t.id} item={t} onDone={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const typeBorder: Record<ToastType, string> = {
  success: 'border-positive-400',
  error: 'border-negative-400',
  info: 'border-brand-400',
}

const typeDot: Record<ToastType, string> = {
  success: 'bg-positive-100 text-positive-600',
  error: 'bg-negative-100 text-negative-500',
  info: 'bg-brand-100 text-brand-600',
}

function ToastMessage({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className={`animate-slide-up flex items-center gap-2.5 px-4 py-3 bg-white border-l-[3px] rounded-lg shadow-card max-w-sm text-sm text-[#2C2C2C] ${typeBorder[item.type]}`}
    >
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${typeDot[item.type]}`}>
        {item.type === 'success' ? '✓' : item.type === 'error' ? '✕' : 'i'}
      </span>
      {item.message}
    </div>
  )
}
