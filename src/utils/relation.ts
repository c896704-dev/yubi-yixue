/**
 * 干支关系表 + 「外部干支（大运/流年/岁运）× 带标签目标（四柱/三垣/胎息）」扫描原语
 *
 * 与 chonghe.ts 的集合语义分析（getChongHeAnalysis，只吃 natal 四支）互补：
 * 岁运分析必须区分"谁引动谁"，故本模块只配 (外部, 目标) 对，natal↔natal 绝不在此配对，
 * 从结构上杜绝把原局内部关系重复计入岁运。
 * 关系表由本模块持有并导出，chonghe.ts 反向 import（零行为变化重构）。
 */

import type { HeavenlyStem, EarthlyBranch } from '../constants'

// ============================================================
// 地支关系表（原 chonghe.ts 私表，提为共享导出）
// ============================================================

export const LIU_HE: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

/** 三合局（申子辰水/亥卯未木/寅午戌火/巳酉丑金）；中神=索引1，半合须含中神 */
export const SAN_HE: EarthlyBranch[][] = [
  ['申', '子', '辰'], // 水局
  ['亥', '卯', '未'], // 木局
  ['寅', '午', '戌'], // 火局
  ['巳', '酉', '丑'], // 金局
]

export const SAN_HUI: EarthlyBranch[][] = [
  ['寅', '卯', '辰'], // 东方木
  ['巳', '午', '未'], // 南方火
  ['申', '酉', '戌'], // 西方金
  ['亥', '子', '丑'], // 北方水
]

export const LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

export const LIU_HAI: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

// 相刑（典籍正名：寅巳申=无恩之刑；丑戌未=恃势之刑；子卯=无礼之刑；自刑=辰午酉亥）
export const WU_LI_XING: [EarthlyBranch, EarthlyBranch][] = [['子', '卯']]
export const WU_EN_XING: EarthlyBranch[] = ['寅', '巳', '申']
export const CHI_SHI_XING: EarthlyBranch[] = ['丑', '戌', '未']
export const ZI_XING: EarthlyBranch[] = ['辰', '午', '酉', '亥']

/** 六破（冲之轻者）：寅亥、巳申既合又破 */
export const LIU_PO: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['戌', '未'],
]

/** 四库对冲（库门冲开）：辰↔戌、丑↔未 */
export const MU_KU_CHONG: Record<'辰' | '戌' | '丑' | '未', '辰' | '戌' | '丑' | '未'> = {
  '辰': '戌', '戌': '辰', '丑': '未', '未': '丑',
}

// ============================================================
// 天干关系表
// ============================================================

export const GAN_WU_HE: Partial<Record<`${HeavenlyStem}${HeavenlyStem}`, string>> = {
  '甲己': '甲己合土', '己甲': '甲己合土',
  '乙庚': '乙庚合金', '庚乙': '乙庚合金',
  '丙辛': '丙辛合水', '辛丙': '丙辛合水',
  '丁壬': '丁壬合木', '壬丁': '丁壬合木',
  '戊癸': '戊癸合火', '癸戊': '戊癸合火',
}

export const GAN_CHONG: Partial<Record<`${HeavenlyStem}${HeavenlyStem}`, string>> = {
  '甲庚': '甲庚相冲', '庚甲': '甲庚相冲',
  '乙辛': '乙辛相冲', '辛乙': '乙辛相冲',
  '丙壬': '丙壬相冲', '壬丙': '丙壬相冲',
  '丁癸': '丁癸相冲', '癸丁': '丁癸相冲',
}

// ============================================================
// 谓词
// ============================================================

const inPairs = (pairs: [EarthlyBranch, EarthlyBranch][], a: EarthlyBranch, b: EarthlyBranch) =>
  pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))

export const isBranchChong = (a: EarthlyBranch, b: EarthlyBranch) => inPairs(LIU_CHONG, a, b)
export const isBranchHe = (a: EarthlyBranch, b: EarthlyBranch) => inPairs(LIU_HE, a, b)
export const isBranchHai = (a: EarthlyBranch, b: EarthlyBranch) => inPairs(LIU_HAI, a, b)
export const isBranchPo = (a: EarthlyBranch, b: EarthlyBranch) => inPairs(LIU_PO, a, b)
export const isStemHe = (a: HeavenlyStem, b: HeavenlyStem) => !!GAN_WU_HE[`${a}${b}`]
export const isStemChong = (a: HeavenlyStem, b: HeavenlyStem) => !!GAN_CHONG[`${a}${b}`]
/** 反吟=天干相冲（阳一对、阴阳一对，冲即克）且地支六冲；仅支冲不反吟 */
export const isFanYin = (aStem: HeavenlyStem, aBranch: EarthlyBranch, bStem: HeavenlyStem, bBranch: EarthlyBranch) =>
  isStemChong(aStem, bStem) && isBranchChong(aBranch, bBranch)

