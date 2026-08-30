import { useState } from 'react'
import type { PersonInfo } from '../../types'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DateTimePicker } from '../../components/form/DateTimePicker'
import { CITY_LONGITUDES } from '../../utils/solarTime'
import { PROVINCE_CITIES } from '../../utils/cityData'

interface BaziInputProps {
  onSubmit: (person: PersonInfo) => void
  loading?: boolean
  /** 提交按钮文案（默认"开始排盘"，供复用方定制） */
  submitLabel?: string
  /** 外部灌入的初始值（如从历史档案带出）；配合父组件 key 重挂载生效 */
  initialPerson?: PersonInfo
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

export function BaziInput({ onSubmit, loading, submitLabel = '开始排盘', initialPerson }: BaziInputProps) {
  const hasInitial = Boolean(initialPerson)
  const [name, setName] = useState(initialPerson && initialPerson.name !== '未命名' ? initialPerson.name : '')
  const [gender, setGender] = useState<'男' | '女'>(initialPerson?.gender ?? '男')
  const [year, setYear] = useState<number | ''>(initialPerson?.birthYear ?? '')
  const [month, setMonth] = useState<number | ''>(initialPerson?.birthMonth ?? '')
  const [day, setDay] = useState<number | ''>(initialPerson?.birthDay ?? '')
  const [hour, setHour] = useState<number | ''>(initialPerson?.birthHour ?? '')
  const [minute, setMinute] = useState<number | ''>(initialPerson?.birthMinute ?? 0)
  // 带出档案经度：落入自定义模式（档案的 birthPlace 无法可靠映射回省市下拉）
  const [province, setProvince] = useState('北京市')
  const [birthPlace, setBirthPlace] = useState('北京城区')
  const [customPlace, setCustomPlace] = useState(initialPerson?.birthPlace ?? '')
  const [customLng, setCustomLng] = useState(initialPerson?.longitude != null ? String(initialPerson.longitude) : '')
  const [useCustom, setUseCustom] = useState(hasInitial && initialPerson?.longitude != null)
  const [error, setError] = useState('')

  // 当前省份的城市列表
  const currentProvince = PROVINCE_CITIES.find(p => p.name === province) || PROVINCE_CITIES[0]
  const citiesOfProvince = currentProvince?.cities || []

  const handleProvinceChange = (p: string) => {
    setProvince(p)
    const prov = PROVINCE_CITIES.find(x => x.name === p)
    if (prov && prov.cities.length > 0) {
      setBirthPlace(prov.cities[0].name)
    }
  }

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
      // 优先用市级经度，退化为省级经度，再退化为默认北京
      const cityLng = citiesOfProvince.find(c => c.name === birthPlace)?.lng
      longitude = cityLng ?? CITY_LONGITUDES[birthPlace] ?? currentProvince?.cities[0]?.lng ?? 116.4
    }
    onSubmit({
      name: name || '未命名', gender,
      birthYear: year as number, birthMonth: month as number,
      birthDay: day as number, birthHour: hour as number,
      birthMinute: minute === '' ? 0 : minute,
      birthPlace: useCustom ? (customPlace || '自定义位置') : `${province}·${birthPlace}`,
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
            <PillBtn label="省市选择" active={!useCustom} onClick={() => setUseCustom(false)} />
            <PillBtn label="自定义经度" active={useCustom} onClick={() => setUseCustom(true)} />
          </div>
          {useCustom ? (
            <div className="flex gap-2">
              <Input value={customPlace} onChange={(e) => setCustomPlace(e.target.value)} placeholder="地点名（选填）" className="flex-1" />
              <Input value={customLng} onChange={(e) => setCustomLng(e.target.value)} placeholder="经度，如 116.4" className="flex-1" />
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="ds-select-wrap flex-1">
              <select
                className="ds-select"
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
              >
                {PROVINCE_CITIES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              <span className="ds-select-arrow" aria-hidden="true" />
              </div>
              <div className="ds-select-wrap flex-1">
              <select
                className="ds-select"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
              >
                {citiesOfProvince.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <span className="ds-select-arrow" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>

        {error && <span className="ds-field-error">{error}</span>}
        <Button type="submit" loading={loading} size="lg" className="mt-2">{submitLabel}</Button>
      </form>
    </Card>
  )
}
