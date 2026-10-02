import { useState, useRef, useEffect } from 'react'
import type { PersonInfo } from '../../types'
import type { SavedRecord } from '../../utils/db'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DateTimePicker } from '../../components/form/DateTimePicker'
import { CITY_LONGITUDES } from '../../utils/solarTime'
import { PROVINCE_CITIES } from '../../utils/cityData'

interface DualInputProps {
  label: string
  records: SavedRecord[]
  onSubmit: (person: PersonInfo) => void
  loading?: boolean
  analyzed?: boolean
  person?: PersonInfo | null
}

export function DualInput({ label, records, onSubmit, loading, analyzed, person }: DualInputProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'男' | '女'>(label.includes('女方') ? '女' : '男')
  const [year, setYear] = useState<number | ''>('')
  const [month, setMonth] = useState<number | ''>('')
  const [day, setDay] = useState<number | ''>('')
  const [hour, setHour] = useState<number | ''>('')
  const [minute, setMinute] = useState<number | ''>(0)
  // 出生地：与八字页一致，支持省市选择或自定义经度（真太阳时校准需要精确经度）
  const [province, setProvince] = useState('北京市')
  const [birthPlace, setBirthPlace] = useState('北京城区')
  const [customPlace, setCustomPlace] = useState('')
  const [customLng, setCustomLng] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const currentProvince = PROVINCE_CITIES.find(p => p.name === province) || PROVINCE_CITIES[0]
  const citiesOfProvince = currentProvince?.cities || []

  const handleProvinceChange = (p: string) => {
    setProvince(p)
    const prov = PROVINCE_CITIES.find(x => x.name === p)
    if (prov && prov.cities.length > 0) setBirthPlace(prov.cities[0].name)
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  const handlePick = (r: SavedRecord) => {
    setName(r.person.name)
    setGender(r.person.gender as '男' | '女')
    setYear(r.person.birthYear)
    setMonth(r.person.birthMonth)
    setDay(r.person.birthDay)
    setHour(r.person.birthHour)
    setMinute(r.person.birthMinute ?? 0)
    setBirthPlace(r.person.birthPlace)
    // 档案里的出生地无法可靠映射回省市下拉，落到自定义经度模式，保留原始经度与地点名
    if (r.person.longitude != null) {
      setUseCustom(true)
      setCustomPlace(r.person.birthPlace)
      setCustomLng(String(r.person.longitude))
    }
    setPickerOpen(false)
    onSubmit(r.person)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (year === '' || month === '' || day === '' || hour === '') { setError('请填写完整的出生信息'); return }
    let longitude: number
    if (useCustom) {
      const lng = parseFloat(customLng)
      if (isNaN(lng) || lng < -180 || lng > 180) { setError('请输入有效的经度（-180 ~ 180）'); return }
      longitude = lng
    } else {
      const cityLng = citiesOfProvince.find(c => c.name === birthPlace)?.lng
      longitude = cityLng ?? CITY_LONGITUDES[birthPlace] ?? currentProvince?.cities[0]?.lng ?? 116.4
    }
    setError('')
    onSubmit({
      name: name || label, gender,
      birthYear: year as number, birthMonth: month as number, birthDay: day as number,
      birthHour: hour as number, birthMinute: minute === '' ? 0 : minute,
      birthPlace: useCustom ? (customPlace || '自定义位置') : `${province}·${birthPlace}`,
      longitude,
    })
  }

  if (analyzed && person) {
    return (
      <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid hsl(var(--border))', background: 'hsl(var(--accent) / 0.06)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{person.name}</div>
        <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{person.gender} · {person.birthYear}年{String(person.birthMonth).padStart(2, '0')}月{String(person.birthDay).padStart(2, '0')}日</div>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-lg)', background: 'hsl(var(--background))', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md) var(--space-md) 0' }}>
        <h3 style={{ fontFamily: 'var(--font-system)', fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>{label}</h3>
        {records.length > 0 && (
          <button type="button" onClick={() => setPickerOpen(!pickerOpen)}
            style={{
              fontSize: 13, fontWeight: 500, color: 'hsl(var(--accent))', background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius)',
            }}>
            选择档案 ▾
          </button>
        )}
      </div>

      {/* Scrollable picker */}
      {pickerOpen && records.length > 0 && (
        <div ref={pickerRef} style={{
          position: 'absolute', top: 44, left: 0, right: 0, zIndex: 20,
          background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
          maxHeight: 220, overflowY: 'auto', margin: '0 var(--space-sm)',
        }}>
          {records.map((r) => (
            <div key={r.id}
              onClick={() => handlePick(r)}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                cursor: 'pointer', borderBottom: '1px solid hsl(var(--border) / 0.5)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--muted))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontSize: 14, fontWeight: 500, color: 'hsl(var(--foreground))' }}>{r.label}</div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                {r.person.gender === '男' ? '♂' : '♀'} {r.person.birthYear}年 · {r.person.birthPlace}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form body */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', padding: 'var(--space-md)' }}>
        <Input label="姓名" value={name} onChange={(e) => setName(e.target.value)} placeholder="输入姓名" />
        <div>
          <span className="ds-label">性别</span>
          <div className="ds-segmented" style={{ marginTop: 4 }}>
            {(['男', '女'] as const).map((g) => (
              <button key={g} type="button" onClick={() => setGender(g)}
                className={`ds-seg-item ${g === gender ? 'active' : ''}`}>{g}</button>
            ))}
          </div>
        </div>
        <DateTimePicker year={year} month={month} day={day} hour={hour} minute={minute}
          onYearChange={setYear} onMonthChange={setMonth} onDayChange={setDay}
          onHourChange={setHour} onMinuteChange={setMinute} />
        <div>
          <span className="ds-label">出生地</span>
          <div className="ds-segmented" style={{ marginTop: 4, marginBottom: 8 }}>
            {([{ k: false, t: '省市选择' }, { k: true, t: '自定义经度' }] as const).map(({ k, t }) => (
              <button key={t} type="button" onClick={() => setUseCustom(k)}
                className={`ds-seg-item ${useCustom === k ? 'active' : ''}`}>{t}</button>
            ))}
          </div>
          {useCustom ? (
            <div className="flex gap-2">
              <Input value={customPlace} onChange={(e) => setCustomPlace(e.target.value)} placeholder="地点名（选填）" className="flex-1" />
              <Input value={customLng} onChange={(e) => setCustomLng(e.target.value)} placeholder="经度，如 116.4" className="flex-1" />
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
        </div>
        {error && <span className="ds-field-error">{error}</span>}
        <Button type="submit" loading={loading} size="sm">开始分析</Button>
      </form>
    </div>
  )
}
