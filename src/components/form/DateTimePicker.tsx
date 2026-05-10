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

function NumSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: number | ''
  onChange: (v: number | '') => void
  options: (number | '')[]
  placeholder: string
}) {
  return (
    <select
      className="select !px-2 !py-2.5"
      value={value}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? '' : Number(v))
      }}
    >
      <option value="">{placeholder}</option>
      {options.filter((o) => o !== '').map((n) => (
        <option key={String(n)} value={String(n)}>
          {String(n).padStart(2, '0')}
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
  const minutes = [0, 10, 20, 30, 40, 50]

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="input-label">{label}</span>}
      <div className="grid grid-cols-5 gap-2">
        <NumSelect value={year} onChange={onYearChange} options={years} placeholder="年" />
        <NumSelect value={month} onChange={onMonthChange} options={months} placeholder="月" />
        <NumSelect value={day} onChange={onDayChange} options={days} placeholder="日" />
        <NumSelect value={hour} onChange={onHourChange} options={hours} placeholder="时" />
        <NumSelect value={minute} onChange={onMinuteChange} options={minutes} placeholder="分" />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  )
}
