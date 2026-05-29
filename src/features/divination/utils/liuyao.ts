import type { LiuyaoResult, YaoLine, LiuyaoNaja } from '../types'
import { getHexagramFromLines, getHexagramBySymbol } from './hexagrams'
import { getTrigramByNumber } from './trigrams'
import { getLunarMonth } from './meihua'
import { getSizhu, getJieQiInterval } from '../../../utils/ganzhi'

/**
 * 六爻起卦逻辑
 * 来源：《增删卜易》「002、占卦法」
 *
 * 三钱法规则：
 *   背=阳=1，字=阴=0
 *   0+0+0=0 → 老阴（×），动爻
 *   0+1+0=1 → 少阴（- -）
 *   1+1+0=2 → 少阳（—）
 *   1+1+1=3 → 老阳（○），动爻
 */

function flipCoin(): number {
  return Math.random() < 0.5 ? 0 : 1
}

/** 单次摇卦（三枚铜钱），返回一爻 */
function shakeOnce(): { value: 0 | 1; changing: boolean; label: string } {
  const a = flipCoin()
  const b = flipCoin()
  const c = flipCoin()
  const sum = a + b + c

  if (sum === 0) return { value: 0, changing: true, label: '老阴 ×' }
  if (sum === 1) return { value: 0, changing: false, label: '少阴' }
  if (sum === 2) return { value: 1, changing: false, label: '少阳' }
  return { value: 1, changing: true, label: '老阳 ○' }
}

/** 摇卦起卦：逐次摇6爻 */
export function coinShake(): { lines: YaoLine[] } {
  const lines: YaoLine[] = []
  for (let i = 0; i < 6; i++) {
    const yao = shakeOnce()
    lines.push({
      index: i + 1,
      value: yao.value,
      changing: yao.changing,
      label: yao.label,
    })
  }
  return { lines }
}

/** 数字起卦：3数字 → 上卦/下卦/动爻 */
export function numberCast(num1: number, num2: number, num3: number): LiuyaoResult {
  const upperNum = num1 % 8
  const lowerNum = num2 % 8
  const changingYao = num3 % 6 === 0 ? 6 : num3 % 6

  const upperTrigram = getTrigramByNumber(upperNum)
  const lowerTrigram = getTrigramByNumber(lowerNum)

  return buildLiuyaoResult(upperTrigram.yangYao, lowerTrigram.yangYao, [changingYao], 'number', [num1, num2, num3])
}

/** 随机起卦：完全随机 */
export function randomCast(): LiuyaoResult {
  const lines: number[] = []
  const changing: number[] = []
  for (let i = 0; i < 6; i++) {
    lines.push(Math.random() < 0.5 ? 0 : 1)
  }
  // 随机0-2个变爻
  const changeCount = Math.floor(Math.random() * 3)
  const positions = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5)
  for (let i = 0; i < changeCount; i++) {
    changing.push(positions[i])
  }
  changing.sort((a, b) => a - b)

  const upper = lines.slice(3, 6) // bits 3-5 in trigram format
  const lower = lines.slice(0, 3) // bits 0-2

  return buildLiuyaoResult(upper, lower, changing, 'random')
}

/** 从上下卦阳爻位置和变爻位置构建六爻结果 */
function buildLiuyaoResult(
  upperYangYao: number[],
  lowerYangYao: number[],
  changingPositions: number[],
  method: 'number' | 'random' | 'coin',
  numbers?: number[],
): LiuyaoResult {
  // 构建6爻 (index 0-5 = 初爻至上爻)
  const lines: YaoLine[] = []
  for (let i = 0; i < 6; i++) {
    const pos = i + 1
    const trigramYangYao = i < 3 ? lowerYangYao : upperYangYao
    const yaoPos = i < 3 ? i + 1 : i - 3 + 1
    const isYang = trigramYangYao.includes(yaoPos)
    const changing = changingPositions.includes(pos)

    lines.push({
      index: pos,
      value: isYang ? 1 : 0,
      changing,
      label: changing ? (isYang ? '老阳 ○' : '老阴 ×') : (isYang ? '少阳' : '少阴'),
    })
  }

  const lineValues = lines.map(l => l.value)
  const original = getHexagramFromLines(lineValues)
  if (!original) throw new Error('无法识别的卦象')

  // 计算变卦
  let changedHexagram = null
  let changedName: string | null = null
  if (changingPositions.length > 0) {
    const changedValues = lineValues.map((v, i) =>
      changingPositions.includes(i + 1) ? (v === 0 ? 1 : 0) : v
    )
    const changed = getHexagramFromLines(changedValues)
    if (changed && changed.name !== original.name) {
      changedHexagram = changed
      changedName = changed.name
    }
  }

  const result: LiuyaoResult = {
    lines,
    originalHexagram: original,
    originalName: original.name,
    changingPositions,
    changedHexagram,
    changedName,
    method,
    numbers,
    timestamp: Date.now(),
  }
  // Y6-1: 附加纳甲数据
  result.naja = performNaja(result)
  return result
}