// ============================================================
// 岁运扫描：外部干支 × 带标签目标
// ============================================================

export type FactTargetLabel =
  | '年支' | '月支' | '日支' | '时支'
  | '胎元' | '命宫' | '身宫' | '胎息'

export interface FactTarget {
  branch: EarthlyBranch
  label: FactTargetLabel
}

export type FactKind =
  | '伏吟' | '反吟' | '天合地冲' | '天冲地合' | '双合'
  | '六冲' | '六合' | '六害' | '六破'
  | '三合' | '半合' | '拱局'
  | '无礼之刑' | '无恩之刑' | '恃势之刑' | '自刑'
  | '干合日主' | '五合' | '天干四冲' | '天干比叠'
  | '岁运并临' | '空亡' | '入墓' | '冲开墓库' | '藏干透出'

/** 事实权重：排序进 AI prompt / 关键节点用（越大越重） */
export const FACT_WEIGHT: Record<FactKind, number> = {
  '伏吟': 9, '反吟': 9, '天合地冲': 8, '天冲地合': 8, '双合': 6,
  '六冲': 7, '三合': 6, '自刑': 6, '干合日主': 6, '天干四冲': 6,
  '岁运并临': 9, '冲开墓库': 7, '空亡': 7,
  '无恩之刑': 5, '恃势之刑': 5, '无礼之刑': 5, '六合': 5, '入墓': 5,
  '半合': 4, '六害': 4, '五合': 4, '藏干透出': 4, '天干比叠': 3, '拱局': 2, '六破': 2,
}

export interface Fact {
  kind: FactKind
  /** 被作用的目标标签（年支/日支/大运支…），折叠时多条并一 */
  targets: string[]
  desc: string
  weight: number
}

const pushFact = (facts: Fact[], kind: FactKind, targets: string[], desc: string) =>
  facts.push({ kind, targets, desc, weight: FACT_WEIGHT[kind] })

/**
 * 外部地支（大运支/流年支）对带标签目标支的关系扫描。
 * 只配 (ext, target)：目标之间（natal↔natal、natal↔三垣）不在这里配。
 * 同 kind 命中多个目标自动折叠为一条（伏吟叠见力量加倍）。
 */
export function scanBranchExt(
  ext: EarthlyBranch,
  targets: FactTarget[],
): Fact[] {
  const facts: Fact[] = []
  const labelOf = (b: EarthlyBranch) => targets.filter(t => t.branch === b).map(t => t.label)

  // 伏吟（含自刑支：辰午酉亥见双，既是伏吟又是自刑——古籍两义并存，都保留）
  const fuyinLabels = labelOf(ext)
  if (fuyinLabels.length > 0) {
    pushFact(facts, '伏吟', fuyinLabels,
      `外部${ext}与${fuyinLabels.join('、')}同字伏吟${fuyinLabels.length > 1 ? '（叠见，力量加倍）' : ''}`)
    if (ZI_XING.includes(ext)) {
      pushFact(facts, '自刑', fuyinLabels, `${ext}与${fuyinLabels.join('、')}双${ext}自刑——主自寻烦恼、内部消耗`)
    }
  }

  const singles: [FactKind, (a: EarthlyBranch, b: EarthlyBranch) => boolean, string][] = [
    ['六冲', isBranchChong, '六冲——主变动冲击'],
    ['六合', isBranchHe, '六合——主牵绊和合'],
    ['六害', isBranchHai, '六害——主暗中损耗'],
    ['六破', isBranchPo, '六破——冲之轻者，关系浅动'],
  ]
  for (const [kind, pred, word] of singles) {
    const hit = [...new Set(targets.filter(t => t.branch !== ext && pred(ext, t.branch)).map(t => t.label))]
    if (hit.length > 0) pushFact(facts, kind, hit, `${ext}与${hit.join('、')}${word}`)
  }

  // 三合局/半合/拱局：ext 必须参与
  const elemName = ['水', '木', '火', '金']
  for (let i = 0; i < SAN_HE.length; i++) {
    const bureau = SAN_HE[i]!
    if (!bureau.includes(ext)) continue
    const elem = elemName[i]!
    const mates = [...new Set(targets.filter(t => t.branch !== ext && bureau.includes(t.branch)).map(t => t.branch))]
    if (mates.length === 0) continue
    const full = mates.length === 2
    const hasMid = bureau[1] === ext ? true : mates.includes(bureau[1]!)
    const kind: FactKind = full ? '三合' : hasMid ? '半合' : '拱局'
    const involved = [...new Set(targets.filter(t => t.branch === ext || mates.includes(t.branch)).map(t => t.label))]
    const label = full ? `${bureau.join('')}三合${elem}局成局（外部${ext}凑齐）`
      : hasMid ? `${ext}与${mates.join('')}半合${elem}局（合而不化，须引化方真）`
        : `${ext}与${mates.join('')}拱${elem}局（虚位待合，力量最轻）`
    pushFact(facts, kind, involved, label)
  }

  // 三刑：ext 为引动者， natal 侧至少一位同组异支
  const xingGroups: [FactKind, EarthlyBranch[], string][] = [
    ['无恩之刑', WU_EN_XING, '无恩之刑（寅巳申）——主知恩不报、易有官讼'],
    ['恃势之刑', CHI_SHI_XING, '恃势之刑（丑戌未）——主恃势凌人、易生纠纷'],
  ]
  for (const [kind, group, word] of xingGroups) {
    if (!group.includes(ext)) continue
    const mates = [...new Set(targets.filter(t => t.branch !== ext && group.includes(t.branch)).map(t => t.label))]
    if (mates.length > 0) pushFact(facts, kind, mates, `外部${ext}引动${mates.join('、')}成${word}`)
  }
  for (const [a, b] of WU_LI_XING) {
    let mateLabels: string[] = []
    if (ext === a) mateLabels = labelOf(b)
    else if (ext === b) mateLabels = labelOf(a)
    if (mateLabels.length > 0) pushFact(facts, '无礼之刑', mateLabels, `外部${ext}与${mateLabels.join('、')}成无礼之刑（子卯）——主口舌是非、以下犯上`)
  }

  return facts.sort((x, y) => y.weight - x.weight)
}

