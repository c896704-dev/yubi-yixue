import { useMemo, useState } from 'react'
import { Solar } from 'lunar-typescript'
import { Card } from '../../components/ui/Card'

/**
 * 万年历组件
 * 基于 lunar-typescript:公历/农历/干支/生肖/节气/宜忌
 * 布局:顶部紧凑今日条 + 桌面两栏(日历|详情),移动端堆叠
 */

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function getLunarInfo(solar: Solar) {
  const lunar = solar.getLunar()
  return {
    lunarDate: lunar.toString(),
    shengXiao: lunar.getYearShengXiao(),
    yearGanZhi: lunar.getYearInGanZhi(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi(),
    jieQi: lunar.getJieQi(),
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
    dayGan: lunar.getDayGan(),
    weekIndex: solar.getWeek(),
  }
}

function isTodayDate(y: number, m: number, d: number): boolean {
  const now = new Date()
  return now.getFullYear() === y && now.getMonth() + 1 === m && now.getDate() === d
}

const STEM_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

const ELEMENT_COLOR: Record<string, string> = {
  '木': 'var(--success)', '火': 'var(--danger)', '土': 'var(--warning)',
  '金': 'var(--accent)', '水': 'var(--primary)',
}

export function WannianliPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selected, setSelected] = useState<{ y: number; m: number; d: number } | null>(null)

  // 当月第一天是周几、共几天
  const firstDay = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month])
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month])

  // 今日详情
  const todayInfo = useMemo(() => getLunarInfo(Solar.fromYmd(today.getFullYear(), today.getMonth() + 1, today.getDate())), [])

  // 选中的日期详情(默认今天)
  const detail = useMemo(() => {
    const d = selected || { y: year, m: month, d: Math.min(today.getDate(), daysInMonth) }
    return { ...d, info: getLunarInfo(Solar.fromYmd(d.y, d.m, d.d)) }
  }, [selected, year, month, daysInMonth])

  const changeMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m); setYear(y); setSelected(null)
  }

  const yearOptions = Array.from({ length: 121 }, (_, i) => today.getFullYear() - 60 + i)

  return (
    <div className="flex flex-col gap-4">
      {/* 紧凑今日条 */}
      <div className="rounded-xl p-3 sm:p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className="font-[family-name:var(--font-title)] font-bold text-base" style={{ color: 'var(--fg)' }}>
          今日 · {today.getFullYear()}-{String(today.getMonth() + 1).padStart(2, '0')}-{String(today.getDate()).padStart(2, '0')}
          <span className="ml-1 text-sm font-normal" style={{ color: 'var(--muted)' }}>周{WEEKDAYS[today.getDay()]}</span>
        </span>
        <span style={{ color: 'var(--muted)' }}>
          农历 <b style={{ color: 'var(--fg)' }}>{todayInfo.lunarDate}</b>
        </span>
        <span style={{ color: 'var(--muted)' }}>
          干支 <b style={{ color: 'var(--fg)' }}>{todayInfo.yearGanZhi}年 {todayInfo.monthGanZhi}月 {todayInfo.dayGanZhi}日</b>
        </span>
        <span style={{ color: 'var(--muted)' }}>
          生肖 <b style={{ color: 'var(--fg)' }}>{todayInfo.shengXiao}</b>
          {todayInfo.jieQi && <> · 节气 <b style={{ color: 'var(--fg)' }}>{todayInfo.jieQi}</b></>}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>宜</span>
          <b className="text-xs font-normal" style={{ color: 'var(--success)' }}>
            {todayInfo.yi.length > 0 ? todayInfo.yi.slice(0, 4).join('、') : '诸事不宜'}
          </b>
          <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>忌</span>
          <b className="text-xs font-normal" style={{ color: 'var(--danger)' }}>
            {todayInfo.ji.length > 0 ? todayInfo.ji.slice(0, 4).join('、') : '诸事皆宜'}
          </b>
        </span>
      </div>

      {/* 桌面两栏：日历 + 详情 */}
      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-4 items-start">
        {/* 日历 */}
        <Card title="万年历">
          {/* 年月切换 */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
              onClick={() => changeMonth(-1)}
            >‹ 上月</button>
            <select
              className="select"
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setSelected(null) }}
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select
              className="select"
              value={month}
              onChange={(e) => { setMonth(Number(e.target.value)); setSelected(null) }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
            </select>
            <button
              className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
              onClick={() => changeMonth(1)}
            >下月 ›</button>
            <button
              className="px-3 py-1.5 rounded-lg text-sm ml-auto cursor-pointer"
              style={{ backgroundColor: 'var(--primary)', color: '#fbfaf5' }}
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); setSelected(null) }}
            >回到今天</button>
          </div>

          {/* 星期表头 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className="text-center text-xs py-1.5 font-semibold"
                style={{ color: i === 0 || i === 6 ? 'var(--danger)' : 'var(--muted)' }}>
                {w}
              </div>
            ))}
          </div>

          {/* 日期格 */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1
              const solar = Solar.fromYmd(year, month, d)
              const lunar = solar.getLunar()
              const lunarDay = lunar.getDayInChinese()
              const isSel = selected?.y === year && selected?.m === month && selected?.d === d
              const isToday = isTodayDate(year, month, d)
              const weekIdx = solar.getWeek()
              const isWeekend = weekIdx === 0 || weekIdx === 6
              const jieQi = lunar.getJieQi()

              return (
                <button
                  key={d}
                  onClick={() => setSelected({ y: year, m: month, d })}
                  className="rounded-lg p-1 sm:p-1.5 text-center transition-colors cursor-pointer hover:bg-[var(--bg)] min-h-[44px] sm:min-h-[52px] flex flex-col items-center justify-center gap-0.5"
                  style={{
                    backgroundColor: isSel ? 'var(--primary)' : isToday ? 'var(--primary-light)' : undefined,
                    border: isToday && !isSel ? '1px solid var(--primary)' : '1px solid transparent',
                    color: isSel ? '#fbfaf5' : isWeekend ? 'var(--danger)' : 'var(--fg)',
                  }}
                >
                  <span className="text-sm sm:text-base font-semibold leading-none">{d}</span>
                  <span
                    className="text-[10px] sm:text-[11px] truncate w-full"
                    style={{
                      color: isSel ? 'rgba(251,250,245,0.85)' : jieQi ? 'var(--hu-po-jin, #d4af37)' : 'var(--muted)',
                      fontWeight: jieQi ? 600 : 400,
                    }}
                  >
                    {jieQi || (lunarDay === '初一' ? lunar.getMonthInChinese() + '月' : lunarDay)}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-3 pt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
            <span>点击日期查看详情</span>
            <span style={{ color: 'var(--hu-po-jin, #d4af37)' }}>金色字 = 节气</span>
            <span>初一显示农历月名</span>
          </div>
        </Card>

        {/* 选中日期详情 */}
        <Card title={`${detail.y}年${detail.m}月${detail.d}日 详解`}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>公历</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>
                {detail.y}-{String(detail.m).padStart(2, '0')}-{String(detail.d).padStart(2, '0')} 周{WEEKDAYS[detail.info.weekIndex]}
              </span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>农历</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{detail.info.lunarDate}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>年柱</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{detail.info.yearGanZhi}（{detail.info.shengXiao}年）</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>月柱</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{detail.info.monthGanZhi}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>日柱</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>
                {detail.info.dayGanZhi}
                <span className="ml-2 text-xs" style={{ color: ELEMENT_COLOR[STEM_ELEMENT[detail.info.dayGan]] }}>
                  {STEM_ELEMENT[detail.info.dayGan]}日主
                </span>
              </span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>节气</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{detail.info.jieQi || '无'}</span>
            </div>

            {/* 宜忌 */}
            <div className="p-3 rounded-lg mt-2" style={{ backgroundColor: 'var(--positive-bg)' }}>
              <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--success)' }}>宜</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.info.yi.length > 0
                  ? detail.info.yi.map((y: string) => (
                    <span key={y} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--fg)' }}>{y}</span>
                  ))
                  : <span className="text-xs" style={{ color: 'var(--muted)' }}>诸事不宜</span>}
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--negative-bg)' }}>
              <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--danger)' }}>忌</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.info.ji.length > 0
                  ? detail.info.ji.map((j: string) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--fg)' }}>{j}</span>
                  ))
                  : <span className="text-xs" style={{ color: 'var(--muted)' }}>诸事皆宜</span>}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default WannianliPage
