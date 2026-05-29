/**
 * 六爻四神体系分析（《增删卜易》原神·忌神·仇神理论）
 * 原神=生用神者，忌神=克用神者，仇神=克原神者
 */
import type { YaoLine } from '../features/divination/types'

const SHENG: Record<string,string> = {'金':'水','水':'木','木':'火','火':'土','土':'金'}
const KE:    Record<string,string> = {'金':'木','木':'土','土':'水','水':'火','火':'金'}

// 逆向查找：谁生我
function whoSheng(me: string): string | null {
  for (const [k,v] of Object.entries(SHENG)) if (v===me) return k
  return null
}
// 谁克我
function whoKe(me: string): string | null {
  for (const [k,v] of Object.entries(KE)) if (v===me) return k
  return null
}

export function analyzeSiShen(lines: YaoLine[], yongIndex: number): {
  yuan: { line: YaoLine | null; wuxing: string | null; info: string }
  ji:   { line: YaoLine | null; wuxing: string | null; info: string }
  chou: { line: YaoLine | null; wuxing: string | null; info: string }
  summary: string
} {
  const yong = lines[yongIndex - 1]
  const yWx = yong.wuxing!
  const yuanWx = whoSheng(yWx)
  const jiWx   = whoKe(yWx)
  const chouWx = yuanWx ? whoKe(yuanWx) : null

  const yuanL = yuanWx ? lines.find(l => l.wuxing === yuanWx) : null
  const jiL   = jiWx   ? lines.find(l => l.wuxing === jiWx)   : null
  const chouL = chouWx ? lines.find(l => l.wuxing === chouWx) : null

  const pos = (l: YaoLine) => ['','初','二','三','四','五','上'][l.index]

  let sum = ''
  if (yuanL) sum += `原神${yuanWx}在${pos(yuanL)}爻(${yuanL.liuqin})，生用神有力；`
  else sum += `卦中无${yuanWx}爻，用神无源；`
  if (jiL) sum += `忌神${jiWx}在${pos(jiL)}爻(${jiL.liuqin})，克制用神；`
  else sum += `卦中无${jiWx}爻，用神无克；`
  if (chouL) sum += `仇神${chouWx}在${pos(chouL)}爻(${chouL.liuqin})，威胁原神。`
  else sum += `无仇神。`

  return {
    yuan: { line: yuanL, wuxing: yuanWx, info: yuanL ? `原神：${pos(yuanL)}爻${yuanL.liuqin}（${yuanL.gan}${yuanL.zhi}${yuanL.wuxing}），${yuanWx}生${yWx}为用神之源` : `原神：卦中无${yuanWx}爻` },
    ji:   { line: jiL,   wuxing: jiWx,   info: jiL   ? `忌神：${pos(jiL)}爻${jiL.liuqin}（${jiL.gan}${jiL.zhi}${jiL.wuxing}），${jiWx}克${yWx}为用神之敌`      : `忌神：卦中无${jiWx}爻` },
    chou: { line: chouL, wuxing: chouWx, info: chouL ? `仇神：${pos(chouL)}爻${chouL.liuqin}（${chouL.gan}${chouL.zhi}${chouL.wuxing}），${chouWx}克原神${yuanWx}` : `仇神：卦中无${chouWx}爻` },
    summary: sum,
  }
}
