/**
 * 梅花易数体用综合评估 + 月令修正 + 演化链
 */
const SHENG: Record<string,string> = {'金':'水','水':'木','木':'火','火':'土','土':'金'}
const KE:    Record<string,string> = {'金':'木','木':'土','土':'水','水':'火','火':'金'}

export function getTiYongRelation(tiWx: string, yongWx: string): '用生体'|'体用比和'|'体克用'|'体生用'|'用克体' {
  if (tiWx === yongWx) return '体用比和'
  if (SHENG[yongWx] === tiWx) return '用生体'
  if (SHENG[tiWx] === yongWx) return '体生用'
  if (KE[tiWx] === yongWx) return '体克用'
  return '用克体'
}

const JIXIONG: Record<string,{level:string;desc:string}> = {
  '用生体':{level:'大吉',desc:'有进益之喜，贵人相助，事半功倍'},
  '体用比和':{level:'大吉',desc:'天地人和，百事顺遂'},
  '体克用':{level:'小吉',desc:'事可成但需费力，宜主动进取'},
  '体生用':{level:'小凶',desc:'有耗失之患，劳心费力'},
  '用克体':{level:'大凶',desc:'诸事不宜，阻力大，宜守不宜攻'},
}

export function evalTiYongComprehensive(
  tiWx: string, yongWx: string, tiState: string, yongState: string,
) {
  const rel = getTiYongRelation(tiWx, yongWx)
  const wMap: Record<string,number> = {'旺':5,'相':4,'休':3,'囚':2,'死':1}
  const tiS = wMap[tiState]||3; const yongS = wMap[yongState]||3
  const ratio = tiS - yongS
  const correction = ratio > 1 ? '体卦力量更强，吉上加吉' : ratio < -1 ? '用卦力量更强，吉凶打折' : '双方力量均衡'

  const jx = JIXIONG[rel]
  return {
    basic: rel, level: jx.level, desc: jx.desc,
    monthly: `体${tiWx}${tiState}(${tiS}分) vs 用${yongWx}${yongState}(${yongS}分)`,
    ratio, correction,
    verdict: `${rel}（${jx.level}）—— ${jx.desc}。${correction}。`,
  }
}
