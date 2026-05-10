import type { MeihuaResult, TiYongRelation } from '../types'
import { getTrigramByNumber, getTrigramByName } from './trigrams'
import { getHexagramByTrigrams } from './hexagrams'
import { getTotalStrokes } from './strokes'

/**
 * 梅花易数起卦逻辑
 * 来源：《梅花易数》卷一「象数易理篇」、卷二「体用生克篇」
 *
 * 核心规则：
 * - 卦以八除：取数 mod 8 → 卦（1乾2兑3离4震5巽6坎7艮8坤，余0为8坤）
 * - 爻以六除：取数 mod 6 → 动爻（1-6，余0为6）
 * - 体卦：本卦中无动爻的那一卦
 * - 用卦：本卦中有动爻的那一卦
 */

/** 数字起卦 */
export function meihuaNumberCast(n1: number, n2: number, n3?: number): MeihuaResult {
  const upperNum = n1 % 8
  const lowerNum = n2 % 8
  const changeNum = n3 ?? Math.floor(Math.random() * 100)
  const changingYao = changeNum % 6 === 0 ? 6 : changeNum % 6

  return buildMeihuaResult(upperNum, lowerNum, changingYao, 'number', [n1, n2, changeNum])
}

/** 时间起卦（年月日时） */
export function meihuaTimeCast(year: number, month: number, day: number, hour: number): MeihuaResult {
  const upperNum = (year + month + day) % 8
  const lowerNum = (year + month + day + hour) % 8
  const changeNum = (year + month + day + hour) % 6
  const changingYao = changeNum === 0 ? 6 : changeNum

  return buildMeihuaResult(upperNum, lowerNum, changingYao, 'time', [year, month, day, hour])
}

