import { useState } from 'react'
import type { PersonInfo } from '../../types'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DateTimePicker } from '../../components/form/DateTimePicker'
import { ChinaMapPicker } from '../../components/form/ChinaMapPicker'
import { CITY_LONGITUDES } from '../../utils/solarTime'
import { RECOMMENDED_CITIES, type RecommendedCity } from '../../utils/cityData'

interface BaziInputProps {
  onSubmit: (person: PersonInfo) => void
  loading?: boolean
}

function PillBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ds-seg-item ${active ? 'active' : ''}`}
    >
      {label}
    </button>
  )
}

export function BaziInput({ onSubmit, loading }: BaziInputProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'男' | '女'>('男')
  const [year, setYear] = useState<number | ''>('')
  const [month, setMonth] = useState<number | ''>('')
  const [day, setDay] = useState<number | ''>('')
  const [hour, setHour] = useState<number | ''>('')
  const [minute, setMinute] = useState<number | ''>(0)
  const [selectedCity, setSelectedCity] = useState<RecommendedCity | null>(null)
  const [customPlace, setCustomPlace] = useState('')
  const [customLng, setCustomLng] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (year === '' || month === '' || day === '' || hour === '') {
      setError('请填写完整的出生日期和时间')
      return
    }
    setError('')
    let longitude: number | undefined
    if (useCustom) {
      const lng = parseFloat(customLng)
      if (isNaN(lng) || lng < -180 || lng > 180) { setError('请输入有效的经度（-180 ~ 180）'); return }
      longitude = lng
    } else {
      longitude = selectedCity?.lng ?? CITY_LONGITUDES[selectedCity?.name || ''] ?? 116.4
    }
    onSubmit({
      name: name || '未命名', gender,
      birthYear: year as number, birthMonth: month as number,
      birthDay: day as number, birthHour: hour as number,
      birthMinute: minute === '' ? 0 : minute,
      birthPlace: useCustom ? (customPlace || '自定义位置') : (selectedCity?.name || '未选择地点'),
      longitude,
    })
  }

  return (
    <Card title="出生信息">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="姓名（选填）" value={name} onChange={(e) => setName(e.target.value)} placeholder="输入姓名，留空则为「未命名」" />

        <div>
          <span className="ds-label">性别</span>
          <div className="ds-segmented mt-1">
            {(['男', '女'] as const).map((g) => (
              <button key={g} type="button" onClick={() => setGender(g)}
                className={`ds-seg-item ${g === gender ? 'active' : ''}`}>{g}</button>
            ))}
          </div>
        </div>

        <DateTimePicker
          label="出生日期与时间"
          year={year} month={month} day={day} hour={hour} minute={minute}
          onYearChange={setYear} onMonthChange={setMonth} onDayChange={setDay}
          onHourChange={setHour} onMinuteChange={setMinute}
        />

        <div>
          <span className="ds-label">出生地点</span>
          <div className="flex gap-2 mt-1 mb-2">
            <PillBtn label="地图选点" active={!useCustom} onClick={() => setUseCustom(false)} />
            <PillBtn label="自定义经度" active={useCustom} onClick={() => setUseCustom(true)} />
          </div>
          {useCustom ? (
            <div className="flex gap-2">
              <Input value={customPlace} onChange={(e) => setCustomPlace(e.target.value)} placeholder="地点名（选填）" className="flex-1" />
              <Input value={customLng} onChange={(e) => setCustomLng(e.target.value)} placeholder="经度，如 116.4" className="flex-1" />
            </div>
          ) : (
            <ChinaMapPicker
              value={selectedCity}
              onSelect={(c) => setSelectedCity(c)}
            />
          )}
        </div>

        {error && <span className="ds-field-error">{error}</span>}
        <Button type="submit" loading={loading} size="lg" className="mt-2">开始排盘</Button>
      </form>
    </Card>
  )
}
