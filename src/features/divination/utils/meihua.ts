import type { MeihuaResult, TiYongRelation, Hexagram, Trigram } from '../types'
import { getTrigramByNumber, getTrigramByName } from './trigrams'
import { getHexagramByTrigrams } from './hexagrams'
import { getTotalStrokes } from './strokes'

/**
 * 梅花易数起卦逻辑
 * 来源：《梅花易数》卷一「象数易理篇」、卷二「体用生克篇」、卷三「断占总诀篇」
 *
 * 核心规则：
 * - 卦以八除：取数 mod 8 → 卦（1乾2兑3离4震5巽6坎7艮8坤，余0为8坤）
 * - 爻以六除：取数 mod 6 → 动爻（1-6，余0为6）
 * - 体卦：本卦中无动爻的那一卦
 * - 用卦：本卦中有动爻的那一卦
 * - 乾坤无互：纯乾或纯坤为互卦时，取其变卦的互卦
 */

// ────────────────── 起卦入口 ──────────────────

export function meihuaNumberCast(n1: number, n2: number, n3?: number): MeihuaResult {
  const upperNum = n1 % 8
  const lowerNum = n2 % 8
  const changeNum = n3 ?? Math.floor(Math.random() * 100)
  const changingYao = changeNum % 6 === 0 ? 6 : changeNum % 6
  return buildMeihuaResult(upperNum, lowerNum, changingYao, 'number', [n1, n2, changeNum])
}

export function meihuaTimeCast(year: number, month: number, day: number, hour: number): MeihuaResult {
  const upperNum = (year + month + day) % 8
  const lowerNum = (year + month + day + hour) % 8
  const changeNum = (year + month + day + hour) % 6
  const changingYao = changeNum === 0 ? 6 : changeNum
  return buildMeihuaResult(upperNum, lowerNum, changingYao, 'time', [year, month, day, hour])
}

export function meihuaCurrentTimeCast(): MeihuaResult {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const hour = now.getHours()

  const zhiHour = hour === 23 || hour === 0 ? 1
    : hour === 1 || hour === 2 ? 2
    : hour === 3 || hour === 4 ? 3
    : hour === 5 || hour === 6 ? 4
    : hour === 7 || hour === 8 ? 5
    : hour === 9 || hour === 10 ? 6
    : hour === 11 || hour === 12 ? 7
    : hour === 13 || hour === 14 ? 8
    : hour === 15 || hour === 16 ? 9
    : hour === 17 || hour === 18 ? 10
    : hour === 19 || hour === 20 ? 11
    : 12

  return meihuaTimeCast(year, month, day, zhiHour)
}

export function meihuaTextCast(text: string): MeihuaResult {
  const chars = [...text].filter(ch => /[一-鿿]/.test(ch))
  const len = chars.length

  let upperNum: number
  let lowerNum: number

  if (len === 1) {
    const s = getTotalStrokes(chars[0])
    upperNum = s % 8; lowerNum = s % 8
  } else if (len === 2) {
    upperNum = getTotalStrokes(chars[0]) % 8
    lowerNum = getTotalStrokes(chars[1]) % 8
  } else if (len === 3) {
    upperNum = getTotalStrokes(chars[0]) % 8
    lowerNum = (getTotalStrokes(chars[1]) + getTotalStrokes(chars[2])) % 8
  } else if (len >= 4) {
    const half = Math.ceil(len / 2)
    const firstHalf = chars.slice(0, half).join('')
    const secondHalf = chars.slice(half).join('')
    upperNum = getTotalStrokes(firstHalf) % 8
    lowerNum = getTotalStrokes(secondHalf) % 8
  } else {
    upperNum = Math.floor(Math.random() * 8)
    lowerNum = Math.floor(Math.random() * 8)
  }

  const totalStrokes = getTotalStrokes(text)
  const changeNum = totalStrokes % 6
  const changingYao = changeNum === 0 ? 6 : changeNum

  return buildMeihuaResult(upperNum, lowerNum, changingYao, 'text', undefined, text)
}

// ────────────────── 主构建函数 ──────────────────

