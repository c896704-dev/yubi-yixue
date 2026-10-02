import type { CompatibilityResult } from '../../types'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { BarTrack } from '../../components/ui/BarTrack'

interface CompatScoreProps {
  result: CompatibilityResult
}

function scoreLabel(s: number): string {
  if (s >= 85) return '天作之合'
  if (s >= 70) return '上等良缘'
  if (s >= 55) return '中等可配'
  if (s >= 40) return '尚需磨合'
  return '多有不和'
}

function scoreBarColor(s: number): string {
  if (s >= 80) return '#2d6a4f'
  if (s >= 60) return '#006666'
  if (s >= 40) return '#b8960f'
  return '#9c3d54'
}

export function CompatScore({ result }: CompatScoreProps) {
  const { scores, verdict, advantages, weaknesses, warnings } = result

  return (
    <Card>
      <div className="text-center mb-6">
        <div className="font-[family-name:var(--font-title)] text-5xl font-bold mb-1" style={{ color: scoreBarColor(scores.total) }}>
          {Math.round(scores.total)}
          <span className="text-lg font-normal ml-1" style={{ color: 'rgba(0,77,77,0.55)' }}>分</span>
        </div>
        <div className="text-sm" style={{ color: 'rgba(0,77,77,0.55)' }}>{scoreLabel(scores.total)}</div>
        {verdict && <div className="mt-1 font-[family-name:var(--font-title)] text-base" style={{ color: 'var(--fg)' }}>{verdict}</div>}
      </div>

      <div className="space-y-3 mb-6">
        {[
          { label: '吸引力', score: scores.attraction, desc: '性格、外表、气场的吸引程度' },
          { label: '稳定性', score: scores.stability, desc: '长期关系的稳定与持久' },
          { label: '互补性', score: scores.complement, desc: '五行能量互补、优缺点互补' },
        ].map((s) => (
          <div key={s.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-[family-name:var(--font-title)] text-sm" style={{ color: 'var(--fg)' }}>{s.label}</span>
              <span className="text-xs" style={{ color: 'rgba(0,77,77,0.55)' }}>{s.desc}</span>
            </div>
            <div className="metric-row">
              <BarTrack value={s.score} color={scoreBarColor(s.score)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {advantages && advantages.length > 0 && (
          <div>
            <h3 className="font-[family-name:var(--font-title)] text-base font-semibold mb-2" style={{ color: 'var(--success)' }}>优势</h3>
            <div className="flex gap-1.5 flex-wrap">{advantages.map((a, i) => <Badge key={i} variant="green">{a}</Badge>)}</div>
          </div>
        )}
        {weaknesses && weaknesses.length > 0 && (
          <div>
            <h3 className="font-[family-name:var(--font-title)] text-base font-semibold mb-2" style={{ color: 'var(--danger)' }}>挑战</h3>
            <div className="flex gap-1.5 flex-wrap">{weaknesses.map((w, i) => <Badge key={i} variant="red">{w}</Badge>)}</div>
          </div>
        )}
        {warnings && warnings.length > 0 && (
          // 与原「挑战」chip 列表之间需要明确分隔：两者紧邻时会被读成同一个列表（审计 P-14）
          <div>
            <h3 className="font-[family-name:var(--font-title)] text-base font-semibold mb-2" style={{ color: 'var(--hu-po-jin-dark)' }}>需要留意</h3>
            <div className="p-4 rounded-lg flex flex-col gap-2" style={{ border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--danger) 8%, transparent)' }}>
              {warnings.map((w, i) => <p key={i} className="m-0 text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{w}</p>)}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
