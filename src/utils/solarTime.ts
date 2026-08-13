/**
 * 真太阳时修正
 * 基于出生地经度 + 均时差（equation of time）计算真太阳时偏移
 * 北京标准时间 = GMT+8 (东经120°)
 */

const BEIJING_LONGITUDE = 120

/** 均时差（分钟）：真太阳时与平太阳时的差值，全年在 -14~+16 分钟之间波动。
 *  采用经典近似公式（Spencer/标准太阳历法近似，精度约 ±30 秒） */
export function getEquationOfTime(year: number, month: number, day: number): number {
  // 一年中的第几天（闰年处理）
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysBefore = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const dayOfYear = daysBefore[month - 1]! + day + (leap && month > 2 ? 1 : 0)

  // 太阳平黄经近似：B = 2π(N-81)/364
  const B = (2 * Math.PI * (dayOfYear - 81)) / 364
  // EoT = 9.87·sin(2B) − 7.53·cos(B) − 1.5·sin(B) （分钟）
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

/** 根据经度计算经度差偏移（分钟） */
export function getSolarTimeOffset(longitude: number): number {
  const degreeDiff = longitude - BEIJING_LONGITUDE
  return degreeDiff * 4 // 每度经度差4分钟
}

/** 将北京时间转换为真太阳时（经度修正 + 均时差修正） */
export function toTrueSolarTime(
  beijingHour: number,
  beijingMinute: number,
  longitude: number,
  year?: number,
  month?: number,
  day?: number,
): { hour: number; minute: number } {
  const offsetMinutes = getSolarTimeOffset(longitude)
  // 均时差修正（缺省日期时按 0 处理，保持向后兼容）
  const eot = year && month && day ? getEquationOfTime(year, month, day) : 0
  const totalMinutes = beijingHour * 60 + beijingMinute + offsetMinutes + eot
  const normalizedMinutes = Math.round(((totalMinutes % 1440) + 1440) % 1440)
  return {
    hour: Math.floor(normalizedMinutes / 60),
    minute: normalizedMinutes % 60,
  }
}

/** 获取真太阳时时辰（地支） */
export function getTrueSolarHourBranch(
  beijingHour: number,
  beijingMinute: number,
  longitude: number,
  year?: number,
  month?: number,
  day?: number,
): { branch: number; actualHour: number; actualMinute: number } {
  const { hour, minute } = toTrueSolarTime(beijingHour, beijingMinute, longitude, year, month, day)
  // 时辰地支：子时=23~1, 丑时=1~3, ..., 亥时=21~23
  // branchIndex: 0=子, 1=丑, ..., 11=亥
  const branchIndex = Math.floor(((hour + 1) % 24) / 2)
  return { branch: branchIndex, actualHour: hour, actualMinute: minute }
}

/** 中国主要城市经度表 */
export const CITY_LONGITUDES: Record<string, number> = {
  '北京': 116.4, '上海': 121.5, '广州': 113.3, '深圳': 114.1,
  '杭州': 120.2, '南京': 118.8, '成都': 104.1, '重庆': 106.5,
  '武汉': 114.3, '西安': 108.9, '郑州': 113.7, '济南': 117.0,
  '青岛': 120.4, '大连': 121.6, '沈阳': 123.4, '哈尔滨': 126.6,
  '长春': 125.3, '天津': 117.2, '长沙': 113.0, '福州': 119.3,
  '厦门': 118.1, '昆明': 102.7, '贵阳': 106.7, '南宁': 108.3,
  '海口': 110.3, '兰州': 103.7, '西宁': 101.7, '银川': 106.3,
  '乌鲁木齐': 87.6, '拉萨': 91.1, '呼和浩特': 111.7, '太原': 112.5,
  '石家庄': 114.5, '合肥': 117.3, '南昌': 115.9, '香港': 114.2,
  '澳门': 113.5, '台北': 121.5,
}