function buildMeihuaResult(
  upperNum: number, lowerNum: number, changingYao: number,
  method: 'number' | 'time' | 'text',
  numbers?: number[], text?: string,
): MeihuaResult {
  const upperTrigram = getTrigramByNumber(upperNum)
  const lowerTrigram = getTrigramByNumber(lowerNum)

  const original = getHexagramByTrigrams(upperTrigram.name, lowerTrigram.name)
  if (!original) throw new Error(`无法识别的卦象: 上${upperTrigram.name}下${lowerTrigram.name}`)

  const yaoIdx = changingYao - 1
  const isUpperYao = yaoIdx >= 3

  const yongTrigram = isUpperYao ? upperTrigram : lowerTrigram
  const tiTrigram = isUpperYao ? lowerTrigram : upperTrigram

  // 变卦计算
  const trigramYangYao = isUpperYao ? [...upperTrigram.yangYao] : [...lowerTrigram.yangYao]
  const yaoInTrigram = isUpperYao ? yaoIdx - 3 + 1 : yaoIdx + 1

  let newTrigramNum: number
  if (trigramYangYao.includes(yaoInTrigram)) {
    const newYangYao = trigramYangYao.filter(y => y !== yaoInTrigram)
    newTrigramNum = yangYaoToNumber(newYangYao)
  } else {
    const newYangYao = [...trigramYangYao, yaoInTrigram].sort()
    newTrigramNum = yangYaoToNumber(newYangYao)
  }

  const newUpper = isUpperYao ? getTrigramByNumber(newTrigramNum) : upperTrigram
  const newLower = !isUpperYao ? getTrigramByNumber(newTrigramNum) : lowerTrigram
  const changed = getHexagramByTrigrams(newUpper.name, newLower.name)
  if (!changed) throw new Error('无法计算变卦')

  // F-2 修复：乾坤无互 — 纯乾或纯坤的互卦取其变卦的互卦
  const isQian = original.name === '乾为天'
  const isKun = original.name === '坤为地'
  const huFromChanged = isQian || isKun
  const huHexagram = huFromChanged ? computeHuGua(changed) : computeHuGua(original)

  // 体用生克
  const tiYong = computeTiYong(tiTrigram, yongTrigram)

  // F-6: 变卦体用分析
  const changedTiYong = computeChangedTiYong(changed, isUpperYao, tiTrigram)

  // F-11: 错卦/综卦
  const cuoHexagram = computeCuoGua(original)
  const zongHexagram = computeZongGua(original)

  // F-5: 卦气旺衰
  const seasonalStrength = computeSeasonalStrength(tiTrigram, yongTrigram)

  // F-4: 应期推算
  const yingQi = computeYingQi(tiTrigram, yongTrigram, changingYao, original)

  // F-7: 一体百用
  const tiBaiYong = computeTiBaiYong(tiTrigram, yongTrigram, huHexagram, changed)

  // F-3: 起卦过程描述
  const calcProcess = buildCalcProcess(method, upperNum, lowerNum, changingYao, upperTrigram, lowerTrigram, yaoIdx, huFromChanged)

  return {
    upperTrigram, lowerTrigram, originalHexagram: original,
    changingYao, changedHexagram: changed,
    huHexagram, huFromChanged,
    tiYong, changedTiYong,
    cuoHexagram, zongHexagram,
    seasonalStrength, yingQi, tiBaiYong,
    calcProcess,
    method, numbers, text, timestamp: Date.now(),
  }
}

// ────────────────── 卦画 I/O ──────────────────

function yangYaoToNumber(yangYao: number[]): number {
  const sorted = [...yangYao].sort((a, b) => a - b)
  if (arrEq(sorted, [1, 2, 3])) return 1
  if (arrEq(sorted, [1, 2])) return 2
  if (arrEq(sorted, [1, 3])) return 3
  if (arrEq(sorted, [1])) return 4
  if (arrEq(sorted, [2, 3])) return 5
  if (arrEq(sorted, [2])) return 6
  if (arrEq(sorted, [3])) return 7
  return 8
}