/** 当前时间起卦 */
export function meihuaCurrentTimeCast(): MeihuaResult {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const hour = now.getHours()

  // 地支时辰：子23-1=1, 丑1-3=2, ... 亥21-23=12
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

/** 文字起卦 */
export function meihuaTextCast(text: string): MeihuaResult {
  const chars = [...text].filter(ch => /[一-鿿]/.test(ch))
  const len = chars.length

  let upperNum: number
  let lowerNum: number

  if (len === 1) {
    const s = getTotalStrokes(chars[0])
    upperNum = s % 8
    lowerNum = s % 8
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
    // 无汉字，随机
    upperNum = Math.floor(Math.random() * 8)
    lowerNum = Math.floor(Math.random() * 8)
  }

  const totalStrokes = getTotalStrokes(text)
  const changeNum = totalStrokes % 6
  const changingYao = changeNum === 0 ? 6 : changeNum

  return buildMeihuaResult(upperNum, lowerNum, changingYao, 'text', undefined, text)
}

/** 构建梅花易数结果 */
function buildMeihuaResult(
  upperNum: number,
  lowerNum: number,
  changingYao: number,
  method: 'number' | 'time' | 'text',
  numbers?: number[],
  text?: string,
): MeihuaResult {
  const upperTrigram = getTrigramByNumber(upperNum)
  const lowerTrigram = getTrigramByNumber(lowerNum)

  const original = getHexagramByTrigrams(upperTrigram.name, lowerTrigram.name)
  if (!original) throw new Error(`无法识别的卦象: 上${upperTrigram.name}下${lowerTrigram.name}`)

  // 动爻变换
  // changingYao 1-6，对应 index 0-5 (初爻=0, 上爻=5)
  const yaoIdx = changingYao - 1
  const isUpperYao = yaoIdx >= 3 // 第4-6爻属上卦

  // 用卦（有动爻）和体卦（无动爻）
  const yongTrigram = isUpperYao ? upperTrigram : lowerTrigram
  const tiTrigram = isUpperYao ? lowerTrigram : upperTrigram

  // 变卦计算：根据动爻位置，将那一爻翻转（阳变阴、阴变阳），只改一爻
  const trigramYangYao = isUpperYao ? [...upperTrigram.yangYao] : [...lowerTrigram.yangYao]
  const yaoInTrigram = isUpperYao ? yaoIdx - 3 + 1 : yaoIdx + 1 // 在卦中的爻位 1-3

  let newTrigramNum: number
  if (trigramYangYao.includes(yaoInTrigram)) {
    // 阳爻变阴：去掉这个阳爻
    const newYangYao = trigramYangYao.filter(y => y !== yaoInTrigram)
    newTrigramNum = yangYaoToNumber(newYangYao)
  } else {
    // 阴爻变阳：加上这个阳爻
    const newYangYao = [...trigramYangYao, yaoInTrigram].sort()
    newTrigramNum = yangYaoToNumber(newYangYao)
  }

  const newUpper = isUpperYao ? getTrigramByNumber(newTrigramNum) : upperTrigram
  const newLower = !isUpperYao ? getTrigramByNumber(newTrigramNum) : lowerTrigram

  const changed = getHexagramByTrigrams(newUpper.name, newLower.name)
  if (!changed) throw new Error('无法计算变卦')

  // 互卦
  const huHexagram = computeHuGua(original)

  // 体用生克
  const tiYong = computeTiYong(tiTrigram, yongTrigram)

  return {
    upperTrigram,
    lowerTrigram,
    originalHexagram: original,
    changingYao,
    changedHexagram: changed,
    huHexagram,
    tiYong,
    method,
    numbers,
    text,
    timestamp: Date.now(),
  }
}

/** 阳爻位置数组 → 卦数 */
function yangYaoToNumber(yangYao: number[]): number {
  const sorted = [...yangYao].sort((a, b) => a - b)
  if (arrEq(sorted, [1, 2, 3])) return 1 // 乾
  if (arrEq(sorted, [1, 2])) return 2    // 兑
  if (arrEq(sorted, [1, 3])) return 3    // 离
  if (arrEq(sorted, [1])) return 4       // 震
  if (arrEq(sorted, [2, 3])) return 5    // 巽
  if (arrEq(sorted, [2])) return 6       // 坎
  if (arrEq(sorted, [3])) return 7       // 艮
  return 8 // 坤
}

function arrEq(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/**
 * 互卦取法
 * 来源：《梅花易数》：「以重卦去了初爻及第六爻，以中间四爻分作两卦」
 * 下互卦 = 2,3,4爻；上互卦 = 3,4,5爻
 *
 * 比特编码与卦数的转换对照（bit0=初爻, bit1=二爻, bit2=三爻）：
 *   0b000=0→坤(8)  0b001=1→震(4)  0b010=2→坎(6)  0b011=3→兑(2)
 *   0b100=4→艮(7)  0b101=5→离(3)  0b110=6→巽(5)  0b111=7→乾(1)
 */
const BIT_TO_TRIGRAM_NUM = [8, 4, 6, 2, 7, 3, 5, 1]

function bitsToTrigramNum(bits: number): number {
  return BIT_TO_TRIGRAM_NUM[bits]
}

function computeHuGua(hexagram: { symbol: number }): any {
  const sym = hexagram.symbol
  // 提取各爻 (0-5 = 初爻至上爻)
  const yao0 = (sym >> 0) & 1 // 初爻 = bit0
  const yao1 = (sym >> 1) & 1 // 二爻 = bit1
  const yao2 = (sym >> 2) & 1 // 三爻 = bit2
  const yao3 = (sym >> 3) & 1 // 四爻 = bit3
  const yao4 = (sym >> 4) & 1 // 五爻 = bit4
  const yao5 = (sym >> 5) & 1 // 上爻 = bit5

  // 下互卦 = 2,3,4爻（yao1, yao2, yao3）— 比特编码
  const huLowerBits = yao1 | (yao2 << 1) | (yao3 << 2)
  // 上互卦 = 3,4,5爻（yao2, yao3, yao4）— 比特编码
  const huUpperBits = yao2 | (yao3 << 1) | (yao4 << 2)

  // 关键修复：比特编码 → 八卦数
  const huLowerTrigram = getTrigramByNumber(bitsToTrigramNum(huLowerBits))
  const huUpperTrigram = getTrigramByNumber(bitsToTrigramNum(huUpperBits))

  return getHexagramByTrigrams(huUpperTrigram.name, huLowerTrigram.name)
}

/**
 * 体用生克分析
 * 来源：《梅花易数》卷二「体用总诀」
 *
 * 体克用 → 吉（我克事）
 * 用克体 → 凶（事克我）
 * 体生用 → 泄气（我生事）
 * 用生体 → 大吉（事生我）
 * 体用比和 → 最吉（五行相同）
 */
function computeTiYong(ti: any, yong: any): TiYongRelation {
  const tiElem = ti.element
  const yongElem = yong.element

  const relation = getFiveElementRelation(tiElem, yongElem)

  const judgments: Record<string, string> = {
    '体克用': '事可成，但需费力。诸事可图，宜主动进取。',
    '用克体': '事不可为，阻力大。诸事不宜，宜守不宜攻。',
    '体生用': '有耗失之患。劳心费力，付出多而收获少。',
    '用生体': '有进益之喜。贵人相助，事半功倍，大吉。',
    '体用比和': '百事顺遂。天地人和，万事亨通，最吉之象。',
  }

  return {
    ti,
    yong,
    tiElement: tiElem,
    yongElement: yongElem,
    relation,
    judgment: judgments[relation] || '',
  }
}

/** 五行生克关系 */
function getFiveElementRelation(a: string, b: string): '体克用' | '用克体' | '体生用' | '用生体' | '体用比和' {
  if (a === b) return '体用比和'

  // 生：木→火→土→金→水→木
  const generates: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  // 克：木→土→水→火→金→木
  const overcomes: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }

  if (overcomes[a] === b) return '体克用'
  if (overcomes[b] === a) return '用克体'
  if (generates[a] === b) return '体生用'
  return '用生体'
}
