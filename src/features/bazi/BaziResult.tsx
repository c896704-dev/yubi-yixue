import type { AnalysisResult } from '../../types'
import { Card } from '../../components/ui/Card'

interface BaziResultProps {
  result: AnalysisResult
}

/** 身强弱 + 格局大数字卡（命盘基础信息正下方，其余排盘可视化已并入 PillarTable） */
export function BaziResult({ result }: BaziResultProps) {
  const { bodyStrength, geJu } = result
  const strong = bodyStrength === '身强' || bodyStrength === '身偏旺'

  return (
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
  )
}