function arrEq(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

// ────────────────── 互卦 ──────────────────

const BIT_TO_TRIGRAM_NUM = [8, 4, 6, 2, 7, 3, 5, 1]

function bitsToTrigramNum(bits: number): number { return BIT_TO_TRIGRAM_NUM[bits] }

function computeHuGua(hexagram: { symbol: number }): Hexagram {
  const sym = hexagram.symbol
  const y = [(sym>>0)&1, (sym>>1)&1, (sym>>2)&1, (sym>>3)&1, (sym>>4)&1, (sym>>5)&1]
  const huLowerBits = y[1] | (y[2] << 1) | (y[3] << 2)
  const huUpperBits = y[2] | (y[3] << 1) | (y[4] << 2)
  const l = getTrigramByNumber(bitsToTrigramNum(huLowerBits))
  const u = getTrigramByNumber(bitsToTrigramNum(huUpperBits))
  return getHexagramByTrigrams(u.name, l.name)!
}

// ────────────────── 体用生克 ──────────────────

function computeTiYong(ti: Trigram, yong: Trigram): TiYongRelation {
  const r = getFiveElementRelation(ti.element, yong.element)
  const judgments: Record<string, string> = {
    '用生体': '有进益之喜。贵人相助，事半功倍，大吉。',
    '体用比和': '百事顺遂。天地人和，万事亨通，最吉之象。',
    '体克用': '事可成，但需费力。诸事可图，宜主动进取。',
    '体生用': '有耗失之患。劳心费力，付出多而收获少。',
    '用克体': '事不可为，阻力大。诸事不宜，宜守不宜攻。',
  }
  return { ti, yong, tiElement: ti.element, yongElement: yong.element, relation: r, judgment: judgments[r] || '' }
}

// F-6: 变卦层面的体用重新分析
function computeChangedTiYong(changed: Hexagram, isUpperYao: boolean, tiTrigram: Trigram): TiYongRelation | null {
  const tiUpper = getTrigramByName(changed.upperTrigram)
  const tiLower = getTrigramByName(changed.lowerTrigram)
  if (!tiUpper || !tiLower) return null
  // 体卦不变，用卦是变动后的那一卦
  const changedYong = isUpperYao ? tiUpper : tiLower
  return computeTiYong(tiTrigram, changedYong)
}

// F-7: 一体百用 — 互卦、变卦与体卦的交叉生克
function computeTiBaiYong(ti: Trigram, _yong: Trigram, hu: Hexagram, changed: Hexagram): {
  huToTi: string, changedToTi: string, summary: string
} {
  const huUpper = getTrigramByName(hu.upperTrigram)!
  const huLower = getTrigramByName(hu.lowerTrigram)!
  const changedUpper = getTrigramByName(changed.upperTrigram)!
  const changedLower = getTrigramByName(changed.lowerTrigram)!

  const relations: string[] = []
  const goodCount = { val: 0 }
  const badCount = { val: 0 }

  function check(label: string, t: Trigram) {
    const r = getFiveElementRelation(ti.element, t.element)
    const isGood = r === '用生体' || r === '体用比和' || r === '体克用'
    const isBad = r === '用克体' || r === '体生用'
    if (isGood) goodCount.val++
    if (isBad) badCount.val++
    relations.push(`${label}${t.name}${t.element}：${r}`)
  }

  check('互上卦', huUpper)
  check('互下卦', huLower)
  check('变上卦', changedUpper)
  check('变下卦', changedLower)

  const summary = goodCount.val >= 3 ? '体卦多受生扶，过程与结果俱佳。'
    : goodCount.val >= 2 ? '体卦整体受生多于受克，虽有波折终可成。'
    : goodCount.val >= 1 ? '体卦受生有限，过程阻力明显，需努力经营。'
    : '体卦多方受克，形势不利，宜谨慎行事。'

  return { huToTi: relations.slice(0, 2).join('；'), changedToTi: relations.slice(2).join('；'), summary }
}

// F-11: 错卦 — 所有爻阴阳翻转
function computeCuoGua(hexagram: Hexagram): Hexagram {
  const sym = (~hexagram.symbol) & 0x3F
  const y = [(sym>>0)&1, (sym>>1)&1, (sym>>2)&1, (sym>>3)&1, (sym>>4)&1, (sym>>5)&1]
  const lb = y[0]|(y[1]<<1)|(y[2]<<2)
  const ub = y[3]|(y[4]<<1)|(y[5]<<2)
  const l = getTrigramByNumber(bitsToTrigramNum(lb))
  const u = getTrigramByNumber(bitsToTrigramNum(ub))
  return getHexagramByTrigrams(u.name, l.name)!
}

// F-11: 综卦 — 卦象上下颠倒
function computeZongGua(hexagram: Hexagram): Hexagram | null {
  if (['乾为天','坤为地','离为火','坎为水'].includes(hexagram.name)) return null
  const sym = hexagram.symbol
  // 颠倒：初↔上(bit0↔bit5), 二↔五(bit1↔bit4), 三↔四(bit2↔bit3)
  const newSym =
    ((sym >> 5) & 1) |        // 原上爻 → 新初爻
    (((sym >> 4) & 1) << 1) |  // 原五爻 → 新二爻
    (((sym >> 3) & 1) << 2) |  // 原四爻 → 新三爻
    (((sym >> 2) & 1) << 3) |  // 原三爻 → 新四爻
    (((sym >> 1) & 1) << 4) |  // 原二爻 → 新五爻
    (((sym >> 0) & 1) << 5)    // 原初爻 → 新上爻
  const y = [(newSym>>0)&1,(newSym>>1)&1,(newSym>>2)&1,(newSym>>3)&1,(newSym>>4)&1,(newSym>>5)&1]
  const lb = y[0]|(y[1]<<1)|(y[2]<<2)
  const ub = y[3]|(y[4]<<1)|(y[5]<<2)
  const l = getTrigramByNumber(bitsToTrigramNum(lb))
  const u = getTrigramByNumber(bitsToTrigramNum(ub))
  return getHexagramByTrigrams(u.name, l.name)!
}

// ────────────────── F-5: 卦气旺衰 ──────────────────

interface SeasonalStrength {
  monthName: string     // 农历月名
  monthElement: string  // 月支五行
  tiState: string       // 体卦状态（旺/相/休/囚/死）
  yongState: string     // 用卦状态
  summary: string       // 综合判断
}

// 节气日期表（近似值，2020-2030年误差±1天）
// 每月两个节气：节(月始) + 气(月中)
const JIE_QI = [
  { m:1, d:5,  zhi:'丑', wuxing:'土', name:'小寒→丑月' },
  { m:2, d:4,  zhi:'寅', wuxing:'木', name:'立春→寅月' },
  { m:3, d:6,  zhi:'卯', wuxing:'木', name:'惊蛰→卯月' },
  { m:4, d:5,  zhi:'辰', wuxing:'土', name:'清明→辰月' },
  { m:5, d:5,  zhi:'巳', wuxing:'火', name:'立夏→巳月' },
  { m:6, d:5,  zhi:'午', wuxing:'火', name:'芒种→午月' },
  { m:7, d:7,  zhi:'未', wuxing:'土', name:'小暑→未月' },
  { m:8, d:7,  zhi:'申', wuxing:'金', name:'立秋→申月' },
  { m:9, d:7,  zhi:'酉', wuxing:'金', name:'白露→酉月' },
  { m:10,d:8,  zhi:'戌', wuxing:'土', name:'寒露→戌月' },
  { m:11,d:7,  zhi:'亥', wuxing:'水', name:'立冬→亥月' },
  { m:12,d:7,  zhi:'子', wuxing:'水', name:'大雪→子月' },
]

export function getLunarMonth(date: Date): { zhi: string, wuxing: string, name: string } {
  const m = date.getMonth() + 1 // 1-12
  const d = date.getDate()
  // 找到当前日期所属的节气区间
  for (let i = JIE_QI.length - 1; i >= 0; i--) {
    const jq = JIE_QI[i]
    if (m > jq.m || (m === jq.m && d >= jq.d)) {
      return { zhi: jq.zhi, wuxing: jq.wuxing, name: jq.name }
    }
  }
  // 元旦到小寒之间 → 丑月
  return { zhi: '丑', wuxing: '土', name: '小寒→丑月' }
}

function computeSeasonalStrength(ti: Trigram, yong: Trigram): SeasonalStrength {
  const now = new Date()
  const lunar = getLunarMonth(now)
  const me = lunar.wuxing

  // 旺相休囚死表（按当令五行 → 各五行状态）
  const stateTable: Record<string, Record<string, string>> = {
    '木': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
    '火': { '火': '旺', '土': '相', '木': '休', '金': '囚', '水': '死' },
    '金': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
    '水': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' },
    '土': { '土': '旺', '金': '相', '火': '休', '水': '囚', '木': '死' },
  }

  const tiState = stateTable[me]?.[ti.element] || '休'
  const yongState = stateTable[me]?.[yong.element] || '休'

  const stateStrength: Record<string, number> = { '旺': 5, '相': 4, '休': 3, '囚': 2, '死': 1 }
  const tiScore = stateStrength[tiState] || 3
  const yongScore = stateStrength[yongState] || 3

  let summary: string
  if (tiScore >= 4) summary = `体卦${ti.name}${ti.element}值${tiState}地，根基稳固，得时令之助。`
  else if (tiScore === 3) summary = `体卦${ti.name}${ti.element}处${tiState}态，时令不助亦不伤。`
  else summary = `体卦${ti.name}${ti.element}逢${tiState}乡，时令不利，根基薄弱。`

  if (yongScore >= 4) summary += `用卦${yong.name}${yong.element}值${yongState}地，外力强盛。`
  else if (yongScore <= 2) summary += `用卦${yong.name}${yong.element}处${yongState}态，外力不足。`

  return { monthName: lunar.name, monthElement: me, tiState, yongState, summary }
}

// ────────────────── F-4: 应期推算 ──────────────────

interface YingQi {
  method: string       // 推算方法
  description: string  // 应期描述
  timeRange: string    // 时间范围
}

function computeYingQi(ti: Trigram, yong: Trigram, changingYao: number, _hexagram: Hexagram): YingQi {
  const tiElem = ti.element
  const yongElem = yong.element
  const r = getFiveElementRelation(tiElem, yongElem)

  // 卦数法：上卦数+下卦数+动爻数
  const totalShu = ti.number + yong.number + changingYao

  // 卦气法：体卦五行当令时间
  const elemTime: Record<string, { season: string, days: string }> = {
    '金': { season: '秋季（申酉月，约8-10月）', days: '庚辛申酉日' },
    '木': { season: '春季（寅卯月，约2-4月）', days: '甲乙寅卯日' },
    '水': { season: '冬季（亥子月，约11-1月）', days: '壬癸亥子日' },
    '火': { season: '夏季（巳午月，约5-7月）', days: '丙丁巳午日' },
    '土': { season: '四季末月（辰未戌丑月）', days: '戊己辰戌丑未日' },
  }

  const tiTime = elemTime[tiElem] || elemTime['土']

  let range: string
  if (r === '用生体' || r === '体用比和') {
    range = `较近，约${totalShu}日内有应，或以${tiTime.season}为应期窗口`
  } else if (r === '体克用') {
    range = `稍迟，约${totalShu + 3}日内，或以${tiTime.season}为应`
  } else {
    range = `较远，约${totalShu + 7}日甚至更长，宜待${tiTime.season}转旺之时`
  }

  return {
    method: '卦气法 + 卦数法',
    description: `体${ti.name}${tiElem}(${tiTime.days})，总数${totalShu}，${r === '用克体' ? '用克体则迟' : r === '体克用' ? '体克用稍迟' : '比和则速'}`,
    timeRange: range,
  }
}

// ────────────────── 五行工具 ──────────────────

function getFiveElementRelation(a: string, b: string): '体克用' | '用克体' | '体生用' | '用生体' | '体用比和' {
  if (a === b) return '体用比和'
  const generates: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const overcomes: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  if (overcomes[a] === b) return '体克用'
  if (overcomes[b] === a) return '用克体'
  if (generates[a] === b) return '体生用'
  return '用生体'
}

// ────────────────── F-3: 起卦过程描述 ──────────────────

function buildCalcProcess(method: string, upperNum: number, lowerNum: number, changingYao: number,
  upper: Trigram, lower: Trigram, yaoIdx: number, huFromChanged: boolean): string {
  const methodNames: Record<string, string> = { number: '数字起卦', time: '时间起卦', text: '文字起卦' }
  const parts = [`起卦方法：${methodNames[method] || method}`]

  if (method === 'number') {
    parts.push(`上卦：第一个数 ÷ 8 = 余${upperNum} → ${upper.name}卦（${upper.element}）`)
    parts.push(`下卦：第二个数 ÷ 8 = 余${lowerNum} → ${lower.name}卦（${lower.element}）`)
    parts.push(`动爻：第三个数 ÷ 6 = 余${changingYao === 6 ? 0 : changingYao}，取第${changingYao}爻（${yaoIdx >= 3 ? '上' : '下'}卦）`)
  } else if (method === 'time') {
    parts.push(`上卦：(年+月+日) ÷ 8 = 余${upperNum} → ${upper.name}卦`)
    parts.push(`下卦：(年+月+日+时) ÷ 8 = 余${lowerNum} → ${lower.name}卦`)
    parts.push(`动爻：(年+月+日+时) ÷ 6 = 余${changingYao === 6 ? 0 : changingYao}，取第${changingYao}爻`)
  } else {
    parts.push(`上卦：前段笔画和 ÷ 8 = 余${upperNum} → ${upper.name}卦`)
    parts.push(`下卦：后段笔画和 ÷ 8 = 余${lowerNum} → ${lower.name}卦`)
    parts.push(`动爻：总笔画 ÷ 6 = 余${changingYao === 6 ? 0 : changingYao}，取第${changingYao}爻`)
  }

  if (huFromChanged) {
    parts.push('互卦：本卦为纯乾/纯坤，依"乾坤无互，互其变卦"原则，取变卦之互卦')
  }

  return parts.join('；')
}
