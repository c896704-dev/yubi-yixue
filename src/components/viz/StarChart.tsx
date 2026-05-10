import { useRef, useEffect } from 'react'

interface StarData {
  palace: string
  stars: { name: string; type: 'auspicious' | 'inauspicious' | 'neutral' }[]
}

interface StarChartProps {
  data: StarData[]
  className?: string
}

const starColors: Record<string, string> = {
  auspicious: '#7BAB8A',
  inauspicious: '#D4A0A0',
  neutral: '#8C8C8C',
}

export function StarChart({ data, className = '' }: StarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)

    const cols = 3
    const rows = Math.ceil(data.length / cols)
    const cellW = w / cols
    const cellH = h / rows

    data.forEach((item, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = col * cellW
      const y = row * cellH

      ctx.strokeStyle = '#E8E0D8'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, cellW, cellH)

      ctx.fillStyle = '#2C2C2C'
      ctx.font = `600 ${12 * dpr}px "Noto Serif SC", serif`
      ctx.textAlign = 'center'
      ctx.fillText(item.palace, x + cellW / 2, y + 18)

      item.stars.forEach((star, si) => {
        const sy = y + 32 + si * 18
        ctx.fillStyle = starColors[star.type]
        ctx.font = `${11 * dpr}px "Noto Sans SC", sans-serif`
        ctx.fillText(star.name, x + cellW / 2, sy)
      })
    })
  }, [data])

  return (
    <div className={`bg-white rounded-xl p-4 ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: Math.ceil(data.length / 3) * 120 }}
      />
    </div>
  )
}