/**
 * 把完整的六爻摇卦结果转换为 LiuyaoResult
 * 用于从 CoinShaker 逐爻摇出后构建
 */
// ══════════════════════════════════════════════════
// Y6-1: 纳甲系统 — 装干支、五行、六亲、世应
// ══════════════════════════════════════════════════

/** 八宫六十四卦世应定位表（按八宫顺序，每宫8卦） */
const SHI_YING_TABLE: Record<string, number> = {
  // 八纯卦 → 世在上爻(6)
  '乾为天':6,'坎为水':6,'艮为山':6,'震为雷':6,'巽为风':6,'离为火':6,'坤为地':6,'兑为泽':6,
  // 一世卦 → 世在初爻(1) — 八纯卦初爻变
  '天风姤':1,'水泽节':1,'山火贲':1,'雷地豫':1,'风天小畜':1,'火山旅':1,'地雷复':1,'泽水困':1,
  // 二世卦 → 世在二爻(2)
  '天山遁':2,'水雷屯':2,'山天大畜':2,'雷水解':2,'风火家人':2,'火风鼎':2,'地泽临':2,'泽地萃':2,
  // 三世卦 → 世在三爻(3)
  '天地否':3,'水火既济':3,'山泽损':3,'雷风恒':3,'风雷益':3,'火水未济':3,'地天泰':3,'泽山咸':3,
  // 四世卦 → 世在四爻(4)
  '风地观':4,'泽火革':4,'火泽睽':4,'地风升':4,'天雷无妄':4,'山水蒙':4,'雷天大壮':4,'水山蹇':4,
  // 五世卦 → 世在五爻(5)
  '山地剥':5,'雷火丰':5,'天泽履':5,'水风井':5,'火雷噬嗑':5,'风水涣':5,'泽天夬':5,'地山谦':5,
  // 游魂卦 → 世在四爻(4)
  '火地晋':4,'地火明夷':4,'风泽中孚':4,'泽风大过':4,'山雷颐':4,'天水讼':4,'水天需':4,'雷山小过':4,
  // 归魂卦 → 世在三爻(3)
  '火天大有':3,'地水师':3,'风山渐':3,'泽雷随':3,'山风蛊':3,'天火同人':3,'水地比':3,'雷泽归妹':3,
}

/** 世应推算：世爻隔两位为应爻 */
function getYingYao(shiYao: number): number {
  const ying = shiYao + 3
  return ying > 6 ? ying - 6 : ying
}

/** 纳甲歌诀 — 每宫初爻天干 + 外卦天干 */
const NAJIA_GAN: Record<string, { inner: string, outer: string }> = {
  '乾': { inner: '甲', outer: '壬' },
  '坎': { inner: '戊', outer: '戊' },
  '艮': { inner: '丙', outer: '丙' },
  '震': { inner: '庚', outer: '庚' },
  '巽': { inner: '辛', outer: '辛' },
  '离': { inner: '己', outer: '己' },
  '坤': { inner: '乙', outer: '癸' },
  '兑': { inner: '丁', outer: '丁' },
}

