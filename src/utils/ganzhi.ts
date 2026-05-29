/**
 * 完整四柱计算（年·月·日·时）
 * 年柱：立春分界 + 五虎遁
 * 月柱：节气定月支 + 年干定月干
 * 日柱：复用 getDayGanzhi
 * 时柱：五鼠遁（日干定子时天干）
 */
import { getLunarMonth } from '../features/divination/utils/meihua'

export interface Sizhu {
  year:  { gan: string; zhi: string; full: string }
  month: { gan: string; zhi: string; full: string }
  day:   { gan: string; zhi: string; full: string }
  hour:  { gan: string; zhi: string; full: string }
}

const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

/** 年柱：2000年是庚辰年 */
function yearGanzhi(y: number): { gan: string; zhi: string } {
  const idx = ((y - 2000) % 60 + 60) % 60
  return { gan: GAN[idx % 10], zhi: ZHI[idx % 12] }
}

/** 月柱：立春起寅月 */
function monthGanzhi(yearGan: string, m: number, d: number): { gan: string; zhi: string } {
  const solarTerms = [
    { m:2,d:4 },{ m:3,d:6 },{ m:4,d:5 },{ m:5,d:5 },{ m:6,d:5 },
    { m:7,d:7 },{ m:8,d:7 },{ m:9,d:7 },{ m:10,d:8 },{ m:11,d:7 },
    { m:12,d:7 },{ m:1,d:6 }
  ]
  let zhiIdx = 1 // 寅=1
  for (let i = solarTerms.length - 1; i >= 0; i--) {
    const st = solarTerms[i]
    if (m > st.m || (m === st.m && d >= st.d)) {
      zhiIdx = (i + 1) % 12; break
    }
  }
  // 五虎遁—年干→正月月干映射
  const huMap: Record<string,number> = {'甲':2,'己':2,'乙':4,'庚':4,'丙':6,'辛':6,'丁':8,'壬':8,'戊':0,'癸':0}
  const ganIdx = (huMap[yearGan] + zhiIdx) % 10
  return { gan: GAN[ganIdx], zhi: ZHI[zhiIdx] }
}

/** 五鼠遁 — 日干→子时天干 → 时辰天干 */
function hourGanzhi(dayGan: string, h: number): { gan: string; zhi: string } {
  const zhiIdx = h === 23 || h === 0 ? 0 : Math.floor((h + 1) / 2) % 12
  const shuMap: Record<string,number> = {'甲':0,'己':0,'乙':2,'庚':2,'丙':4,'辛':4,'丁':6,'壬':6,'戊':8,'癸':8}
  const ganIdx = (shuMap[dayGan] + zhiIdx) % 10
  return { gan: GAN[ganIdx], zhi: ZHI[zhiIdx] }
}

/** 获取完整四柱 */
export function getSizhu(y: number, mo: number, d: number, h: number): Sizhu {
  const yr = yearGanzhi(y)
  const mon = monthGanzhi(yr.gan, mo, d)
  const day = getDayGanzhiSimple(y, mo, d)
  const hr = hourGanzhi(day.gan, h)
  return {
    year: { ...yr, full: yr.gan+yr.zhi },
    month: { ...mon, full: mon.gan+mon.zhi },
    day: { ...day, full: day.gan+day.zhi },
    hour: { ...hr, full: hr.gan+hr.zhi },
  }
}

/** 日柱简化版 — 从 getDayGanzhi in liuyao.ts 独立出来 */
function getDayGanzhiSimple(y: number, mo: number, d: number): { gan: string; zhi: string } {
  const base = new Date(2026, 0, 1)
  const target = new Date(y, mo - 1, d)
  const days = Math.floor((target.getTime() - base.getTime()) / 86400000)
  const idx = ((11 + days) % 60 + 60) % 60
  return { gan: GAN[idx % 10], zhi: ZHI[idx % 12] }
}

/** 获取当前节气区间名称 */
export function getJieQiInterval(y: number, mo: number, d: number): string {
  const terms = [
    { m:1,d:5,name:'小寒→丑月' },{ m:2,d:4,name:'立春→寅月' },{ m:3,d:6,name:'惊蛰→卯月' },
    { m:4,d:5,name:'清明→辰月' },{ m:5,d:5,name:'立夏→巳月' },{ m:6,d:5,name:'芒种→午月' },
    { m:7,d:7,name:'小暑→未月' },{ m:8,d:7,name:'立秋→申月' },{ m:9,d:7,name:'白露→酉月' },
    { m:10,d:8,name:'寒露→戌月' },{ m:11,d:7,name:'立冬→亥月' },{ m:12,d:7,name:'大雪→子月' },
  ]
  for (let i = terms.length - 1; i >= 0; i--) {
    if (mo > terms[i].m || (mo === terms[i].m && d >= terms[i].d)) return terms[i].name
  }
  return '小寒→丑月'
}