/** 外部天干对日主与四干 */
export function scanStemExt(
  ext: HeavenlyStem,
  dayStem: HeavenlyStem,
  natalStems: { stem: HeavenlyStem; label: string }[],
): Fact[] {
  const facts: Fact[] = []
  if (isStemHe(ext, dayStem)) {
    pushFact(facts, '干合日主', ['日主'], `${ext}合日主${dayStem}（${GAN_WU_HE[`${ext}${dayStem}`]}）——古法：日干合太岁为晦气，主牵绊、志难伸`)
  }
  if (isStemChong(ext, dayStem)) {
    pushFact(facts, '天干四冲', ['日主'], `${ext}冲克日主${dayStem}——岁干犯身，主压力官非（身弱者尤慎）`)
  }
  for (const t of natalStems) {
    if (t.label === '日主') continue
    if (isStemHe(ext, t.stem)) pushFact(facts, '五合', [t.label], `外部${ext}与${t.label}${t.stem}五合（${GAN_WU_HE[`${ext}${t.stem}`]}）——合绊该柱`)
    else if (isStemChong(ext, t.stem)) pushFact(facts, '天干四冲', [t.label], `外部${ext}与${t.label}${t.stem}天干相冲`)
    else if (ext === t.stem) pushFact(facts, '天干比叠', [t.label], `外部${ext}与${t.label}${t.stem}同字——该柱十神力量叠加`)
  }
  return facts
}

/** 整柱对整柱（岁运柱 × 原局柱/三垣柱）：伏吟/反吟/天合地冲/天冲地合/双合 */
export interface ZhuTarget {
  ganzhi: string
  label: string
}

export function scanZhuExt(
  extGanzhi: string,
  targets: ZhuTarget[],
): Fact[] {
  const facts: Fact[] = []
  if (extGanzhi.length !== 2) return facts
  const extStem = extGanzhi.charAt(0) as HeavenlyStem
  const extBranch = extGanzhi.charAt(1) as EarthlyBranch
  for (const t of targets) {
    if (t.ganzhi.length !== 2) continue
    const s = t.ganzhi.charAt(0) as HeavenlyStem
    const b = t.ganzhi.charAt(1) as EarthlyBranch
    if (s === extStem && b === extBranch) pushFact(facts, '伏吟', [t.label], `岁运${extGanzhi}与${t.label}${t.ganzhi}干支全同（伏吟）`)
    else if (isFanYin(extStem, extBranch, s, b)) pushFact(facts, '反吟', [t.label], `岁运${extGanzhi}与${t.label}${t.ganzhi}天干冲、地支冲（反吟/天克地冲）`)
    else if (isStemHe(extStem, s) && isBranchChong(extBranch, b)) pushFact(facts, '天合地冲', [t.label], `岁运${extGanzhi}与${t.label}${t.ganzhi}天合地冲——先顺后逆，合中带冲`)
    else if (isStemChong(extStem, s) && isBranchHe(extBranch, b)) pushFact(facts, '天冲地合', [t.label], `岁运${extGanzhi}与${t.label}${t.ganzhi}天冲地合——先逆后顺，败中有成`)
    else if (isStemHe(extStem, s) && isBranchHe(extBranch, b)) pushFact(facts, '双合', [t.label], `岁运${extGanzhi}与${t.label}${t.ganzhi}天地双合——主牵绊，动不如静`)
  }
  return facts
}