/** 纳甲地支 — 按八纯卦初爻地支，隔位顺排（阳卦顺行，阴卦逆行） */
const NAJIA_ZHI: Record<string, string[]> = {
  '乾': ['子','寅','辰','午','申','戌'],  // 阳卦顺行：子→寅→辰→午→申→戌
  '坎': ['寅','辰','午','申','戌','子'],
  '艮': ['辰','午','申','戌','子','寅'],
  '震': ['子','寅','辰','午','申','戌'],  // 与乾同
  '巽': ['丑','亥','酉','未','巳','卯'],  // 阴卦逆行：丑→亥→酉→未→巳→卯
  '离': ['卯','丑','亥','酉','未','巳'],
  '坤': ['未','巳','卯','丑','亥','酉'],
  '兑': ['巳','卯','丑','亥','酉','未'],
}

/** 地支五行表 */
const ZHI_WUXING: Record<string, string> = {
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
  '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水',
}

/** 六亲判断（以宫五行为"我"） */
function getLiuqin(yaoWuxing: string, palaceWuxing: string): string {
  if (yaoWuxing === palaceWuxing) return '兄弟'
  const sheng: Record<string,string> = {'木':'火','火':'土','土':'金','金':'水','水':'木'}
  const ke: Record<string,string> = {'木':'土','土':'水','水':'火','火':'金','金':'木'}
  if (sheng[palaceWuxing] === yaoWuxing) return '子孙'   // 我生
  if (sheng[yaoWuxing] === palaceWuxing) return '父母'    // 生我
  if (ke[palaceWuxing] === yaoWuxing) return '妻财'      // 我克
  if (ke[yaoWuxing] === palaceWuxing) return '官鬼'      // 克我
  return '兄弟'
}

/** 日干支计算
 *  基准：2000/1/1=甲子(索引0)
 *  2026/1/1 偏移 = 365*26 + 7闰年 = 9497天 → 9497%60=17
 *  故 2026/1/1 干支索引 = 17（辛巳日）... 不对，经 5/16=庚寅 反推：
 *  5/16 偏移 = 135天, 庚寅=索引26, ∴ base = (26-135+360)%60 = 11
 *  即 2026/1/1 干支索引 = 11（乙亥日） */
function getDayGanzhi(date: Date): { gan: string, zhi: string, wuxing: string } {
  const base = new Date(2026, 0, 1) // 2026-01-01
  const days = Math.floor((date.getTime() - base.getTime()) / 86400000)
  const ganzhiIndex = ((11 + days) % 60 + 60) % 60
  const ganArr = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
  const zhiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
  const zhi = zhiArr[ganzhiIndex % 12]
  return { gan: ganArr[ganzhiIndex % 10], zhi, wuxing: ZHI_WUXING[zhi] || '土' }
}

/** 六冲卦检查 */
function isLiuChongGua(name: string): boolean {
  return ['乾为天','坤为地','坎为水','离为火','震为雷','艮为山','巽为风','兑为泽'].includes(name)
}

/** 六合卦列表（《增删卜易》六合章） */
const LIU_HE_GUA = ['天地否','水山蹇','泽地萃','地火明夷','雷水解','山泽损','水地比','火山旅']
function isLiuHeGua(name: string): boolean { return LIU_HE_GUA.includes(name) }

/** 策数 = 阳爻×36 + 阴爻×24 */
function getCeShu(lines: number[]): number {
  const yang = lines.filter(v => v === 1).length
  return yang * 36 + (6 - yang) * 24
}
/** 轨数 = 阳爻×4 + 阴爻×2 */
function getGuiShu(lines: number[]): number {
  const yang = lines.filter(v => v === 1).length
  return yang * 4 + (6 - yang) * 2
}

/** 持世模板 */
const CHI_SHI: Record<string, Record<string, string>> = {
  '父母': { '*':'父母持世，辛苦操劳，利文书、长辈之事，不利求财。','考试':'利学业文书','功名':'文书得力' },
  '官鬼': { '*':'官鬼持世，压力大，利功名仕途，不利自身。','功名':'仕途亨通','疾病':'病患缠身' },
  '兄弟': { '*':'兄弟持世，破耗之象，求财不利，易有竞争分财。' },
  '妻财': { '*':'妻财持世，利求财、婚姻；不利文书长辈。','财运':'财运亨通','婚姻':'婚姻可成' },
  '子孙': { '*':'子孙持世，福神临身，诸事无忧，惟不利功名。','解忧':'解忧制鬼','考试':'不利考试' },
}

