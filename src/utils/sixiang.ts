/**
 * 四象三垣胎息识人术引擎
 *
 * 四象 = 四柱纳音（少年/青年/中年/晚年四段人生画面）
 * 三垣 = 胎元、命宫、身宫（纳音）——胎元看遗传本能禀赋、命宫看立身舞台、身宫看落地果实
 * 胎息 = 日柱干合支合之柱（受胎之日先天神识/元神），只对标时柱纳音
 *
 * 体系依据：《三命通会·论纳音取象》、《兰台妙选》胎息古法（干合支合）、
 * 紫微式命宫身宫安法（寅起正月顺数生月；命宫逆数生时、身宫顺数生时；宫干年干五虎遁）。
 * 与八字主引擎同口径：真太阳时校准 + 晚子时日柱进位（sect=1）。
 */

import { Solar } from 'lunar-typescript'
import type { PersonInfo } from '../types'
import { EARTHLY_BRANCHES } from '../constants'
import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../constants'
import { calculateBazi } from './bazi'
import { getTaiYuan, getMingGongStem } from './chonghe'
import { getTrueSolarHourBranch } from './solarTime'
import { NAYIN_XIANG, getTaiXi, type NaYinXiang } from './nayinXiang'
import { generates, controls } from './interaction'

/** 纳音五行 */
export function getNaYinElem(name: string): FiveElement | null {
  return NAYIN_XIANG[name]?.elem ?? null
}

// ============================================================
// 尊卑关系（年→月→日→时相邻对，上为尊、下为卑）
// ============================================================

export type ZunBeiKind = '尊克卑' | '卑生尊' | '尊生卑' | '卑克尊' | '比和'

export const ZUN_BEI_DESC: Record<ZunBeiKind, string> = {
  '尊克卑': '尊克卑为顺——前一阶段规制后一阶段，人活在规矩里，根基扎实，不是木讷之从，而是被规顺得扎实',
  '卑生尊': '卑生尊为反哺进献之象——后一阶段心甘情愿反哺前缘，回归家庭、付出自己，不是忘本之人',
  '尊生卑': '尊生卑为支持施恩于下之象——前一阶段恩泽滋养后一阶段，造化自身，福荫绵延',
  '卑克尊': '卑克尊为以下犯上，全盘最割裂之象——后一阶段冲撞反抗前一阶段，规制与自我互相拉扯',
  '比和': '两象同气比和——阶段之间平顺衔接，气质一贯，无大冲突',
}

/** 尊卑生克判定：zun=尊位纳音五行（前柱），bei=卑位纳音五行（后柱） */
export function getZunBei(zunElem: FiveElement, beiElem: FiveElement): ZunBeiKind {
  if (zunElem === beiElem) return '比和'
  if (controls(zunElem, beiElem)) return '尊克卑'
  if (generates(beiElem, zunElem)) return '卑生尊'
  if (generates(zunElem, beiElem)) return '尊生卑'
  return '卑克尊'
}

// ============================================================
// 三垣起法
// ============================================================

/** 紫微式命宫身宫（依示范盘反推的对称起法）：
 *  寅起正月顺数农历月得月宫；命宫 = 月宫逆数时支序（子=1、丑=2…亥=12），
 *  身宫 = 月宫顺数同一距离；宫干年干五虎遁。
 *  示范盘（甲申年农历二月丑时）：月宫卯 → 命宫丑（丁丑涧下水）、身宫巳（己巳大林木）✓ */
export function getMingGongShenGong(
  yearStem: HeavenlyStem,
  lunarMonth: number,
  hourBranch: EarthlyBranch,
): { mingGong: string; shenGong: string; yueGong: string } {
  const yueGongIdx = (2 + lunarMonth - 1) % 12 // 寅(idx2)起正月
  const hourN = EARTHLY_BRANCHES.indexOf(hourBranch) + 1 // 时支序 1-based
  const mingGongIdx = ((yueGongIdx - hourN) % 12 + 12) % 12
  const shenGongIdx = (yueGongIdx + hourN) % 12
  const mingGongBranch = EARTHLY_BRANCHES[mingGongIdx]!
  const shenGongBranch = EARTHLY_BRANCHES[shenGongIdx]!
  return {
    yueGong: EARTHLY_BRANCHES[yueGongIdx]!,
    mingGong: getMingGongStem(yearStem, mingGongBranch) + mingGongBranch,
    shenGong: getMingGongStem(yearStem, shenGongBranch) + shenGongBranch,
  }
}

