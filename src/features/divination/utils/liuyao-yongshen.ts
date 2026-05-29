/**
 * 六爻双用神定位（《增删卜易》「008、用神」）
 * 注意：此模块仅用于六爻，与 bazi 系统的 src/utils/yongshen.ts 完全不同
 *
 * 双用神法则：身份匹配优先（主用神）+ 事件/情绪补充（辅助用神）
 *   - 问"老师还生气吗"→ 主用神=父母（老师本人），辅助用神=子孙（解怨消气）
 *   - 问"考试怎么样"→ 主用神=父母（文书学业），无辅助用神
 */
import type { YaoLine } from '../types'

// 优先级1: 人物身份
const IDENTITY: [string, string][] = [
  ['老师','父母'],['师长','父母'],['父亲','父母'],['母亲','父母'],['父母','父母'],
  ['上司','官鬼'],['领导','官鬼'],['老板','官鬼'],
  ['子女','子孙'],['孩子','子孙'],['儿女','子孙'],
  ['妻子','妻财'],['丈夫','官鬼'],['女友','妻财'],['男友','官鬼'],
  ['朋友','兄弟'],['同事','兄弟'],
]
// 优先级2: 事件/情绪
const EVENT: [string, string][] = [
  ['生气','子孙'],['消气','子孙'],['解忧','子孙'],
  ['考试','父母'],['学业','父母'],
  ['财运','妻财'],['赚钱','妻财'],['投资','妻财'],
  ['感情','官鬼'],['婚姻','官鬼'],
  ['工作','官鬼'],['事业','官鬼'],['升职','官鬼'],
  ['健康','子孙'],['生病','子孙'],
  ['房屋','父母'],['买房','父母'],
  ['出行','子孙'],['旅游','子孙'],
]

export interface LiuyaoYongShenResult {
  primary:   { index: number; line: YaoLine; liuqin: string; basis: string }
  secondary?: { index: number; line: YaoLine; liuqin: string; fn: string }
  question: string
  info: string
}

function pickBest(candidates: YaoLine[]): YaoLine {
  if (candidates.length === 1) return candidates[0]
  const atShi = candidates.find(l => l.shiying === '世')
  if (atShi) return atShi
  const changing = candidates.find(l => l.changing)
  if (changing) return changing
  return candidates[0]
}

function basis(liuqin: string): string {
  const m: Record<string,string> = {
    '父母': '师长、长辈、文书之事',
    '官鬼': '功名、上司、仕途之事',
    '兄弟': '同辈、朋友、竞争之事',
    '妻财': '财物、婚姻、利益之事',
    '子孙': '晚辈、解忧、医药之事',
  }
  return m[liuqin] || ''
}

export function determineLiuyaoYongShen(lines: YaoLine[], question: string): LiuyaoYongShenResult {
  if (!question || typeof question !== 'string') {
    const l = lines[0]
    return { primary: { index:1, line:l, liuqin:l.liuqin||'父母', basis:'默认' }, question:'', info:'占事未明，以初爻为用神' }
  }

  // Step 1: 身份匹配（优先）
  let pLiq = ''
  for (const [kw, liq] of IDENTITY) {
    if (question.includes(kw)) { pLiq = liq; break }
  }
  // Step 2: 事件匹配
  let sLiq = ''
  for (const [kw, liq] of EVENT) {
    if (question.includes(kw)) { sLiq = liq; break }
  }
  // Step 3: 身份空→事件兜底
  if (!pLiq) { pLiq = sLiq || '父母'; sLiq = '' }

  // Step 4: 找爻
  const pLine = pickBest(lines.filter(l => l.liuqin === pLiq))
  const pIdx = lines.findIndex(l => l === pLine) + 1
  const pos = ['','初','二','三','四','五','上']

  let secondary
  if (sLiq && sLiq !== pLiq) {
    const sCands = lines.filter(l => l.liuqin === sLiq)
    if (sCands.length > 0) {
      const sLine = pickBest(sCands)
      secondary = {
        index: lines.findIndex(l => l === sLine) + 1, line: sLine, liuqin: sLiq,
        fn: sLiq === '子孙' ? '解忧制鬼（占消气/解怨）' : '',
      }
    }
  }

  const pInfo = `主用神${pLiq}爻——${pos[pIdx]}爻${pLine.gan}${pLine.zhi}${pLine.wuxing}（${basis(pLiq)}）`
  const sInfo = secondary
    ? `；辅助用神${secondary.liuqin}爻——${pos[secondary.index]}爻${secondary.line.gan}${secondary.line.zhi}${secondary.line.wuxing}（${secondary.fn}）`
    : ''

  return {
    primary:   { index: pIdx, line: pLine, liuqin: pLiq, basis: basis(pLiq) },
    secondary,
    question,
    info: `占${question}：${pInfo}${sInfo}。`,
  }
}
