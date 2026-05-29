import type { BaziChart as BaziChartType, PersonInfo } from '../../types'

interface BaziChartProps {
  bazi: BaziChartType
  person: PersonInfo
  className?: string
}

const pillarLabels = ['年柱', '月柱', '日柱', '时柱']

const elementColors: Record<string, string> = {
  '木': '#7A9A7A',
  '火': '#4A9E9E',
  '土': '#8A8A8A',
  '金': '#B8ADA0',
  '水': '#6A9AB8',
}

export function BaziChart({ bazi, person, className = '' }: BaziChartProps) {
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour]

  return (
    <div className={className}>
      <h3 className="text-center font-[family-name:var(--font-title)] text-base font-semibold mb-4" style={{ color: 'var(--fg)' }}>
        {person.name || '八字排盘'}
      </h3>
      <div className="overflow-x-auto">
        <table className="bazi-table">
          <thead>
            <tr>
              {pillarLabels.map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {pillars.map((p, i) => (
                <td key={i} className="bazi-stem">
                  {p.stem}
                </td>
              ))}
            </tr>
            <tr>
              {pillars.map((p, i) => (
                <td key={i} className="bazi-branch">
                  {p.branch}
                </td>
              ))}
            </tr>
            <tr>
              {pillars.map((p, i) => (
                <td key={i} className="px-2 py-2 text-center text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {p.hiddenStems.length > 0 ? (
                    p.hiddenStems.map((hs, j) => (
                      <span key={j}>
                        {j > 0 && ' '}
                        <span
                          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded text-[10px] text-white"
                          style={{ backgroundColor: elementColors[hs] || '#999' }}
                        >
                          {hs}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span>{p.naYin || '—'}</span>
                  )}
                  <br />
                  <span>{p.tenGod || ''}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="bazi-daymaster">
        日主：<strong>{bazi.dayMaster}</strong> ({bazi.dayMasterElement})
      </p>
    </div>
  )
}
