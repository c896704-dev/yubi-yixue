/**
 * 人生轨迹引擎回归测试（代码为辅那半部分的正确性锚点）
 *
 * 两层：
 *  ① relation 原语（伏吟/反吟/天克地冲/三合半合/干合/墓库/十二长生档/得地档）——确定性，无日期漂移；
 *  ② analyzeTrajectory 端到端结构不变量（大运起止年无 ±1 漂移、流年十年连续、岁运并临可检出）。
 * 运行：node --experimental-strip-types（见文末），或经 esbuild 打包后 node。
 */

import {
  scanBranchExt, scanStemExt, scanZhuExt,
  isBranchChong, isBranchHe, isStemHe, isStemChong,
  MU_KU_CHONG,
  type FactTarget,
} from '../relation'
import { nayinDeDi, changShengStageOf } from '../nayinTrajectory'
import { analyzeTrajectory, buildLiunianTracks } from '../trajectory'
import { analyzeSixiang } from '../sixiang'
import type { PersonInfo } from '../../types'

let pass = 0
let fail = 0
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; } else { fail++; console.error(`  ✗ ${name}${extra ? ' → ' + extra : ''}`) }
}
const hasKind = (facts: { kind: string; targets: string[] }[], kind: string, target?: string) =>
  facts.some(f => f.kind === kind && (!target || f.targets.includes(target)))

// ============================================================
// ① relation 原语
// ============================================================
console.log('▸ relation 原语')
{
  // 伏吟：外部支与目标同字
  const t: FactTarget[] = [{ branch: '子', label: '年支' }, { branch: '午', label: '日支' }]
  const f = scanBranchExt('子', t)
  check('子→年支(子) 伏吟', hasKind(f, '伏吟', '年支'))
  check('子→日支(午) 六冲', hasKind(f, '六冲', '日支'))
  check('伏吟不误判六冲对象', !hasKind(f, '六冲', '年支'))

  // 自刑支（辰午酉亥）见双：既是伏吟又是自刑
  const zi = scanBranchExt('辰', [{ branch: '辰', label: '日支' }])
  check('辰辰 伏吟', hasKind(zi, '伏吟', '日支'))
  check('辰辰 自刑', hasKind(zi, '自刑', '日支'))

  // 三合成局：外部申 + natal 子辰 → 申子辰水局
  const sanhe = scanBranchExt('申', [{ branch: '子', label: '日支' }, { branch: '辰', label: '时支' }])
  check('申+natal(子辰) 三合水局成局', hasKind(sanhe, '三合'))
  // 半合：外部申 + natal 子（缺辰），含中神子 → 半合
  const banhe = scanBranchExt('申', [{ branch: '子', label: '日支' }])
  check('申+natal(子) 半合水局', hasKind(banhe, '半合'))
  // 拱局：外部申 + natal 辰（缺中神子）→ 拱水
  const gong = scanBranchExt('申', [{ branch: '辰', label: '日支' }])
  check('申+natal(辰) 拱水局（缺中神）', hasKind(gong, '拱局') && !hasKind(gong, '半合'))

  // 三刑：外部寅 引动 natal 巳（无恩之刑寅巳申）
  const xing = scanBranchExt('寅', [{ branch: '巳', label: '月支' }])
  check('寅引动natal巳 无恩之刑', hasKind(xing, '无恩之刑', '月支'))
  // 无礼之刑 子卯
  check('卯引动子 无礼之刑', hasKind(scanBranchExt('卯', [{ branch: '子', label: '年支' }]), '无礼之刑', '年支'))

  // natal 内部关系绝不重复计入：只给外部申，targets 里的子辰之间本有三合半合，但不因扫描申就报"子辰半合"（那不含申）
  const noDouble = scanBranchExt('午', [{ branch: '子', label: '日支' }, { branch: '午', label: '时支' }])
  check('外部午对(子,午)：只报午子冲+午午伏吟，无natal内部关系',
    hasKind(noDouble, '六冲', '日支') && hasKind(noDouble, '伏吟', '时支') && !hasKind(noDouble, '三合'))

  // 干层：甲合己日主 → 干合日主(晦气)
  const st = scanStemExt('甲', '己', [{ stem: '庚', label: '年干' }])
  check('甲合日主己 → 干合日主', hasKind(st, '干合日主'))
  check('甲冲年干庚 → 天干四冲', hasKind(st, '天干四冲', '年干'))
  // 天干比叠
  check('外部庚与年干庚 天干比叠', hasKind(scanStemExt('庚', '丙', [{ stem: '庚', label: '年干' }]), '天干比叠', '年干'))

  // 整柱：伏吟(全同)/反吟(天克地冲)/天合地冲
  check('甲子 vs 甲子 → 伏吟', hasKind(scanZhuExt('甲子', [{ ganzhi: '甲子', label: '日柱' }]), '伏吟', '日柱'))
  check('甲子 vs 庚午 → 反吟(天克地冲)', hasKind(scanZhuExt('甲子', [{ ganzhi: '庚午', label: '日柱' }]), '反吟', '日柱'))
  // 天合地冲：甲(己合)子(午冲) vs 己午
  check('甲子 vs 己午 → 天合地冲', hasKind(scanZhuExt('甲子', [{ ganzhi: '己午', label: '柱' }]), '天合地冲'))
  // 谓词
  check('谓词 子午冲/子丑合/甲己合/甲庚冲', isBranchChong('子', '午') && isBranchHe('子', '丑') && isStemHe('甲', '己') && isStemChong('甲', '庚'))
  check('仅支冲不算反吟', !hasKind(scanZhuExt('甲子', [{ ganzhi: '甲午', label: 'x' }]), '反吟', 'x'))
  check('墓库对冲表 辰↔戌 丑↔未', MU_KU_CHONG['辰'] === '戌' && MU_KU_CHONG['丑'] === '未')
}

