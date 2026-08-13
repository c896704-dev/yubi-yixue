import { useMemo, useState } from 'react'
import { Solar, Lunar, LunarYear, LunarMonth } from 'lunar-typescript'

interface DateTimePickerProps {
  label?: string
  year: number | ''
  month: number | ''
  day: number | ''
  hour: number | ''
  minute: number | ''
  onYearChange: (v: number | '') => void
  onMonthChange: (v: number | '') => void
  onDayChange: (v: number | '') => void
  onHourChange: (v: number | '') => void
  onMinuteChange: (v: number | '') => void
  error?: string
}

/** 农历模式内部显示值（月为负数表示闰月，如 -2 = 闰二月） */
interface LunarDisplay {
  y: number | ''
  m: number | ''
  d: number | ''
}

/** 公历转农历显示值 */
function solarToLunarDisplay(y: number, m: number, d: number): LunarDisplay {
  try {
    const l = Solar.fromYmd(y, m, d).getLunar()
    return { y: l.getYear(), m: l.getMonth(), d: l.getDay() }
  } catch {
    return { y, m, d }
  }
}

/** 农历显示值转公历（月为负表示闰月）；无效日期返回 null */
function lunarDisplayToSolar(y: number, m: number, d: number): { y: number; m: number; d: number } | null {
  try {
    const s = Lunar.fromYmd(y, m, d).getSolar()
    // lunar-typescript 对无效日期会静默修正（如二月三十→三月初一），校验转换结果
    const back = s.getLunar()
    if (back.getYear() !== y || back.getMonth() !== m || back.getDay() !== d) return null
    return { y: s.getYear(), m: s.getMonth(), d: s.getDay() }
  } catch {
    return null
  }
}

function NumSelect({
  value,
  onChange,
  options,
  placeholder,
  format,
}: {
  value: number | ''
  onChange: (v: number | '') => void
  options: number[]
  placeholder: string
  format?: (n: number) => string
}) {
  return (
    <select
      className="select"
      value={value}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? '' : Number(v))
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((n) => (
        <option key={String(n)} value={String(n)}>
          {format ? format(n) : String(n).padStart(2, '0')}
        </option>
      ))}
    </select>
  )
}

export function DateTimePicker({
  label,
  year, month, day, hour, minute,
  onYearChange, onMonthChange, onDayChange,
  onHourChange, onMinuteChange,
  error,
}: DateTimePickerProps) {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= 1900; y--) years.push(y)

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i) // 0-59 全量分钟

  // 公历 / 农历模式
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar')
  const [lunar, setLunar] = useState<LunarDisplay>({ y: '', m: '', d: '' })

  /** 切换到农历：把当前公历日期转成农历显示 */
  const switchToLunar = () => {
    if (year !== '' && month !== '' && day !== '') {
      setLunar(solarToLunarDisplay(year, month, day))
    } else {
      setLunar({ y: year, m: month, d: day })
    }
    setCalendarType('lunar')
  }

  /** 切换到公历：把农历显示值转成公历（无效则清空日期，让用户重选） */
  const switchToSolar = () => {
    setCalendarType('solar')
    if (lunar.y !== '' && lunar.m !== '' && lunar.d !== '') {
      const s = lunarDisplayToSolar(lunar.y, lunar.m, lunar.d)
      if (s) {
        onYearChange(s.y); onMonthChange(s.m); onDayChange(s.d)
        return
      }
    }
    // 无效农历日期：清空公历日期，提示由外部 error 处理
    onYearChange(''); onMonthChange(''); onDayChange('')
  }

  /** 农历模式下修改字段：实时转公历同步给父组件 */
  const updateLunar = (patch: Partial<LunarDisplay>) => {
    const next = { ...lunar, ...patch }
    setLunar(next)
    if (next.y !== '' && next.m !== '' && next.d !== '') {
      const s = lunarDisplayToSolar(next.y, next.m, next.d)
      if (s) {
        onYearChange(s.y); onMonthChange(s.m); onDayChange(s.d)
        return
      }
      // 无效农历日期（如四月三十）：暂不同步公历，等用户选到有效日
    }
  }

  // 农历月选项：1-12 + 该年闰月（若有）
  const lunarMonthOptions = useMemo(() => {
    const opts = Array.from({ length: 12 }, (_, i) => i + 1)
    if (lunar.y !== '') {
      const leap = LunarYear.fromYear(lunar.y)?.getLeapMonth()
      if (leap && leap > 0) opts.push(-leap)
    }
    opts.sort((a, b) => Math.abs(a) - Math.abs(b) || a - b)
    return opts
  }, [lunar.y])

  // 农历日选项：按所选月的实际天数（29/30）
  const lunarDayCount = useMemo(() => {
    if (lunar.y === '' || lunar.m === '') return 30
    try {
      return LunarMonth.fromYm(lunar.y, lunar.m)?.getDayCount() ?? 30
    } catch {
      return 30
    }
  }, [lunar.y, lunar.m])

  const lunarDays = Array.from({ length: lunarDayCount }, (_, i) => i + 1)

  const lunarMonthFormat = (n: number) => (n < 0 ? `闰${-n}月` : `${n}月`)

  return (
    <div className="field-wrap">
      {label && <span className="field-label">{label}</span>}
      {/* 公历/农历切换 */}
      <div className="segmented mb-2 mt-1">
        <button
          type="button"
          onClick={switchToSolar}
          className={`segmented-item ${calendarType === 'solar' ? 'active' : ''}`}
        >
          公历
        </button>
        <button
          type="button"
          onClick={switchToLunar}
          className={`segmented-item ${calendarType === 'lunar' ? 'active' : ''}`}
        >
          农历
        </button>
      </div>
      {calendarType === 'solar' ? (
        <div className="grid grid-cols-5 gap-2">
          <NumSelect value={year} onChange={onYearChange} options={years} placeholder="年" />
          <NumSelect value={month} onChange={onMonthChange} options={months} placeholder="月" />
          <NumSelect value={day} onChange={onDayChange} options={days} placeholder="日" />
          <NumSelect value={hour} onChange={onHourChange} options={hours} placeholder="时" />
          <NumSelect value={minute} onChange={onMinuteChange} options={minutes} placeholder="分" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-2">
            <NumSelect value={lunar.y} onChange={(v) => updateLunar({ y: v })} options={years} placeholder="年" />
            <NumSelect value={lunar.m} onChange={(v) => updateLunar({ m: v })} options={lunarMonthOptions} placeholder="月" format={lunarMonthFormat} />
            <NumSelect value={lunar.d} onChange={(v) => updateLunar({ d: v })} options={lunarDays} placeholder="日" />
            <NumSelect value={hour} onChange={onHourChange} options={hours} placeholder="时" />
            <NumSelect value={minute} onChange={onMinuteChange} options={minutes} placeholder="分" />
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
            {lunar.y !== '' && lunar.m !== '' && lunar.d !== '' && year !== '' && month !== '' && day !== ''
              ? `对应公历 ${year}年${month}月${day}日`
              : '农历选择后自动换算公历排盘'}
          </div>
        </>
      )}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
