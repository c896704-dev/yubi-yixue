import { useState } from 'react'
import type { PersonInfo } from '../../types'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DateTimePicker } from '../../components/form/DateTimePicker'
import { CITY_LONGITUDES } from '../../utils/solarTime'

interface BaziInputProps {
  onSubmit: (person: PersonInfo) => void
  loading?: boolean
}

const popularCities = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '南京',
  '武汉', '重庆', '西安', '天津', '长沙', '郑州', '济南',
  '青岛', '大连', '厦门', '福州', '昆明', '贵阳',
]

export function BaziInput({ onSubmit, loading }: BaziInputProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'男' | '女'>('男')
  const [year, setYear] = useState<number | ''>('')
  const [month, setMonth] = useState<number | ''>('')
  const [day, setDay] = useState<number | ''>('')
  const [hour, setHour] = useState<number | ''>('')
  const [minute, setMinute] = useState<number | ''>(0)
  const [birthPlace, setBirthPlace] = useState('北京')
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
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError('请输入有效的经度（-180 ~ 180）')
        return
      }
      longitude = lng
    } else {
      longitude = CITY_LONGITUDES[birthPlace] ?? 116.4
    }

    onSubmit({
      name: name || '未命名',
      gender,
      birthYear: year as number,
      birthMonth: month as number,
      birthDay: day as number,
      birthHour: hour as number,
      birthMinute: minute === '' ? 0 : minute,
      birthPlace: useCustom ? (customPlace || '自定义位置') : birthPlace,
      longitude,
    })
  }

  return (
    <Card title="出生信息">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="姓名（选填）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入姓名，留空则为「未命名」"
        />

        <div>
          <span className="input-label">性别</span>
          <div className="flex gap-2 mt-1">
            {(['男', '女'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 ${
                  g === gender
                    ? 'border-2 border-brand-500 bg-brand-50 text-brand-700 font-semibold'
                    : 'border border-[#E8E0D8] bg-white text-[#8C8C8C]'
                }`}
              >
                {g}
              </button>
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
          <span className="input-label">出生地点</span>
          <div className="flex gap-2 mt-1 mb-2">
            <button
              type="button"
              onClick={() => setUseCustom(false)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] cursor-pointer transition-all ${
                !useCustom ? 'bg-brand-500 text-white' : 'bg-paper-200 text-[#8C8C8C]'
              }`}
            >
              城市选择
            </button>
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] cursor-pointer transition-all ${
                useCustom ? 'bg-brand-500 text-white' : 'bg-paper-200 text-[#8C8C8C]'
              }`}
            >
              自定义经度
            </button>
          </div>
          {useCustom ? (
            <div className="flex gap-2">
              <Input value={customPlace} onChange={(e) => setCustomPlace(e.target.value)} placeholder="地点名（选填）" className="flex-1" />
              <Input value={customLng} onChange={(e) => setCustomLng(e.target.value)} placeholder="经度，如 116.4" className="flex-1" />
            </div>
          ) : (
            <select className="select" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)}>
              {popularCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {error && <span className="input-error-msg">{error}</span>}

        <Button type="submit" loading={loading} size="lg" className="mt-2">
          开始排盘
        </Button>
      </form>
    </Card>
  )
}
