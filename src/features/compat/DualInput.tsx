import { useState } from 'react'
import type { PersonInfo } from '../../types'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DateTimePicker } from '../../components/form/DateTimePicker'
import { CITY_LONGITUDES } from '../../utils/solarTime'

interface DualInputProps {
  label: string
  onSubmit: (person: PersonInfo) => void
  loading?: boolean
  analyzed?: boolean
  person?: PersonInfo | null
}

export function DualInput({ label, onSubmit, loading, analyzed, person }: DualInputProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'男' | '女'>(label.includes('女方') ? '女' : '男')
  const [year, setYear] = useState<number | ''>('')
  const [month, setMonth] = useState<number | ''>('')
  const [day, setDay] = useState<number | ''>('')
  const [hour, setHour] = useState<number | ''>('')
  const [minute, setMinute] = useState<number | ''>(0)
  const [birthPlace, setBirthPlace] = useState('北京')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (year === '' || month === '' || day === '' || hour === '') {
      setError('请填写完整的出生信息')
      return
    }
    setError('')
    const longitude = CITY_LONGITUDES[birthPlace] ?? 116.4
    onSubmit({
      name: name || label,
      gender,
      birthYear: year as number,
      birthMonth: month as number,
      birthDay: day as number,
      birthHour: hour as number,
      birthMinute: minute === '' ? 0 : minute,
      birthPlace,
      longitude,
    })
  }

  if (analyzed && person) {
    return (
      <div className="p-4 bg-brand-50 rounded-xl border border-[#E8E0D8] text-center">
        <div className="text-[11px] text-[#8C8C8C] mb-1">{label}</div>
        <div className="text-[15px] font-semibold text-[#2C2C2C]">{person.name}</div>
        <div className="text-sm text-[#8C8C8C]">{person.gender} · {person.birthYear}年{person.birthMonth}月{person.birthDay}日</div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-[#E8E0D8]">
      <h3 className="font-serif text-lg font-semibold text-[#2C2C2C] mb-4">{label}</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input label="姓名" value={name} onChange={(e) => setName(e.target.value)} placeholder="输入姓名" />
        <div>
          <span className="input-label">性别</span>
          <div className="flex gap-1.5 mt-1">
            {(['男', '女'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm cursor-pointer transition-all ${
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
          year={year} month={month} day={day} hour={hour} minute={minute}
          onYearChange={setYear} onMonthChange={setMonth} onDayChange={setDay}
          onHourChange={setHour} onMinuteChange={setMinute}
        />
        <div>
          <span className="input-label">出生地</span>
          <select className="select" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)}>
            {['北京', '上海', '广州', '深圳', '成都', '杭州', '南京', '武汉', '重庆'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {error && <span className="input-error-msg">{error}</span>}
        <Button type="submit" loading={loading} size="sm" className="mt-1">开始分析</Button>
      </form>
    </div>
  )
}
