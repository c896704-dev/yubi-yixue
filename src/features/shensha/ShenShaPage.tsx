import { useMemo, useState } from 'react'
import { ToolHeader } from '../../components/layout/ToolHeader'
import { Search, Star } from '../../components/ui/Icon'
import { calculateShenSha, type ShenShaDetail } from '../../utils/shensha'

/** 全部六十甲子 */
const GANZHI_60: string[] = Array.from({ length: 60 }, (_, i) => {
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  return STEMS[i % 10] + BRANCHES[i % 12]
})

/** 神煞词典（与引擎神煞集一致，简明释义） */
const DICT: { name: string; type: '吉' | '凶' | '中性'; desc: string }[] = [
  { name: '天乙贵人', type: '吉', desc: '最吉之神，逢凶化吉，遇难呈祥，贵人相助之象。' },
  { name: '文昌贵人', type: '吉', desc: '利学业文思，聪慧明达，考试写作皆宜。' },
  { name: '福星贵人', type: '吉', desc: '一生少忧，衣食丰足，福泽绵长。' },
  { name: '天德贵人', type: '吉', desc: '天之福德，逢凶化吉，安泰平顺。' },
  { name: '月德贵人', type: '吉', desc: '月之德，转危为安，诸事顺遂。' },
  { name: '将星', type: '吉', desc: '掌权柄之象，领导统御，果断有为。' },
  { name: '金舆', type: '吉', desc: '富贵之象，娶贤得助，车马荣华。' },
  { name: '禄神', type: '吉', desc: '食禄之禄，财运亨通，衣食无忧。' },
  { name: '学堂', type: '吉', desc: '主聪明好学，学业有成，科甲之象。' },
  { name: '词馆', type: '吉', desc: '主文采斐然，言辞清雅，宜文职。' },
  { name: '桃花', type: '中性', desc: '人缘魅力，异性缘旺；过旺则情海生波。' },
  { name: '驿马', type: '中性', desc: '走动迁移，外出发展，变动中得机。' },
  { name: '华盖', type: '中性', desc: '孤高聪慧，宜玄学艺术；清高而多孤独。' },
  { name: '红艳', type: '中性', desc: '风流多情，才艺出众，需防情缘纠葛。' },
  { name: '太极贵人', type: '吉', desc: '主聪明好学，与玄学佛道有缘。' },
  { name: '劫煞', type: '凶', desc: '外劫之煞，防破财、意外、竞争损耗。' },
  { name: '灾煞', type: '凶', desc: '灾祸之煞，防病伤、口舌、突发不顺。' },
  { name: '孤辰', type: '凶', desc: '孤僻之象，社交圈窄，需主动经营人脉。' },
  { name: '寡宿', type: '凶', desc: '寡宿入命，性格孤僻，需主动经营人情。' },
  { name: '元辰', type: '凶', desc: '颠倒之神，行运易生波折，宜谨慎。' },
  { name: '羊刃', type: '中性', desc: '刚烈果决，胆大敢为；过旺易刚愎伤人。' },
  { name: '空亡', type: '中性', desc: '旬空之支，主虚而不实；用神落空则减力。' },
]

const GZ_OPTIONS = GANZHI_60.map((gz, i) => ({ value: gz, label: gz }))

interface PillarSelectProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function PillarSelect({ label, value, onChange }: PillarSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="ds-label">{label}</span>
      <div className="ds-select-wrap">
        <select className="ds-select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">— 请选择 —</option>
          {GZ_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="ds-select-arrow" aria-hidden="true" />
      </div>
    </div>
  )
}

function pillarGroup(gz: string): { stem: string; branch: string } {
  return { stem: gz.slice(0, 1), branch: gz.slice(1) }
}

