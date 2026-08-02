/**
 * 旺衰 + 喜用神引擎测试
 *
 * 验证改进后的 judgeBodyStrength / determineYongShen：
 * 1. 从格取用（弃命从势，喜忌反常规）
 * 2. 专旺格取用
 * 3. 常规身强身弱
 * 4. 调候保底（调候为急）
 */

import { judgeBodyStrength } from '../wangshuai'
import { determineYongShen, getCongGeYongShen } from '../yongshen'
import {
  STEM_ELEMENT, BRANCH_ELEMENT, STEM_YIN_YANG, BRANCH_YIN_YANG,
  HIDDEN_STEMS, getTenGod,
} from '../../constants'
import type { HeavenlyStem, EarthlyBranch } from '../../constants'
import type { BaziChart, Pillar } from '../../types'

function makePillar(stem: HeavenlyStem, branch: EarthlyBranch, dayStem: HeavenlyStem): Pillar {
  return {
    stem, branch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    naYin: '',
    hiddenStems: [...HIDDEN_STEMS[branch]],
    tenGod: getTenGod(dayStem, stem),
    stemYinYang: STEM_YIN_YANG[stem],
    branchYinYang: BRANCH_YIN_YANG[branch],
  }
}

function makeBazi(
  dayMaster: HeavenlyStem,
  year: [HeavenlyStem, EarthlyBranch],
  month: [HeavenlyStem, EarthlyBranch],
  day: [HeavenlyStem, EarthlyBranch],
  hour: [HeavenlyStem, EarthlyBranch],
): BaziChart {
  return {
    year: makePillar(year[0], year[1], dayMaster),
    month: makePillar(month[0], month[1], dayMaster),
    day: makePillar(day[0], day[1], dayMaster),
    hour: makePillar(hour[0], hour[1], dayMaster),
    dayMaster,
    dayMasterElement: STEM_ELEMENT[dayMaster],
    dayMasterYinYang: STEM_YIN_YANG[dayMaster],
  }
}

/** 五行分布（含藏干口径，与 analysis.ts 一致） */
function makeDist(weights: [HeavenlyStem, EarthlyBranch][]): Record<'木'|'火'|'土'|'金'|'水', number> {
  const dist: Record<'木'|'火'|'土'|'金'|'水', number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const [s, b] of weights) {
    dist[STEM_ELEMENT[s]] += 2
    dist[BRANCH_ELEMENT[b]] += 1.5
    for (const hs of HIDDEN_STEMS[b]) dist[STEM_ELEMENT[hs]] += 0.5
  }
  return dist
}

let passed = 0
let failed = 0
const failures: string[] = []

function expect(desc: string, cond: boolean) {
  if (cond) passed++
  else { failed++; failures.push(`❌ ${desc}`) }
}

function contains(list: string[], items: string[]): boolean {
  return items.every(i => list.includes(i))
}

// ============================================================
// 1. 从格取用：丙火日主，满盘金（从财格）
// ============================================================
{
  const bazi = makeBazi('丙', ['庚', '申'], ['辛', '酉'], ['丙', '子'], ['辛', '酉'])
  const dist = makeDist([['庚', '申'], ['辛', '酉'], ['丙', '子'], ['辛', '酉']])
  // 金: 庚2+辛2+辛2+申1.5+酉1.5+酉1.5+藏庚0.5+藏辛0.5×2 = 10.5
  const strength = judgeBodyStrength(bazi)
  console.log(`[从财格] 旺衰=${strength.strength} 总分=${strength.totalScore.toFixed(1)}`)
  expect('从财格：丙火弱极（总分 < -5）', strength.totalScore < -5)

  const yongShen = determineYongShen(bazi, strength, dist, '从财格（从金）')
  console.log(`[从财格] 喜用=${yongShen.favorable.join('、')} 忌=${yongShen.unfavorable.join('、')}`)
  expect('从财格：用神为金（所从之势）', yongShen.favorable.includes('金'))
  expect('从财格：忌神含比劫火（犯旺）', yongShen.unfavorable.includes('火'))
  expect('从财格：忌神含印星木（生身破格）', yongShen.unfavorable.includes('木'))
  expect('从财格：跳过四维（fuYi为空）', yongShen.fuYi.length === 0)
}

// ============================================================
// 2. 专旺格取用：甲木日主，满盘木（曲直格）
// ============================================================
{
  const bazi = makeBazi('甲', ['甲', '寅'], ['甲', '寅'], ['甲', '卯'], ['乙', '卯'])
  const dist = makeDist([['甲', '寅'], ['甲', '寅'], ['甲', '卯'], ['乙', '卯']])
  const strength = judgeBodyStrength(bazi)
  console.log(`[曲直格] 旺衰=${strength.strength} 总分=${strength.totalScore.toFixed(1)}`)
  expect('曲直格：甲木极旺（总分 ≥ 10）', strength.totalScore >= 10)

  const yongShen = determineYongShen(bazi, strength, dist, '曲直格')
  console.log(`[曲直格] 喜用=${yongShen.favorable.join('、')} 忌=${yongShen.unfavorable.join('、')}`)
  expect('曲直格：喜用含木（顺其旺势）', yongShen.favorable.includes('木'))
  expect('曲直格：忌不含木（比劫不忌）', !yongShen.unfavorable.includes('木'))
  expect('曲直格：忌含金（克身破格）', yongShen.unfavorable.includes('金'))
}

