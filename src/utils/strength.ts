/**
 * 六爻月建日辰双重旺衰分析（《增删卜易》）
 * 月建司一月之权，日辰四时俱旺
 */
import type { YaoLine } from '../features/divination/types'

const SHENG: Record<string,string> = {'金':'水','水':'木','木':'火','火':'土','土':'金'}
const KE:    Record<string,string> = {'金':'木','木':'土','土':'水','水':'火','火':'金'}

/** 五行间关系类型（A对B） */
function getRelation(me: string, other: string): '比'|'生'|'泄'|'克'|'耗' {
  if (me === other) return '比'
  if (SHENG[me] === other) return '泄'
  if (SHENG[other] === me) return '生'
  if (KE[me] === other) return '克'
  return '耗'
}

/** 爻值月建则旺、值日辰则旺 */
function describeEffect(me: string, src: string, srcName: string): string {
  const r = getRelation(me, src)
  const map: Record<string,string> = {
    '比': `${srcName}与爻同气（比和），旺相`,
    '生': `${srcName}生爻，得时令扶助，旺相`,
    '泄': `${srcName}泄爻气，爻被消耗，偏衰`,
    '克': `${srcName}克爻，受压制，休囚`,
    '耗': `${srcName}耗爻，力量微减`,
  }
  return map[r]
}

export interface StrengthResult {
  yong: { month: string; day: string; score: number; level: string }
  yuan: { month: string; day: string; score: number; level: string; line: YaoLine | null }
  ji:   { month: string; day: string; score: number; level: string; line: YaoLine | null }
  summary: string
}

export function analyzeMoonDayStrength(
  yongLine: YaoLine, yongWx: string,
  yuanLine: YaoLine | null, yuanWx: string | null,
  jiLine: YaoLine | null, jiWx: string | null,
  monthWx: string, dayWx: string,
): StrengthResult {
  const score = (wx: string, mo: string, da: string): { month: string; day: string; score: number; level: string } => {
    const mRel = getRelation(wx, mo)
    const dRel = getRelation(wx, da)
    const sMap: Record<string,number> = {'比':3,'生':2,'泄':-1,'克':-2,'耗':-1}
    const s = (sMap[mRel]||0) + (sMap[dRel]||0)
    const lv = s >= 4 ? '旺' : s >= 2 ? '偏旺' : s >= 0 ? '中庸' : s >= -2 ? '偏衰' : '衰'
    return { month: describeEffect(wx, mo, '月建'), day: describeEffect(wx, da, '日辰'), score: s, level: lv }
  }

  const yEff = score(yongWx, monthWx, dayWx)
  const yuanEff = yuanWx ? score(yuanWx, monthWx, dayWx) : { month:'无原神',day:'',score:0,level:''}
  const jiEff = jiWx ? score(jiWx, monthWx, dayWx) : { month:'无忌神',day:'',score:0,level:''}

  const isYongWeak = yEff.score <= 0
  const summary = `用神${yongWx}在${monthWx}月${dayWx}日：${yEff.level}（得分${yEff.score}），${isYongWeak ? '休囚无力，事多阻滞' : '旺相有力，所谋易成'}。`

  return {
    yong: yEff,
    yuan: { ...yuanEff, line: yuanLine },
    ji:   { ...jiEff,   line: jiLine },
    summary,
  }
}
