import type { CompatibilityResult } from '../../types'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

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
  if (s >= 80) return 'bg-positive-400'
  if (s >= 60) return 'bg-gold-400'
  if (s >= 40) return 'bg-brand-400'
  return 'bg-negative-400'
}

export function CompatScore({ result }: CompatScoreProps) {
  const { scores, verdict, advantages, weaknesses, warnings } = result

  return (
    <Card>
      {/* 总分大卡 */}
      <div className="text-center mb-6">
        <div className="font-serif text-5xl font-bold text-[#2C2C2C] mb-1">
          {Math.round(scores.total)}
          <span className="text-lg text-[#8C8C8C] font-normal ml-1">分</span>
        </div>
        <div className="text-sm text-[#8C8C8C]">{scoreLabel(scores.total)}</div>
        {verdict && <div className="mt-1 font-serif text-base text-[#2C2C2C]">{verdict}</div>}
      </div>

      {/* 三个子维度：横条 + 分数 */}
      <div className="space-y-3 mb-6">
        {[
          { label: '吸引力', score: scores.attraction, desc: '性格、外表、气场的吸引程度' },
          { label: '稳定性', score: scores.stability, desc: '长期关系的稳定与持久' },
          { label: '互补性', score: scores.complement, desc: '五行能量互补、优缺点互补' },
        ].map((s) => (
          <div key={s.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-serif text-[#2C2C2C] text-sm">{s.label}</span>
              <span className="text-xs text-[#8C8C8C]">{s.desc}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-paper-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${scoreBarColor(s.score)}`}
                  style={{ width: `${Math.min(100, Math.max(0, s.score))}%` }}
                />
              </div>
              <span className="font-bold text-sm text-[#2C2C2C] w-8 text-right">
                {Math.round(s.score)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 优势 / 挑战 / 告警 */}
      <div className="flex flex-col gap-4">
        {advantages && advantages.length > 0 && (
          <div>
            <h3 className="font-serif text-lg font-semibold text-positive-600 mb-2">优势</h3>
            <div className="flex gap-1.5 flex-wrap">
              {advantages.map((a, i) => <Badge key={i} variant="positive">{a}</Badge>)}
            </div>
          </div>
        )}
        {weaknesses && weaknesses.length > 0 && (
          <div>
            <h3 className="font-serif text-lg font-semibold text-negative-600 mb-2">挑战</h3>
            <div className="flex gap-1.5 flex-wrap">
              {weaknesses.map((w, i) => <Badge key={i} variant="negative">{w}</Badge>)}
            </div>
          </div>
        )}
        {warnings && warnings.length > 0 && (
          <div className="p-4 bg-negative-50 rounded-lg border border-negative-200">
            {warnings.map((w, i) => (
              <p key={i} className="m-0 text-sm text-[#4C4C4C] leading-relaxed">{w}</p>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
