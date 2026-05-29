import { useState, useRef, useEffect } from 'react'
import type { PersonInfo } from '../../types'
import type { SavedRecord } from '../../utils/db'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DateTimePicker } from '../../components/form/DateTimePicker'
import { CITY_LONGITUDES } from '../../utils/solarTime'

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
  const [birthPlace, setBirthPlace] = useState('北京')
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

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
    setPickerOpen(false)
    onSubmit(r.person)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (year === '' || month === '' || day === '' || hour === '') { setError('请填写完整的出生信息'); return }
    setError('')
    const longitude = CITY_LONGITUDES[birthPlace] ?? 116.4
    onSubmit({ name: name || label, gender, birthYear: year as number, birthMonth: month as number, birthDay: day as number, birthHour: hour as number, birthMinute: minute === '' ? 0 : minute, birthPlace, longitude })
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
          <span className="field-label">性别</span>
          <div className="segmented" style={{ marginTop: 4 }}>
            {(['男', '女'] as const).map((g) => (
              <button key={g} type="button" onClick={() => setGender(g)}
                className={`segmented-item ${g === gender ? 'active' : ''}`}>{g}</button>
            ))}
          </div>
        </div>
        <DateTimePicker year={year} month={month} day={day} hour={hour} minute={minute}
          onYearChange={setYear} onMonthChange={setMonth} onDayChange={setDay}
          onHourChange={setHour} onMinuteChange={setMinute} />
        <div>
          <span className="field-label">出生地</span>
          <select className="select" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} style={{ marginTop: 4 }}>
            {['北京', '上海', '广州', '深圳', '成都', '杭州', '南京', '武汉', '重庆'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {error && <span className="field-error">{error}</span>}
        <Button type="submit" loading={loading} size="sm">开始分析</Button>
      </form>
    </div>
  )
}
