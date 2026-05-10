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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <BaziChart bazi={bazi} person={person} />
      </Card>

      <Card title="五行能量">
        <FiveElements elements={elements} />
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="text-center">
            <span className="text-[11px] text-[#8C8C8C]">身强身弱</span>
            <div className={`font-serif text-[22px] font-bold mt-1 ${
              bodyStrength === '身强' || bodyStrength === '身偏旺' ? 'text-negative-400' : 'text-positive-400'
            }`}>
              {bodyStrength || '—'}
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <span className="text-[11px] text-[#8C8C8C]">格局</span>
            <div className="font-serif text-[22px] font-bold text-[#2C2C2C] mt-1">
              {geJu || '—'}
            </div>
          </div>
        </Card>
      </div>

      {yongShen && (
        <Card title="喜用神">
          <div className="flex gap-2 flex-wrap">
            {yongShen.favorable?.map((el) => <Badge key={el} variant="positive">{el}</Badge>)}
            {yongShen.unfavorable?.map((el) => <Badge key={el} variant="negative">{el}</Badge>)}
          </div>
          {yongShen.commentary && yongShen.commentary.length > 0 && (
            <p className="mt-3 text-sm text-[#8C8C8C] leading-relaxed">
              {yongShen.commentary.join('；')}
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
