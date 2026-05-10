import type { LiuyaoResult, YaoLine } from '../types'
import { getHexagramFromLines, getHexagramBySymbol } from './hexagrams'
import { getTrigramByNumber } from './trigrams'

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

  return {
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
}

/**
 * 把完整的六爻摇卦结果转换为 LiuyaoResult
 * 用于从 CoinShaker 逐爻摇出后构建
 */
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

  return {
    lines,
    originalHexagram: original,
    originalName: original.name,
    changingPositions,
    changedHexagram,
    changedName,
    method: 'coin',
    timestamp: Date.now(),
  }
}
