import { useEffect, useRef, useState, type ReactNode } from 'react'

/** 滚动显现（对齐 showcase Reveal：视口进入时 opacity+位移，可配 delay/direction） */
interface RevealProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

const offsetMap = {
  up: '0, 32px',
  down: '0, -32px',
  left: '40px, 0',
  right: '-40px, 0',
}

export function Reveal({ children, delay = 0, direction = 'up', className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translate(${offsetMap[direction]})`,
        transition: `opacity 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms, transform 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
