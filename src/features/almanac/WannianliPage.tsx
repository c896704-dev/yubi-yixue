import { useMemo, useState } from 'react'
import { Solar } from 'lunar-typescript'
import { Card } from '../../components/ui/Card'

/**
 * 万年历组件
 * 基于 lunar-typescript:公历/农历/干支/生肖/节气/宜忌
 * 支持年份切换、月份切换、日期选择
 */

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function getLunarInfo(solar: Solar) {
  const lunar = solar.getLunar()
  return {
    lunarDate: lunar.toString(), // 二〇二六年六月廿七
    shengXiao: lunar.getYearShengXiao(),
    yearGanZhi: lunar.getYearInGanZhi(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi(),
    jieQi: lunar.getJieQi(), // 当前节气(可能为空)
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
    dayGan: lunar.getDayGan(),
    dayZhi: lunar.getDayZhi(),
    weekIndex: solar.getWeek(), // 0=周日
  }
}

function isToday(y: number, m: number, d: number): boolean {
  const now = new Date()
  return now.getFullYear() === y && now.getMonth() + 1 === m && now.getDate() === d
}

export function WannianliPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selected, setSelected] = useState<{ y: number; m: number; d: number } | null>(null)

  // 当月第一天是周几、共几天
  const firstDay = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month])
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month])

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

  // 年月切换
  const yearOptions = Array.from({ length: 121 }, (_, i) => today.getFullYear() - 60 + i)

  // 五行颜色映射(用于干支日主)
  const elementColor: Record<string, string> = {
    '木': 'var(--success)', '火': 'var(--danger)', '土': 'var(--warning)',
    '金': 'var(--accent)', '水': 'var(--primary)',
  }
  const STEM_ELEMENT: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 今日速览 */}
      <Card title="今日时令">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>公历</div>
            <div className="font-semibold mt-1" style={{ color: 'var(--fg)' }}>
              {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日 周{WEEKDAYS[today.getDay()]}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>农历</div>
            <div className="font-semibold mt-1" style={{ color: 'var(--fg)' }}>{detail.info.lunarDate}</div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>干支</div>
            <div className="font-semibold mt-1" style={{ color: 'var(--fg)' }}>
              {detail.info.yearGanZhi}年 {detail.info.monthGanZhi}月 {detail.info.dayGanZhi}日
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>生肖 · 节气</div>
            <div className="font-semibold mt-1" style={{ color: 'var(--fg)' }}>
              {detail.info.shengXiao}年{detail.info.jieQi ? ` · ${detail.info.jieQi}` : ''}
            </div>
          </div>
        </div>
      </Card>

      {/* 日历主体 */}
      <Card title="万年历">
        {/* 年月切换 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            className="px-3 py-1.5 rounded-lg text-sm"
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
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
            onClick={() => changeMonth(1)}
          >下月 ›</button>
          <button
            className="px-3 py-1.5 rounded-lg text-sm ml-auto"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); setSelected(null) }}
          >回到今天</button>
        </div>

        {/* 星期表头 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className="text-center text-xs py-1 font-semibold"
              style={{ color: i === 0 || i === 6 ? 'var(--danger)' : 'var(--muted)' }}>
              {w}
            </div>
          ))}
        </div>

        {/* 日期格 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 月初空白 */}
          {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1
            const solar = Solar.fromYmd(year, month, d)
            const lunar = solar.getLunar()
            const lunarDay = lunar.getDayInChinese()
            const isSel = selected?.y === year && selected?.m === month && selected?.d === d
            const isTodayDate = isToday(year, month, d)
            const weekIdx = solar.getWeek()
            const isWeekend = weekIdx === 0 || weekIdx === 6
            const jieQi = lunar.getJieQi()

            return (
              <button
                key={d}
                onClick={() => setSelected({ y: year, m: month, d })}
                className="rounded-lg p-1.5 text-center transition-colors cursor-pointer hover:bg-[var(--bg)]"
                style={{
                  backgroundColor: isSel ? 'var(--primary)' : isTodayDate ? 'var(--primary-light)' : undefined,
                  border: isTodayDate && !isSel ? '1px solid var(--primary)' : undefined,
                  color: isSel ? 'white' : isWeekend ? 'var(--danger)' : 'var(--fg)',
                }}
              >
                <div className="text-sm font-semibold">{d}</div>
                <div className="text-[10px] truncate" style={{ opacity: 0.75 }}>
                  {jieQi || (lunarDay === '初一' ? lunar.getMonthInChinese() + '月' : lunarDay)}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 选中日期详情 */}
      <Card title={`${detail.y}年${detail.m}月${detail.d}日 详解`}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>农历</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{detail.info.lunarDate}</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>年柱</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{detail.info.yearGanZhi}（{detail.info.shengXiao}年）</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>月柱</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{detail.info.monthGanZhi}</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>日柱</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>
                {detail.info.dayGanZhi}
                <span className="ml-2 text-xs" style={{ color: elementColor[STEM_ELEMENT[detail.info.dayGan]] }}>
                  {STEM_ELEMENT[detail.info.dayGan]}日主
                </span>
              </span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--muted)' }}>节气</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{detail.info.jieQi || '无'}</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--positive-bg)' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--success)' }}>宜</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.info.yi.length > 0
                  ? detail.info.yi.map((y: string) => (
                    <span key={y} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--fg)' }}>{y}</span>
                  ))
                  : <span className="text-xs" style={{ color: 'var(--muted)' }}>诸事不宜</span>}
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--negative-bg)' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--danger)' }}>忌</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.info.ji.length > 0
                  ? detail.info.ji.map((j: string) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--fg)' }}>{j}</span>
                  ))
                  : <span className="text-xs" style={{ color: 'var(--muted)' }}>诸事皆宜</span>}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default WannianliPage
