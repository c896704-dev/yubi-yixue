import { useCallback, useEffect, useMemo, useState } from 'react'
import { ToolHeader } from '../../components/layout/ToolHeader'
import { DateTimePicker } from '../../components/form/DateTimePicker'
import { Search, Star, History, Clock } from '../../components/ui/Icon'
import { calculateShenSha, type ShenShaDetail } from '../../utils/shensha'
import { getSizhu } from '../../utils/ganzhi'
import { toTrueSolarTime, CITY_LONGITUDES } from '../../utils/solarTime'
import { PROVINCE_CITIES } from '../../utils/cityData'
import { getAllRecordsMerged, type SavedRecord } from '../../utils/db'

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

export function ShenShaPage() {
  // 出生信息（档案或手动时间）
  const [records, setRecords] = useState<SavedRecord[]>([])
  const [recordId, setRecordId] = useState('')
  const [year, setYear] = useState<number | ''>('')
  const [month, setMonth] = useState<number | ''>('')
  const [day, setDay] = useState<number | ''>('')
  const [hour, setHour] = useState<number | ''>('')
  const [minute, setMinute] = useState<number | ''>(0)
  const [query, setQuery] = useState('')
  // 出生地 → 经度：真太阳时校准必需，与八字页/合婚同一套经度数据。
  // 本页原先不做校准，导致同一命主的四柱在板块间不一致（审计 P-28）。
  const [province, setProvince] = useState('北京市')
  const [birthPlace, setBirthPlace] = useState('北京城区')
  const [customPlace, setCustomPlace] = useState('')
  const [customLng, setCustomLng] = useState('116.4')
  const [useCustomLng, setUseCustomLng] = useState(false)

  useEffect(() => {
    getAllRecordsMerged().then(setRecords).catch(() => setRecords([]))
  }, [])

  /** 从档案记录载入出生信息 */
  const handleLoadRecord = useCallback((id: string) => {
    setRecordId(id)
    const r = records.find((x) => x.id === id)
    if (!r) return
    setYear(r.person.birthYear)
    setMonth(r.person.birthMonth)
    setDay(r.person.birthDay)
    setHour(r.person.birthHour)
    setMinute(r.person.birthMinute ?? 0)
    // 档案里的出生地无法可靠映射回省市下拉，落到自定义经度模式，保留原始经度与地点名，
    // 保证与本页四柱、与八字页口径一致（本页原先不做真太阳时校准，见审计 P-28）
    if (r.person.longitude != null) {
      setUseCustomLng(true)
      setCustomPlace(r.person.birthPlace)
      setCustomLng(String(r.person.longitude))
    }
  }, [records])

  const currentProvince = PROVINCE_CITIES.find(p => p.name === province) || PROVINCE_CITIES[0]
  const citiesOfProvince = currentProvince?.cities || []

  const handleProvinceChange = (p: string) => {
    setProvince(p)
    const prov = PROVINCE_CITIES.find(x => x.name === p)
    if (prov && prov.cities.length > 0) setBirthPlace(prov.cities[0].name)
  }

  /** 出生地 → 经度（自定义模式下取输入值），供真太阳时校准使用 */
  const longitude = useMemo(() => {
    if (useCustomLng) {
      const v = parseFloat(customLng)
      return isNaN(v) ? 116.4 : v
    }
    const cityLng = citiesOfProvince.find(c => c.name === birthPlace)?.lng
    return cityLng ?? CITY_LONGITUDES[birthPlace] ?? currentProvince?.cities[0]?.lng ?? 116.4
  }, [useCustomLng, customLng, citiesOfProvince, birthPlace, currentProvince])

  /** 校准后的出生日期时间；输入不完整时返回 null */
  const calTime = useMemo(() => {
    if (year === '' || month === '' || day === '' || hour === '') return null
    const { hour: trueHour, minute: trueMinute, dayOffset } = toTrueSolarTime(
      hour, minute === '' ? 0 : minute, longitude, year, month, day,
    )
    const dt = new Date(year, month - 1, day)
    dt.setDate(dt.getDate() + dayOffset)
    return {
      y: dt.getFullYear(), mo: dt.getMonth() + 1, d: dt.getDate(), h: trueHour,
      trueHour, trueMinute, dayOffset,
    }
  }, [year, month, day, hour, minute, longitude])

  /** 出生信息 → 四柱 → 神煞 */
  const result = useMemo(() => {
    if (!calTime) return null
    const sz = getSizhu(calTime.y, calTime.mo, calTime.d, calTime.h)
    const y = sz.year
    const m = sz.month
    const d = sz.day
    const h = sz.hour
    try {
      return calculateShenSha(
        d.gan as any, y.gan as any, y.zhi as any,
        m.zhi as any, d.zhi as any, h.zhi as any,
        d.full, undefined, [y.gan, m.gan, d.gan, h.gan] as any,
      )
    } catch {
      return null
    }
  }, [calTime])

  /** 四柱展示（从出生时间推算） */
  const sizhu = useMemo(() => {
    if (!calTime) return null
    return getSizhu(calTime.y, calTime.mo, calTime.d, calTime.h)
  }, [calTime])

  const byPillar = useMemo(() => {
    if (!result) return [] as { pillar: string; items: ShenShaDetail[] }[]
    // 引擎返回的柱位为“年支/月支/日支/时支”，页面按“X柱”展示，需统一归组；
    // 旧实现只匹配“年柱/月柱/日柱/时柱”，导致大量神煞被丢弃、只剩日柱/全局。
    const pillarAlias: Record<string, string> = {
      '年柱': '年柱', '年支': '年柱',
      '月柱': '月柱', '月支': '月柱',
      '日柱': '日柱', '日支': '日柱',
      '时柱': '时柱', '时支': '时柱',
      '全局': '全局',
    }
    return ['年柱', '月柱', '日柱', '时柱', '全局'].map((pillar) => ({
      pillar,
      items: result.all.filter((s) => pillarAlias[s.pillar] === pillar),
    }))
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

      <div className="grid gap-6 lg:grid-cols-[400px_1fr] items-start">
        {/* 左：出生信息（档案 / 时间） */}
        <div className="ds-card">
          <h2 className="ds-card-head"><Star size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />出生信息</h2>
          <div className="flex flex-col gap-4">
            {/* 档案选择 */}
            <div>
              <span className="ds-label"><History size={11} style={{ marginRight: 3, verticalAlign: -1 }} />选择档案</span>
              <div className="ds-select-wrap" style={{ marginTop: 4 }}>
                <select
                  className="ds-select"
                  value={recordId}
                  onChange={(e) => handleLoadRecord(e.target.value)}
                >
                  <option value="">— 从八字排盘记录中选择 —</option>
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} · {r.person.gender}{r.person.birthYear}年{r.person.birthMonth}月{r.person.birthDay}日
                    </option>
                  ))}
                </select>
                <span className="ds-select-arrow" aria-hidden="true" />
              </div>
              {records.length === 0 && (
                <p className="text-xs mt-1.5" style={{ color: 'rgba(0,77,77,0.5)' }}>
                  暂无历史档案，可先在「八字排盘」页排盘生成，或直接填写下方出生时间。
                </p>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--dan-mo)', paddingTop: 14 }}>
              <DateTimePicker
                label="出生日期与时间"
                year={year} month={month} day={day} hour={hour} minute={minute}
                onYearChange={setYear} onMonthChange={setMonth} onDayChange={setDay}
                onHourChange={setHour} onMinuteChange={setMinute}
              />
            </div>

            {/* 出生地：真太阳时校准必需（与八字页同一套经度数据） */}
            <div style={{ borderTop: '1px solid var(--dan-mo)', paddingTop: 14 }}>
              <span className="ds-label">出生地（用于真太阳时校准）</span>
              <div className="ds-segmented" style={{ marginTop: 6, marginBottom: 8 }}>
                {([{ k: false, t: '省市选择' }, { k: true, t: '自定义经度' }] as const).map(({ k, t }) => (
                  <button key={t} type="button" onClick={() => setUseCustomLng(k)}
                    className={`ds-seg-item ${useCustomLng === k ? 'active' : ''}`}>{t}</button>
                ))}
              </div>
              {useCustomLng ? (
                <div className="flex gap-2">
                  <input
                    className="ds-field flex-1"
                    value={customPlace}
                    onChange={(e) => setCustomPlace(e.target.value)}
                    placeholder="地点名（选填）"
                  />
                  <input
                    className="ds-field flex-1"
                    type="number"
                    step="0.1"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="经度，如 116.4"
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="ds-select-wrap flex-1">
                    <select className="ds-select" value={province} onChange={(e) => handleProvinceChange(e.target.value)}>
                      {PROVINCE_CITIES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                    <span className="ds-select-arrow" aria-hidden="true" />
                  </div>
                  <div className="ds-select-wrap flex-1">
                    <select className="ds-select" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)}>
                      {citiesOfProvince.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <span className="ds-select-arrow" aria-hidden="true" />
                  </div>
                </div>
              )}
              {calTime && (
                <p className="caliber-note" style={{ marginTop: 10 }}>
                  真太阳时 <b>{String(calTime.trueHour).padStart(2, '0')}:{String(calTime.trueMinute).padStart(2, '0')}</b>
                  （经度 {longitude.toFixed(1)}°E{calTime.dayOffset !== 0 ? '，已跨日' : ''}）；时柱按校准后时间取。
                </p>
              )}
            </div>

            {/* 四柱预览 */}
            {sizhu && (
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '年柱', gz: sizhu.year.full },
                  { label: '月柱', gz: sizhu.month.full },
                  { label: '日柱', gz: sizhu.day.full },
                  { label: '时柱', gz: sizhu.hour.full },
                ].map((p) => (
                  <span key={p.label} className="ds-chip ds-chip-gold">
                    {p.label} <b className="font-serif" style={{ fontSize: 12 }}>{p.gz}</b>
                  </span>
                ))}
              </div>
            )}
            {!sizhu && (
              <p className="text-sm" style={{ color: 'rgba(0,77,77,0.6)' }}>
                <Clock size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                选择档案或填写出生时间，即可自动排出四柱并查看逐柱神煞。
              </p>
            )}
          </div>
        </div>

        {/* 右：查询结果 */}
        <div className="flex flex-col gap-5">
          {result ? (
            byPillar.length === 0 ? (
              <div className="ds-card flex items-center justify-center" style={{ minHeight: 180 }}>
                <p className="text-sm" style={{ color: 'rgba(0,77,77,0.55)' }}>此命局未命中常见神煞，命格清简。</p>
              </div>
            ) : (
              <div className="ss-result-grid">
                {byPillar.map((g) => (
                  <div key={g.pillar} className={`ds-card ss-result-card ${g.pillar === '全局' ? 'ss-result-global' : ''}`}>
                    <h3 className="ds-card-head ss-result-head">{g.pillar}神煞</h3>
                    {g.items.length === 0 ? (
                      <div className="ss-result-empty">
                        {g.pillar === '全局' ? '此命局未命中天德/月德等全局神煞。' : `${g.pillar}未命中神煞。`}
                      </div>
                    ) : (
                      <div className="ss-result-list">
                        {g.items.map((s, i) => (
                          <div key={i} className="ss-result-item">
                            <span className={`ds-chip ${typeChip(s.type)}`} style={{ flexShrink: 0, marginTop: 1 }}>{s.name}</span>
                            <div className="min-w-0">
                              <div className="text-[11px]" style={{ color: 'rgba(0,77,77,0.5)' }}>{s.basedOn}</div>
                              <div className="text-[12px] leading-snug" style={{ color: 'var(--dai-qing)' }}>{s.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="ds-card flex items-center justify-center" style={{ minHeight: 220 }}>
              <div className="text-center">
                <Search size={28} strokeWidth={1.4} style={{ color: 'rgba(0,77,77,0.3)', marginBottom: 8 }} />
                <p className="text-sm" style={{ color: 'rgba(0,77,77,0.5)' }}>选择档案或填写出生时间后，神煞将在此呈现</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 词典（默认收起：与本次命盘无关，占页面高度近半） */}
      <div className="site-section-tight">
        <div className="sec-head" style={{ marginBottom: 12 }}>
          <div className="sec-eyebrow">SHENSHA DICTIONARY</div>
          <h2 className="sec-title" style={{ fontSize: '1.4rem' }}>神煞词典</h2>
        </div>
        <details className="dict-fold">
          <summary className="dict-fold-summary">
            展开词典（{DICT.length} 条）· 可搜索名称或释义
          </summary>
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
        </details>
      </div>
    </div>
  )
}

