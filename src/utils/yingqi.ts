/**
 * 应期推算 — 六爻 + 梅花易数
 * 六爻：值日法/静卦法/季节法/综合法
 * 梅花：卦气法/卦数法/季节法
 */
const DAY_MAP: Record<string, string> = {
  '金':'庚辛申酉日', '木':'甲乙寅卯日', '水':'壬癸亥子日',
  '火':'丙丁巳午日', '土':'戊己辰戌丑未日',
}
const SEASON_MAP: Record<string, string> = {
  '金':'秋季（申酉月，约8-10月）', '木':'春季（寅卯月，约2-4月）',
  '水':'冬季（亥子月，约11-1月）', '火':'夏季（巳午月，约5-7月）',
  '土':'四季末月（辰未戌丑月）',
}

/** 五行旺衰状态 → 应期远近 */
const SHENG_KE = { '金':'水','水':'木','木':'火','火':'土','土':'金' }
const KE = { '金':'木','木':'土','土':'水','水':'火','火':'金' }

function relation(a: string, b: string): string {
  if (a === b) return '比'
  if (SHENG_KE[b] === a) return '生'
  if (SHENG_KE[a] === b) return '泄'
  if (KE[a] === b) return '克'
  return '耗'
}

export function computeYingQiLiuyao(
  yongWx: string, isStatic: boolean, monthWx: string,
): { method: string; timeWindow: string }[] {
  const results: { method: string; timeWindow: string }[] = []

  // 用神在月建中的旺衰状态 → 影响应期远近
  const mRel = relation(yongWx, monthWx)
  const isWang = mRel === '比' || mRel === '生'
  const isShuai = mRel === '克' || mRel === '泄'

  // 1. 卦气值日法 — 具体到天干地支
  if (isWang) {
    results.push({
      method: '卦气值日法',
      timeWindow: `用神${yongWx}得月建${monthWx}生扶，旺相有力。应期较近，${DAY_MAP[yongWx]||'?'}当令之日有应，约7日内见分晓。`,
    })
  } else if (isShuai) {
    results.push({
      method: '卦气值日法',
      timeWindow: `用神${yongWx}被月建${monthWx}克制，休囚无力。应期较远，需待${DAY_MAP[yongWx]||'?'}当令之时，或${SEASON_MAP[yongWx]||'?'}转旺之日，约14-30日。`,
    })
  } else {
    results.push({
      method: '卦气值日法',
      timeWindow: `用神${yongWx}在月建${monthWx}中庸。应期在${DAY_MAP[yongWx]||'?'}当令之日，或在${SEASON_MAP[yongWx]||'?'}。`,
    })
  }

  // 2. 静卦/动卦应期
  if (isStatic) {
    results.push({
      method: '静卦应期',
      timeWindow: isWang
        ? '静卦用神旺相，逢值之日为应，约3-10日内见分晓。'
        : '静卦用神休囚，出月出旬方应，约30日甚至更久。',
    })
  }

  // 3. 季节法
  results.push({
    method: '季节窗口',
    timeWindow: `用神${yongWx}当令之时为${SEASON_MAP[yongWx]||'?'}，若近事则待${DAY_MAP[yongWx]||'?'}。`,
  })

  return results
}

export function computeYingQiMeihua(
  tiWx: string, yongWx: string,
  tiNum: number, yongNum: number, changingYao: number,
): { method: string; timeWindow: string }[] {
  const total = tiNum + yongNum + changingYao
  return [
    { method: '卦气法', timeWindow: `${DAY_MAP[tiWx]||'?'}当令之日` },
    { method: '卦数法', timeWindow: `总数${total}，约${total}日内有应` },
    { method: '季节法', timeWindow: `${SEASON_MAP[tiWx]||'?'}` },
  ]
}
