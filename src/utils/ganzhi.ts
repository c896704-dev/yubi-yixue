/**
 * 完整四柱计算（年·月·日·时）
 * 基于 lunar-typescript（与八字排盘引擎同源），节气、立春、晚子时均精确。
 * 修复历史问题：
 * - 年柱：旧实现基准年错误（2000≠甲子，甲子基准为1984），全年柱错位
 * - 月柱：旧实现五虎遁表整体错位2位 + 节气近似表（±1天误差）
 * - 日柱：旧实现用 Date 差天数，1986-1991 夏令时期间差1天
 * - 时柱：旧实现 23:00-23:59 与 lunar 库"晚子时换日"约定不一致
 */
import { Solar } from 'lunar-typescript'

export interface Sizhu {
  year:  { gan: string; zhi: string; full: string }
  month: { gan: string; zhi: string; full: string }
  day:   { gan: string; zhi: string; full: string }
  hour:  { gan: string; zhi: string; full: string }
}

/** 获取完整四柱（lunar-typescript 精确排盘） */
export function getSizhu(y: number, mo: number, d: number, h: number): Sizhu {
  const solar = Solar.fromYmdHms(y, mo, d, h, 0, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  const year = ec.getYear()
  const month = ec.getMonth()
  const day = ec.getDay()
  const hour = ec.getTime()

  return {
    year:  { gan: year.charAt(0), zhi: year.charAt(1), full: year },
    month: { gan: month.charAt(0), zhi: month.charAt(1), full: month },
    day:   { gan: day.charAt(0), zhi: day.charAt(1), full: day },
    hour:  { gan: hour.charAt(0), zhi: hour.charAt(1), full: hour },
  }
}

/** 节气月支 → 该月起始节气名（用于区间文案） */
const TERM_BY_ZHI: Record<string, string> = {
  '寅': '立春', '卯': '惊蛰', '辰': '清明', '巳': '立夏', '午': '芒种', '未': '小暑',
  '申': '立秋', '酉': '白露', '戌': '寒露', '亥': '立冬', '子': '大雪', '丑': '小寒',
}

/** 获取当前节气区间名称（如"立秋→申月"），基于 lunar-typescript 精确节气 */
export function getJieQiInterval(y: number, mo: number, d: number): string {
  const lunar = Solar.fromYmd(y, mo, d).getLunar()
  const monthGz = lunar.getMonthInGanZhi() // 节气月干支（以节为界）
  const zhi = monthGz.charAt(1)
  return `${TERM_BY_ZHI[zhi] ?? ''}→${zhi}月`
}
