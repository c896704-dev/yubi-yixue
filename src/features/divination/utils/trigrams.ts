import type { Trigram, FiveElement } from '../types'

/**
 * 八卦基础数据
 * 来源：《梅花易数》卷一「周易卦数」「八卦象例」「八宫所属五行」
 *        《增删卜易》「001、八卦」
 *
 * 卦画口诀：
 *   乾三连 ☰（三横相连）
 *   坤六断 ☷（三横断开为六短）
 *   震仰盂 ☳（下实上虚如碗口朝上）
 *   艮覆碗 ☶（上实下虚如碗口朝下）
 *   离中虚 ☲（中间虚）
 *   坎中满 ☵（中间实）
 *   兑上缺 ☱（上方有缺口）
 *   巽下断 ☴（下方断开）
 */

const trigrams: Record<string, Trigram> = {
  qian: {
    name: '乾',
    symbol: '☰',
    number: 1,
    element: '金',
    direction: '西北',
    image: '天',
    person: '父',
    body: '首',
    animal: '马',
    mnemonic: '乾三连',
    yangYao: [1, 2, 3],
  },
  dui: {
    name: '兑',
    symbol: '☱',
    number: 2,
    element: '金',
    direction: '西',
    image: '泽',
    person: '少女',
    body: '口',
    animal: '羊',
    mnemonic: '兑上缺',
    yangYao: [1, 2],
  },
  li: {
    name: '离',
    symbol: '☲',
    number: 3,
    element: '火',
    direction: '南',
    image: '火',
    person: '中女',
    body: '目',
    animal: '雉',
    mnemonic: '离中虚',
    yangYao: [1, 3],
  },
  zhen: {
    name: '震',
    symbol: '☳',
    number: 4,
    element: '木',
    direction: '东',
    image: '雷',
    person: '长男',
    body: '足',
    animal: '龙',
    mnemonic: '震仰盂',
    yangYao: [1],
  },
  xun: {
    name: '巽',
    symbol: '☴',
    number: 5,
    element: '木',
    direction: '东南',
    image: '风',
    person: '长女',
    body: '股',
    animal: '鸡',
    mnemonic: '巽下断',
    yangYao: [2, 3],
  },
  kan: {
    name: '坎',
    symbol: '☵',
    number: 6,
    element: '水',
    direction: '北',
    image: '水',
    person: '中男',
    body: '耳',
    animal: '豕',
    mnemonic: '坎中满',
    yangYao: [2],
  },
  gen: {
    name: '艮',
    symbol: '☶',
    number: 7,
    element: '土',
    direction: '东北',
    image: '山',
    person: '少男',
    body: '手',
    animal: '狗',
    mnemonic: '艮覆碗',
    yangYao: [3],
  },
  kun: {
    name: '坤',
    symbol: '☷',
    number: 8,
    element: '土',
    direction: '西南',
    image: '地',
    person: '母',
    body: '腹',
    animal: '牛',
    mnemonic: '坤六断',
    yangYao: [],
  },
}

/** 从 yangYao 计算三画卦比特值（bit0=初爻, bit1=二爻, bit2=三爻） */
export function getTrigramBitValue(yangYao: number[]): number {
  return (yangYao.includes(1) ? 1 : 0)
    | (yangYao.includes(2) ? 2 : 0)
    | (yangYao.includes(3) ? 4 : 0)
}

/** 三爻比特值 → 八卦数对照表（bit0=初爻, bit1=二爻, bit2=三爻, 阳=1, 阴=0） */
const BIT_TO_TRIGRAM_NUM = [8, 4, 6, 2, 7, 3, 5, 1]
// 0b000=坤(8) 0b001=震(4) 0b010=坎(6) 0b011=兑(2) 0b100=艮(7) 0b101=离(3) 0b110=巽(5) 0b111=乾(1)

/** 按比特值（0-7）取卦，bit0=初爻、bit1=二爻、bit2=三爻 */
export function getTrigramByBitValue(bits: number): Trigram {
  return getTrigramByNumber(BIT_TO_TRIGRAM_NUM[bits])
}

/** 按卦数1-8取卦，余数0对应坤(8) */
export function getTrigramByNumber(num: number): Trigram {
  const n = num % 8
  const key = n === 0 ? 'kun'
    : n === 1 ? 'qian'
    : n === 2 ? 'dui'
    : n === 3 ? 'li'
    : n === 4 ? 'zhen'
    : n === 5 ? 'xun'
    : n === 6 ? 'kan'
    : 'gen'
  return trigrams[key]
}

/** 按卦名取卦 */
export function getTrigramByName(name: string): Trigram | undefined {
  const map: Record<string, string> = {
    '乾': 'qian', '兑': 'dui', '离': 'li', '震': 'zhen',
    '巽': 'xun', '坎': 'kan', '艮': 'gen', '坤': 'kun',
  }
  const key = map[name]
  return key ? trigrams[key] : undefined
}

/** 元素颜色映射 */
export const elementColors: Record<FiveElement, { bg: string; text: string; border: string }> = {
  '金': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  '木': { bg: 'bg-positive-50', text: 'text-positive-600', border: 'border-positive-300' },
  '水': { bg: 'bg-water-50', text: 'text-water-600', border: 'border-water-300' },
  '火': { bg: 'bg-negative-50', text: 'text-negative-600', border: 'border-negative-300' },
  '土': { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-300' },
}

export default trigrams