export function ShenShaPage() {
  const [yearGz, setYearGz] = useState('')
  const [monthGz, setMonthGz] = useState('')
  const [dayGz, setDayGz] = useState('')
  const [hourGz, setHourGz] = useState('')
  const [query, setQuery] = useState('')

  const result = useMemo(() => {
    if (!yearGz || !monthGz || !dayGz || !hourGz) return null
    const y = pillarGroup(yearGz)
    const m = pillarGroup(monthGz)
    const d = pillarGroup(dayGz)
    const h = pillarGroup(hourGz)
    try {
      return calculateShenSha(
        d.stem as any, y.stem as any, y.branch as any,
        m.branch as any, d.branch as any, h.branch as any,
        dayGz, undefined, [y.stem, m.stem, d.stem, h.stem] as any,
      )
    } catch {
      return null
    }
  }, [yearGz, monthGz, dayGz, hourGz])

  const byPillar = useMemo(() => {
    if (!result) return [] as { pillar: string; items: ShenShaDetail[] }[]
    const groups: { pillar: string; items: ShenShaDetail[] }[] = []
    for (const p of ['年柱', '月柱', '日柱', '时柱', '全局']) {
      const items = result.all.filter((s) => s.pillar === p || (p === '全局' && s.pillar === '全局'))
      if (items.length) groups.push({ pillar: p, items })
    }
    return groups
  }, [result])

  const dictFiltered = useMemo(() => {
    const q = query.trim()
    if (!q) return DICT
    return DICT.filter((d) => d.name.includes(q) || d.desc.includes(q))
  }, [query])

  const typeChip = (type: string) => (type === '吉' ? 'ds-chip-ji' : type === '凶' ? 'ds-chip-xiong' : 'ds-chip-zhong')

  return (
    <div>
      <ToolHeader
        eyebrow="SHENSHA REFERENCE"
        title="神煞速查"
        desc="以《渊海子平》《三命通会》为据：输入四柱干支，逐柱神煞一望便知；神煞词典随查随阅。"
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
        {/* 左：四柱查询 */}
        <div className="ds-card">
          <h2 className="ds-card-head"><Star size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />四柱查询</h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <PillarSelect label="年柱" value={yearGz} onChange={setYearGz} />
              <PillarSelect label="月柱" value={monthGz} onChange={setMonthGz} />
              <PillarSelect label="日柱" value={dayGz} onChange={setDayGz} />
              <PillarSelect label="时柱" value={hourGz} onChange={setHourGz} />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(0,77,77,0.55)' }}>
              提示：如已有八字排盘结果，可对照报告中的四柱干支输入；干支以「日干」为中心推算神煞。
            </p>
            {!result && (
              <p className="text-sm" style={{ color: 'rgba(0,77,77,0.6)' }}>
                请选择完整的年、月、日、时四柱，即可查看逐柱神煞。
              </p>
            )}
          </div>
        </div>

        {/* 右：查询结果 */}
        <div className="flex flex-col gap-5">
          {result ? (
            <>
              {byPillar.map((g) => (
                <div key={g.pillar} className="ds-card">
                  <h3 className="ds-card-head">{g.pillar}神煞</h3>
                  <div className="flex flex-col gap-2.5">
                    {g.items.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: 'var(--xuan-zhi-dark)' }}>
                        <span className={`ds-chip ${typeChip(s.type)}`} style={{ flexShrink: 0, marginTop: 2 }}>{s.name}</span>
                        <div className="min-w-0">
                          <div className="text-xs" style={{ color: 'rgba(0,77,77,0.5)' }}>{s.basedOn}</div>
                          <div className="text-[13px] leading-relaxed" style={{ color: 'var(--dai-qing)' }}>{s.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="ds-card flex items-center justify-center" style={{ minHeight: 220 }}>
              <div className="text-center">
                <Search size={28} strokeWidth={1.4} style={{ color: 'rgba(0,77,77,0.3)', marginBottom: 8 }} />
                <p className="text-sm" style={{ color: 'rgba(0,77,77,0.5)' }}>选择四柱后，神煞将在此呈现</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 词典 */}
      <div className="site-section-tight">
        <div className="sec-head" style={{ marginBottom: 24 }}>
          <div className="sec-eyebrow">SHENSHA DICTIONARY</div>
          <h2 className="sec-title" style={{ fontSize: '1.4rem' }}>神煞词典</h2>
        </div>
        <div className="flex justify-center mb-6">
          <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,77,77,0.4)' }}>
              <Search size={15} />
            </span>
            <input
              className="ds-field"
              style={{ paddingLeft: 36 }}
              placeholder="搜索神煞名称或释义…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="dict-grid">
          {dictFiltered.map((d) => (
            <div key={d.name} className="dict-card">
              <div className="dict-head">
                <span className="dict-name">{d.name}</span>
                <span className={`ds-chip ${typeChip(d.type)}`}>{d.type}</span>
              </div>
              <p className="dict-desc">{d.desc}</p>
            </div>
          ))}
          {dictFiltered.length === 0 && (
            <div className="col-span-full text-center py-10" style={{ color: 'rgba(0,77,77,0.5)' }}>
              未找到「{query}」相关神煞
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