// ============================================================
// 结构化结果
// ============================================================

const STAGE_DEFS: { label: string; stageName: string; stageDesc: string }[] = [
  { label: '年柱', stageName: '少年心性', stageDesc: '少年心性与祖业环境，看开局与不羁的作业环境' },
  { label: '月柱', stageName: '青年境遇', stageDesc: '青年境遇与人格初成，看认知如何确定为自己的生存法则' },
  { label: '日柱', stageName: '中年处境', stageDesc: '中年处境与婚姻人际，看世界法则磨砺下的三观与自我' },
  { label: '时柱', stageName: '晚年结局', stageDesc: '晚年的世俗结局与归宿，甚至可以说是一种元神的任务——某一时机被唤醒的终极追求' },
]

export interface SixiangStage {
  label: string
  ganzhi: string
  naYin: string
  stageName: string
  stageDesc: string
  xiang: NaYinXiang
}

export interface YuanInfo {
  name: string
  ganzhi: string
  naYin: string
  xiang: NaYinXiang
  role: string
}

export interface ZunBeiPair {
  from: string
  to: string
  kind: ZunBeiKind
  desc: string
}

export interface CrossPair {
  name: string
  kind: '相生' | '相克' | '比和'
  desc: string
}

export interface SixiangResult {
  stages: SixiangStage[]
  zunBei: ZunBeiPair[]
  hasFanShang: boolean
  overall: string
  sanyuan: {
    taiYuan: YuanInfo
    mingGong: YuanInfo
    shenGong: YuanInfo
    lianZhu: '三垣连珠' | '半生半克' | '三垣交战'
    desc: string
    notes: string[]
  }
  taiXi: {
    ganzhi: string
    naYin: string
    xiang: NaYinXiang
    duibiao: { kind: ZunBeiKind; band: string; desc: string }
  }
  cross: CrossPair[]
  summary: string[]
}

/** 胎息对标时柱：元神与人生终点气质的契合五档 */
function getDuibiao(taiXiElem: FiveElement, hourElem: FiveElement): { kind: ZunBeiKind; band: string; desc: string } {
  const kind = getZunBei(taiXiElem, hourElem)
  const map: Record<ZunBeiKind, { band: string; desc: string }> = {
    '比和': { band: '高（约90%）', desc: '元神与时柱同气，心神合一——终点即是元神本相，人生越走越像受胎之日的那一念' },
    '卑生尊': { band: '高（约80%）', desc: '时柱纳音生元神——现实终点反哺先天神识，每一次成果都在为元神成长赋能，越到后面越心神合一' },
    '尊生卑': { band: '中高（约70%）', desc: '元神滋养时柱——元神倾其禀赋成就世俗结局，晚年被先天志向推着走' },
    '尊克卑': { band: '中（约50%）', desc: '元神克制时柱——先天神识对世俗结局有所压制，理想与现实彼此拉扯，终点外显元神约半数' },
    '卑克尊': { band: '低（约30%）', desc: '时柱克元神——世俗结局磨耗先天神识，人生终点与受胎初心相悖，需主动回归元神本相' },
  }
  return { kind, ...map[kind]! }
}

/** 四象对三垣：先天禀赋与人生阶段的兼容性 */
function getCross(name: string, aElem: FiveElement, bElem: FiveElement): CrossPair {
  if (aElem === bElem) {
    return { name, kind: '比和', desc: '同气相求，先天禀赋与该人生阶段高度合一，无撕裂感' }
  }
  if (generates(aElem, bElem)) {
    return { name, kind: '相生', desc: '先天禀赋滋养这一人生阶段——如春雨润物，这是盘里最高的品级，命与自我合一，没有良知对抗利益的撕裂' }
  }
  if (generates(bElem, aElem)) {
    return { name, kind: '相生', desc: '这一人生阶段反哺先天禀赋——现实经历滋养元神成长，越经历越成全' }
  }
  if (controls(aElem, bElem)) {
    return { name, kind: '相克', desc: '先天禀赋克制这一人生阶段——年少天赋与环境冲突，开局难被全然理解，易生内向与自我拉扯' }
  }
  return { name, kind: '相克', desc: '人生阶段克制先天禀赋——现实磨耗天赋，需要学会在规训中保护本来的样子' }
}