/**
 * 完整纳甲装卦
 * 输入：LiuyaoResult（已有一卦六爻）
 * 输出：LiuyaoNaja（完整纳甲数据）
 */
export function performNaja(result: LiuyaoResult): LiuyaoNaja {
  const hexagram = result.originalHexagram
  const palace = hexagram.palace  // e.g., '震'
  const isChunGua = ['乾为天','坤为地','坎为水','离为火','震为雷','艮为山','巽为风','兑为泽'].includes(hexagram.name)

  // 世爻
  const shiYao = SHI_YING_TABLE[hexagram.name] || 6
  const yingYao = getYingYao(shiYao)
  const isStatic = result.changingPositions.length === 0

  // 纳甲天干地支
  const ganInfo = NAJIA_GAN[palace] || NAJIA_GAN['乾']
  const zhiArr = NAJIA_ZHI[palace] || NAJIA_ZHI['乾']

  // 装各爻干支
  const lines = result.lines.map((line, i) => {
    const pos = i + 1 // 1-6
    const isOuter = pos >= 4 // 4-6爻为外卦
    const gan = isOuter ? ganInfo.outer : ganInfo.inner
    const zhi = zhiArr[pos - 1]
    const wuxing = ZHI_WUXING[zhi] || '土'
    const liuqin = getLiuqin(wuxing, hexagram.palaceElement)
    const shiying = pos === shiYao ? '世' as const : pos === yingYao ? '应' as const : null

    return { ...line, gan, zhi, wuxing, liuqin, shiying }
  })

  // 月建日辰 + 完整四柱
  const now = new Date()
  const lunar = getLunarMonth(now)
  const dayGz = getDayGanzhi(now)
  const sizhu = getSizhu(now.getFullYear(), now.getMonth()+1, now.getDate(), now.getHours())
  const jieqi = getJieQiInterval(now.getFullYear(), now.getMonth()+1, now.getDate())

  // 持世 + 策轨
  const shiLine = lines.find(l => l.shiying === '世')
  // 降级：世爻未找到时，取应爻或第一爻
  const fallbackLine = shiLine || lines.find(l => l.shiying === '应') || lines[0]
  const chiShiLiqin = fallbackLine?.liuqin || '父母'
  const chiShiText = CHI_SHI[chiShiLiqin]?.['*'] || `${chiShiLiqin}持世`
  const lineValues = result.lines.map(l => l.value)
  const ceShu = getCeShu(lineValues)
  const guiShu = getGuiShu(lineValues)

  return {
    lines, palaceName: palace, palaceElement: hexagram.palaceElement,
    isLiuChong: isLiuChongGua(hexagram.name),
    isLiuHe: isLiuHeGua(hexagram.name),
    isStatic, isChunGua,
    monthZhi: lunar.zhi, monthWuxing: lunar.wuxing,
    dayZhi: dayGz.zhi, dayWuxing: dayGz.wuxing,
    castTime: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    sizhu, jieqi, chiShiLiqin, chiShiText, ceShu, guiShu,
  }
}

export function buildCoinResult(lines: YaoLine[]): LiuyaoResult {
  const lineValues = lines.map(l => l.value)
  const changingPositions = lines.filter(l => l.changing).map(l => l.index)
  const original = getHexagramFromLines(lineValues)
  if (!original) throw new Error('无法识别的卦象')

  let changedHexagram = null
  let changedName: string | null = null
  if (changingPositions.length > 0) {
    const changedValues = lineValues.map((v, i) =>
      changingPositions.includes(i + 1) ? (v === 0 ? 1 : 0) : v
    )
    const changed = getHexagramFromLines(changedValues)
    if (changed && changed.name !== original.name) {
      changedHexagram = changed
      changedName = changed.name
    }
  }

  const result: LiuyaoResult = {
    lines,
    originalHexagram: original,
    originalName: original.name,
    changingPositions,
    changedHexagram,
    changedName,
    method: 'coin',
    timestamp: Date.now(),
  }
  result.naja = performNaja(result)
  return result
}