// ============================================================
// ② 纳音得地档 + 十二长生档
// ============================================================
console.log('▸ 得地/长生档')
{
  check('木命遇水运=得地', nayinDeDi('木', '水').kind === '得地')
  check('木命遇火运=泄气', nayinDeDi('木', '火').kind === '泄气')
  check('木命遇土运=财官次之', nayinDeDi('木', '土').kind === '财官次之')
  check('木命遇金运=受克不吉', nayinDeDi('木', '金').kind === '受克不吉')
  check('木命遇木运=同类上吉', nayinDeDi('木', '木').kind === '同类上吉')
  check('长生 甲@亥=长生', changShengStageOf('甲', '亥').stage === '长生')
  check('入墓 甲@未=墓', changShengStageOf('甲', '未').stage === '墓')
  check('临官 甲@寅=临官', changShengStageOf('甲', '寅').stage === '临官')
}

// ============================================================
// ③ analyzeTrajectory 端到端（男 2011-04-02 23:57 枣庄，日柱应为戊子）
// ============================================================
console.log('▸ 端到端结构不变量')
{
  const person: PersonInfo = {
    name: '测试', gender: '男', birthYear: 2011, birthMonth: 4, birthDay: 2,
    birthHour: 23, birthMinute: 57, birthPlace: '山东省·枣庄市', longitude: 117.32,
  }
  // 与主盘同口径（子初换日→戊子日）
  const r = analyzeSixiang(person)
  check('日柱戊子（晚子时换日口径）', r.stages[2].ganzhi === '戊子', r.stages[2].ganzhi)

  const t = analyzeTrajectory(person, r, { nowYear: 2026 })
  check('大运轨≥6步', t.dayunTracks.length >= 6)
  check('限运四段', t.stages.length === 4)
  check('第一段1-16岁', t.stages[0].ageRange.includes('1-16'))
  check('第四段49岁以后', t.stages[3].ageRange.includes('49'))

  // 关键不变量：startYear - (startAge-1) 对所有大运恒定 = 无 ±1 漂移
  const anchors = new Set(t.dayunTracks.map(d => d.startYear - (d.startAge - 1)))
  check('所有大运年份锚定一致（无 dayOffset ±1 漂移）', anchors.size === 1, `anchors=${[...anchors]}`)
  // 大运连续：每步 endAge=startAge+9，startYear 递增10
  let contiguous = true
  for (const d of t.dayunTracks) { if (d.endAge !== d.startAge + 9 || d.endYear !== d.startYear + 9) contiguous = false }
  check('大运十年一步连续', contiguous)

  // 每步大运纳音非空、得地档可空（无本命五行时）
  check('大运纳音均已解析', t.dayunTracks.every(d => d.naYin.length > 0))
  check('大运十神均已赋值', t.dayunTracks.every(d => !!d.stemTenGod))

  // 流年十年且干支逐年+1连续
  const lt = buildLiunianTracks(person, r, 0)
  check('第一步大运流年=10个', lt.length === 10, `${lt.length}`)
  check('流年首年=大运startYear', lt[0].year === t.dayunTracks[0].startYear)
  check('流年十年干支互异', new Set(lt.map(x => x.ganzhi)).size === 10)
  const agesOk = lt.every((x, i) => x.age === t.dayunTracks[0].startAge + i)
  check('流年虚岁逐年+1', agesOk)

  // 全量流年中至少能检出一处 岁运并临 或 伏吟（大运算例，验证扫描接得上）
  let sawBinglin = false
  for (let i = 0; i < t.dayunTracks.length; i++) {
    for (const y of buildLiunianTracks(person, r, i)) {
      if (hasKind(y.facts, '岁运并临')) { sawBinglin = true; break }
    }
    if (sawBinglin) break
  }
  check('存在可检出的岁运并临（干支重叠年）', sawBinglin)

  // 关键节点/披露齐备
  check('关键节点≤25', t.keyMoments.length <= 25)
  check('披露≥6条口径', t.disclosure.length >= 6)
  check('queryYear 注入生效', t.queryYear === 2026)
}

// ============================================================
// ④ 确定性：nowYear 变化只影响 isCurrent，不改变干支/年份结构
// ============================================================
console.log('▸ 纯函数性')
{
  const person: PersonInfo = {
    name: 'x', gender: '女', birthYear: 1990, birthMonth: 6, birthDay: 15,
    birthHour: 10, birthMinute: 0, birthPlace: '北京', longitude: 116.4,
  }
  const r = analyzeSixiang(person)
  const a = analyzeTrajectory(person, r, { nowYear: 2000 })
  const b = analyzeTrajectory(person, r, { nowYear: 2030 })
  check('干支结构不随查询年漂移',
    JSON.stringify(a.dayunTracks.map(d => d.ganzhi)) === JSON.stringify(b.dayunTracks.map(d => d.ganzhi)))
  const curA = a.dayunTracks.findIndex(d => d.isCurrent)
  const curB = b.dayunTracks.findIndex(d => d.isCurrent)
  check('现行大运随查询年推进', curB >= curA && curB !== curA)
}

console.log(`\n${fail === 0 ? '✅' : '❌'} 人生轨迹回归：通过 ${pass} / 失败 ${fail}`)
if (fail > 0) process.exit(1)
