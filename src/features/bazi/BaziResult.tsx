import type { AnalysisResult } from '../../types'
import { Card } from '../../components/ui/Card'

interface BaziResultProps {
  result: AnalysisResult
}

/** 身强弱 + 格局大数字卡 */
export function BaziResult({ result }: BaziResultProps) {
  const { bodyStrength, geJu } = result
  const strong = bodyStrength === '身强' || bodyStrength === '身偏旺'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="text-center">
        <div className="text-[11px] tracking-[0.2em]" style={{ color: 'rgba(0,77,77,0.55)' }}>身强身弱</div>
        <div className="font-serif text-[26px] font-bold mt-1.5" style={{ color: strong ? 'var(--zhu-sha)' : 'var(--cang-cui)' }}>
          {bodyStrength || '—'}
        </div>
      </Card>
      <Card className="text-center">
        <div className="text-[11px] tracking-[0.2em]" style={{ color: 'rgba(0,77,77,0.55)' }}>格局</div>
        <div className="font-serif text-[26px] font-bold mt-1.5" style={{ color: 'var(--dai-qing)' }}>
          {geJu || '—'}
        </div>
      </Card>
    </div>
  )
}
