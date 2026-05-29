import type { AnalysisResult } from '../../types'
import { Card } from '../../components/ui/Card'
import { BaziChart } from '../../components/viz/BaziChart'
import { FiveElements, type ElementData } from '../../components/viz/FiveElements'
import { Badge } from '../../components/ui/Badge'

interface BaziResultProps {
  result: AnalysisResult
}

export function BaziResult({ result }: BaziResultProps) {
  const { bazi, person, fiveElementDistribution, bodyStrength, geJu, yongShen } = result

  const elements: ElementData[] = (
    ['木', '火', '土', '金', '水'] as const
  ).map((el) => ({
    name: el,
    value: fiveElementDistribution[el] || 0,
    maxValue: Math.max(...Object.values(fiveElementDistribution), 1),
    status: yongShen?.favorable?.includes(el) ? '喜用' : yongShen?.unfavorable?.includes(el) ? '忌' : undefined,
  }))

  const strong = bodyStrength === '身强' || bodyStrength === '身偏旺'

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <BaziChart bazi={bazi} person={person} />
      </Card>

      <Card title="五行能量">
        <FiveElements elements={elements} />
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>身强身弱</div>
          <div className="font-[family-name:var(--font-title)] text-[22px] font-bold mt-1" style={{ color: strong ? 'var(--danger)' : 'var(--success)' }}>
            {bodyStrength || '—'}
          </div>
        </Card>
        <Card className="text-center">
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>格局</div>
          <div className="font-[family-name:var(--font-title)] text-[22px] font-bold mt-1" style={{ color: 'var(--fg)' }}>
            {geJu || '—'}
          </div>
        </Card>
      </div>

      {yongShen && (
        <Card title="喜用神">
          <div className="flex gap-2 flex-wrap">
            {yongShen.favorable?.map((el) => <Badge key={el} variant="green">{el}</Badge>)}
            {yongShen.unfavorable?.map((el) => <Badge key={el} variant="red">{el}</Badge>)}
          </div>
          {yongShen.commentary && yongShen.commentary.length > 0 && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{yongShen.commentary.join('；')}</p>
          )}
        </Card>
      )}
    </div>
  )
}