/** 主入口：四象三垣胎息识人分析（与八字排盘同口径） */
export function analyzeSixiang(person: PersonInfo): SixiangResult {
  const bazi = calculateBazi(person)
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour]

  // 农历月（与排盘同口径：真太阳时跨日按校准后日期）
  const { dayOffset } = getTrueSolarHourBranch(
    person.birthHour, person.birthMinute, person.longitude,
    person.birthYear, person.birthMonth, person.birthDay,
  )
  const solarDate = Solar.fromYmd(person.birthYear, person.birthMonth, person.birthDay).next(dayOffset)
  const lunarMonth = Math.abs(solarDate.getLunar().getMonth())

  // ---- 四象 ----
  const stages: SixiangStage[] = pillars.map((p, i) => {
    const def = STAGE_DEFS[i]!
    const xiang = NAYIN_XIANG[p.naYin] ?? {
      name: p.naYin, ganzhi: [p.stem + p.branch], elem: p.stemElement,
      source: '', image: p.naYin, traits: [], yuanshen: p.naYin,
    } as unknown as NaYinXiang
    return {
      label: def.label,
      ganzhi: p.stem + p.branch,
      naYin: p.naYin,
      stageName: def.stageName,
      stageDesc: def.stageDesc,
      xiang,
    }
  })

  // ---- 尊卑链（年→月、月→日、日→时）----
  const zunBei: ZunBeiPair[] = []
  for (let i = 0; i < 3; i++) {
    const zunElem = stages[i]!.xiang.elem
    const beiElem = stages[i + 1]!.xiang.elem
    const kind = getZunBei(zunElem, beiElem)
    zunBei.push({
      from: stages[i]!.naYin,
      to: stages[i + 1]!.naYin,
      kind,
      desc: ZUN_BEI_DESC[kind],
    })
  }
  const hasFanShang = zunBei.some(z => z.kind === '卑克尊')
  const overall = hasFanShang
    ? `全盘出现${zunBei.filter(z => z.kind === '卑克尊').length}处"卑克尊"（以下犯上）——人生存在阶段间的割裂与反叛，行运需防冲突激化。`
    : '以年为尊、以时为卑，从头到尾未出现"卑克尊"（以下犯上）——全盘相生相制、没有冲克，人生阶段承续有序，整体气象浑成。'

  // ---- 三垣 ----
  const taiYuanP = getTaiYuan(bazi.month.stem, bazi.month.branch)
  const taiYuanGz = taiYuanP.stem + taiYuanP.branch
  const { mingGong: mingGongGz, shenGong: shenGongGz } = getMingGongShenGong(bazi.year.stem, lunarMonth, bazi.hour.branch)

  const mkYuan = (name: string, role: string, gz: string): YuanInfo => {
    const naYinName = getNaYinNameByGanzhi(gz)
    return {
      name, role, ganzhi: gz, naYin: naYinName,
      xiang: NAYIN_XIANG[naYinName] ?? {
        name: naYinName, ganzhi: [gz], elem: '土',
        source: '', image: naYinName, traits: [], yuanshen: naYinName,
      } as unknown as NaYinXiang,
    }
  }

  const taiYuan = mkYuan('胎元', '遗传、本能、禀赋——建侯本能量级，受胎之月的先天根基', taiYuanGz)
  const mingGongYuan = mkYuan('命宫', '立身舞台、精神追求——一生总趋向与灵魂安放之处', mingGongGz)
  const shenGong = mkYuan('身宫', '落地果实、后天所得——先天倾向在后天的归宿', shenGongGz)

  // 三垣连珠：胎元→命宫、命宫→身宫两段顺次相生
  const h1 = generates(taiYuan.xiang.elem, mingGongYuan.xiang.elem)
  const h2 = generates(mingGongYuan.xiang.elem, shenGong.xiang.elem)
  const k1 = controls(taiYuan.xiang.elem, mingGongYuan.xiang.elem) || controls(mingGongYuan.xiang.elem, taiYuan.xiang.elem)
  const k2 = controls(mingGongYuan.xiang.elem, shenGong.xiang.elem) || controls(shenGong.xiang.elem, mingGongYuan.xiang.elem)
  const lianZhu: SixiangResult['sanyuan']['lianZhu'] =
    h1 && h2 ? '三垣连珠' : k1 || k2 ? '三垣交战' : '半生半克'
  const sanyuanDesc = lianZhu === '三垣连珠'
    ? '三垣纳音顺次相生，谓之"三垣连珠"——主根深气脉贯通，本能、精神追求与后天所得同向而行，出厂自带的心神是合一的。'
    : lianZhu === '三垣交战'
      ? '三垣出现相克——出厂自带内核交战：理智知道该走哪条路，本能却时不时转向别处，这是一种根植底层的纠结度。'
      : '三垣半生半克——部分顺遂部分纠结，本能与现实偶尔打架，大体方向一致但有暗流。'
  const sanyuanNotes = [
    `${taiYuan.naYin}→${mingGongYuan.naYin}：${h1 ? '相生' : controls(taiYuan.xiang.elem, mingGongYuan.xiang.elem) || controls(mingGongYuan.xiang.elem, taiYuan.xiang.elem) ? '相克' : '无生克'}`,
    `${mingGongYuan.naYin}→${shenGong.naYin}：${h2 ? '相生' : controls(mingGongYuan.xiang.elem, shenGong.xiang.elem) || controls(shenGong.xiang.elem, mingGongYuan.xiang.elem) ? '相克' : '无生克'}`,
  ]

  // ---- 胎息（元神）----
  const dayGanzhi = bazi.day.stem + bazi.day.branch
  const taiXiGz = getTaiXi(dayGanzhi)
  const taiXiNaYin = getNaYinNameByGanzhi(taiXiGz)
  const taiXiXiang = NAYIN_XIANG[taiXiNaYin] ?? {
    name: taiXiNaYin, ganzhi: [taiXiGz], elem: '土',
    source: '', image: taiXiNaYin, traits: [], yuanshen: taiXiNaYin,
  } as unknown as NaYinXiang
  const duibiao = getDuibiao(taiXiXiang.elem, stages[3]!.xiang.elem)

  // ---- 四象对三垣 ----
  const cross: CrossPair[] = [
    getCross(`胎元${taiYuan.naYin}对年柱${stages[0]!.naYin}`, taiYuan.xiang.elem, stages[0]!.xiang.elem),
    getCross(`命宫${mingGongYuan.naYin}对日柱${stages[2]!.naYin}`, mingGongYuan.xiang.elem, stages[2]!.xiang.elem),
    getCross(`身宫${shenGong.naYin}对月柱${stages[1]!.naYin}`, shenGong.xiang.elem, stages[1]!.xiang.elem),
    getCross(`身宫${shenGong.naYin}对时柱${stages[3]!.naYin}`, shenGong.xiang.elem, stages[3]!.xiang.elem),
  ]

  // ---- summary ----
  const summary: string[] = [
    `四象：年柱${stages[0]!.naYin}（少年）· 月柱${stages[1]!.naYin}（青年）· 日柱${stages[2]!.naYin}（中年）· 时柱${stages[3]!.naYin}（晚年）`,
    ...zunBei.map(z => `${z.from}→${z.to}：${z.kind}`),
    `三垣：胎元${taiYuan.naYin} · 命宫${mingGongYuan.naYin} · 身宫${shenGong.naYin}（${lianZhu}）`,
    `胎息（元神）：${taiXiNaYin}，对标时柱${stages[3]!.naYin}——契合度${duibiao.band}`,
    overall,
  ]

  return {
    stages,
    zunBei,
    hasFanShang,
    overall,
    sanyuan: { taiYuan, mingGong: mingGongYuan, shenGong, lianZhu, desc: sanyuanDesc, notes: sanyuanNotes },
    taiXi: { ganzhi: taiXiGz, naYin: taiXiNaYin, xiang: taiXiXiang, duibiao },
    cross,
    summary,
  }
}

/** 干支 → 纳音名（复用八字引擎同款表） */
function getNaYinNameByGanzhi(gz: string): string {
  // 从 SIXTY_JIAZI_NAYIN 反查：直接 import 会引入循环依赖风险，这里独立小表
  // （30 组纳音 × 各自两个干支）
  for (const x of Object.values(NAYIN_XIANG)) {
    if (x.ganzhi.includes(gz)) return x.name
  }
  return gz
}
