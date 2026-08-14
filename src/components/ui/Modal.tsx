import { useEffect, type ReactNode } from 'react'
import { X } from './Icon'

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
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ds-modal-overlay" onClick={onClose}>
      <div
        className="ds-modal"
        style={{ width: Math.min(width, window.innerWidth - 32) }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="ds-modal-head">
            <h2 className="ds-modal-title">{title}</h2>
            <button onClick={onClose} className="ds-modal-close" aria-label="关闭">
              <X size={15} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