// ============================================================
// 3. 常规身强：丙火午月，禄刃重重
// ============================================================
{
  const bazi = makeBazi('丙', ['丙', '午'], ['甲', '午'], ['丙', '寅'], ['丙', '巳'])
  const dist = makeDist([['丙', '午'], ['甲', '午'], ['丙', '寅'], ['丙', '巳']])
  const strength = judgeBodyStrength(bazi)
  console.log(`[常规身强] 旺衰=${strength.strength} 总分=${strength.totalScore.toFixed(1)}`)
  expect('丙火午月：身强', strength.strength === '身强' || strength.strength === '身偏旺')

  const yongShen = determineYongShen(bazi, strength, dist)
  console.log(`[常规身强] 喜用=${yongShen.favorable.join('、')} 忌=${yongShen.unfavorable.join('、')}`)
  expect('身强：喜用含克泄耗（金或水）', yongShen.favorable.some(e => e === '金' || e === '水'))
  expect('身强：忌不含生扶（木火为忌）', contains(yongShen.unfavorable, ['木', '火']))
}

// ============================================================
// 4. 常规身弱：乙木酉月无根
// ============================================================
{
  const bazi = makeBazi('乙', ['己', '酉'], ['辛', '酉'], ['乙', '丑'], ['丁', '亥'])
  const dist = makeDist([['己', '酉'], ['辛', '酉'], ['乙', '丑'], ['丁', '亥']])
  const strength = judgeBodyStrength(bazi)
  console.log(`[常规身弱] 旺衰=${strength.strength} 总分=${strength.totalScore.toFixed(1)}`)
  expect('乙木酉月无根：身弱', strength.strength === '身弱' || strength.strength === '身偏弱')

  const yongShen = determineYongShen(bazi, strength, dist)
  console.log(`[常规身弱] 喜用=${yongShen.favorable.join('、')} 忌=${yongShen.unfavorable.join('、')}`)
  expect('身弱：喜用含生扶（水或木）', yongShen.favorable.some(e => e === '水' || e === '木'))
}

// ============================================================
// 5. 调候保底：甲木子月（三冬）无火 → 调候为急
// ============================================================
{
  const bazi = makeBazi('甲', ['庚', '子'], ['甲', '子'], ['甲', '寅'], ['壬', '申'])
  const dist = makeDist([['庚', '子'], ['甲', '子'], ['甲', '寅'], ['壬', '申']])
  const strength = judgeBodyStrength(bazi)
  const yongShen = determineYongShen(bazi, strength, dist)
  console.log(`[调候保底] 旺衰=${strength.strength} 喜用=${yongShen.favorable.join('、')} 调候=${yongShen.tiaoHou.join('、')}`)
  // 甲木子月调候：丁（火）、庚（金）；命局无火（火<3）→ 极端寒局 → 火必须保底
  expect('冬木：调候用神含火', yongShen.tiaoHou.includes('火'))
  expect('冬木：极端寒局，火保底为喜用', yongShen.favorable.includes('火'))
  expect('调候保底：commentary 有说明', yongShen.commentary.some(c => c.includes('调候保底')))
}

// ============================================================
// 6. 从格函数单元测试
// ============================================================
{
  const r1 = getCongGeYongShen('从财格（从金）', '丙', { '木': 2, '火': 2, '土': 3, '金': 14, '水': 3 })
  expect('getCongGeYongShen(从金)：用神含金', r1?.favorable.includes('金') ?? false)
  expect('getCongGeYongShen(从金)：喜神含土（生金）', r1?.favorable.includes('土') ?? false)

  const r2 = getCongGeYongShen('从官杀格（从水）', '丁', { '木': 2, '火': 2, '土': 2, '金': 6, '水': 13 })
  expect('getCongGeYongShen(从水)：用神含水', r2?.favorable.includes('水') ?? false)
  expect('getCongGeYongShen(从水)：忌含火（比劫）', r2?.unfavorable.includes('火') ?? false)

  const r3 = getCongGeYongShen('曲直格', '甲', { '木': 16, '火': 1, '土': 1, '金': 1, '水': 5 })
  expect('getCongGeYongShen(曲直)：喜用含木水', (r3?.favorable.includes('木') && r3?.favorable.includes('水')) ?? false)
  expect('getCongGeYongShen(曲直)：忌含金（克身）', r3?.unfavorable.includes('金') ?? false)
}

// ============================================================
// 结果
// ============================================================
console.log(`\n旺衰+喜用神引擎测试`)
console.log(`✅ 通过：${passed}`)
console.log(`❌ 失败：${failed}\n`)
if (failures.length > 0) {
  for (const f of failures) console.log(f)
  console.log()
  process.exit(1)
}
console.log('🎉 旺衰+喜用神引擎测试全部通过！')
process.exit(0)
