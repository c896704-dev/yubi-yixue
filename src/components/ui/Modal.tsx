import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: number
}

export function Modal({ open, onClose, title, children, width = 440 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(44, 44, 44, 0.3)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="animate-scale-in"
        style={{ width: Math.min(width, window.innerWidth - 32), maxHeight: '85vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card p-8">
          {title && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-[22px] font-semibold text-[#2C2C2C] m-0">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm !p-1"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
