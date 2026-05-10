import type { BaziChart as BaziChartType, PersonInfo } from '../../types'

interface BaziChartProps {
  bazi: BaziChartType
  person: PersonInfo
  className?: string
}

const pillarLabels = ['年柱', '月柱', '日柱', '时柱']

const elementBg: Record<string, string> = {
  '木': 'bg-positive-400',
  '火': 'bg-negative-400',
  '土': 'bg-brand-500',
  '金': 'bg-gold-400',
  '水': 'bg-water-400',
}

export function BaziChart({ bazi, person, className = '' }: BaziChartProps) {
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour]

  return (
    <div className={className}>
      <h3 className="text-center font-serif text-lg font-semibold text-[#2C2C2C] mb-4">
        {person.name || '八字排盘'}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {pillarLabels.map((label) => (
                <th
                  key={label}
                  className="px-2 py-2.5 text-center bg-brand-100 text-brand-700 font-serif font-semibold text-sm border-b-2 border-brand-400"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {pillars.map((p, i) => (
                <td key={i} className="px-2 py-3 text-center font-serif text-lg font-bold text-[#2C2C2C] border-b border-[#E8E0D8]">
                  {p.stem}
                </td>
              ))}
            </tr>
            <tr>
              {pillars.map((p, i) => (
                <td key={i} className="px-2 py-3 text-center font-serif text-lg font-bold text-[#4C4C4C] border-b border-[#E8E0D8]">
                  {p.branch}
                </td>
              ))}
            </tr>
            <tr>
              {pillars.map((p, i) => (
                <td key={i} className="px-2 py-2 text-center text-[11px] text-[#8C8C8C] leading-relaxed">
                  {p.hiddenStems.length > 0 ? (
                    p.hiddenStems.map((hs, j) => (
                      <span key={j}>
                        {j > 0 && ' '}
                        <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded text-[10px] text-white ${elementBg[hs] || 'bg-[#B8B8B8]'}`}>
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
      <p className="text-center mt-3 text-sm text-[#8C8C8C]">
        日主：<strong className="text-brand-600">{bazi.dayMaster}</strong> ({bazi.dayMasterElement})
      </p>
    </div>
  )
}
