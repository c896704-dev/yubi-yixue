/**
 * 命理分析报告生成器
 * 实现乾坤定盘、性格全息、健康五行、面相身形、智识天赋、家庭关系、运程长卷、判官直言八大模块
 */

export {
  renderPersonalityReport,
  renderHealthReport,
  renderAppearanceReport,
  renderIntelligenceReport,
  renderFamilyDeepReport,
  renderCareerReport,
  renderAllPersonaReports,
} from './persona'
import { analyzePersonality } from './persona'

import {
  HEAVENLY_STEMS, EARTHLY_BRANCHES,
  STEM_ELEMENT, STEM_YIN_YANG, BRANCH_ELEMENT,
  FIVE_ELEMENTS, HIDDEN_STEMS, ZODIAC,
  getTenGod,
} from '../constants'
import type { HeavenlyStem, EarthlyBranch, FiveElement, TenGod } from '../constants'
import type { BaziChart, Pillar, BigFortune, PersonInfo, AnalysisResult } from '../types'
import { calculateBazi, calculateBigFortunes, calculateElementDistribution, determineGeJu, isCongGe, isZhuanWangGe, isHuaQiGe } from './bazi'
import { getTrueSolarHourBranch } from './solarTime'
import { judgeBodyStrength, judgeClimate } from './wangshuai'
import { determineYongShen } from './yongshen'
import { calculateShenSha } from './shensha'
import { getChongHeAnalysis, getTaiYuan, getMingGong, getMingGongStem } from './chonghe'

const ELEM_SYMBOL: Record<FiveElement, string> = { '木': '🌳', '火': '🔥', '土': '⛰️', '金': '⚜️', '水': '💧' }
const ELEM_COLOR: Record<FiveElement, string> = { '木': '绿', '火': '红', '土': '黄', '金': '白', '水': '黑/蓝' }

// ============================================================
// 综合命局分析
// ============================================================

export function analyzePerson(person: PersonInfo): AnalysisResult {
  const bazi = calculateBazi(person)
  const bigFortunes = calculateBigFortunes(bazi, person)
  const fiveElementDistribution = calculateElementDistribution(bazi)

  // --- 新版引擎 ---

  // 1. 旺衰判定（多维度综合加权法：月令+根气+生助+三围生克+连锁惩罚+寒暖修正）
  const strengthDetail = judgeBodyStrength(bazi)

  // 2. 用神判定（四维加权：扶抑+调候+通关+病药）
  const yongShen = determineYongShen(bazi, strengthDetail, fiveElementDistribution)

  // 3. 格局判定（正八格 + 特殊格局）
  const geJu = determineGeJu(bazi)
  const specialGeJu = isCongGe(bazi, strengthDetail.totalScore)
    || isZhuanWangGe(bazi, fiveElementDistribution)
    || isHuaQiGe(bazi, fiveElementDistribution)
    || undefined

  // 4. 神煞（带上下文深度解读）
  const shenSha = calculateShenSha(
    bazi.dayMaster, bazi.year.stem,
    bazi.year.branch, bazi.month.branch,
    bazi.day.branch, bazi.hour.branch,
    `${bazi.day.stem}${bazi.day.branch}`,
    {
      dayMaster: bazi.dayMaster,
      monthGod: bazi.month.tenGod,
      favorableElements: [] as string[], // 先占位，后面填入
      unfavorableElements: [] as string[],
    },
  )

  // 5. 刑冲合害
  const chongHe = getChongHeAnalysis(
    bazi.year.branch, bazi.month.branch,
    bazi.day.branch, bazi.hour.branch,
  )

  // 6. 胎元命宫
  const taiYuan = getTaiYuan(bazi.month.stem, bazi.month.branch)
  const mingGongBranch = getMingGong(bazi.month.branch, bazi.hour.branch)
  const mingGongStem = getMingGongStem(bazi.year.stem, mingGongBranch)

  // 7. 寒暖燥湿
  const climateResult = judgeClimate(bazi, fiveElementDistribution)

  // 当前大运
  const currentAge = new Date().getFullYear() - person.birthYear
  const currentFortune = bigFortunes.find(f => currentAge >= f.startAge && currentAge <= f.endAge)

  // 兼容旧接口
  const warnings = generateWarnings(bazi, strengthDetail.strength)
  const summary = generateSummary(bazi, strengthDetail.strength, person)

  return {
    bazi,
    person,
    bigFortunes,
    currentFortune,
    summary,
    warnings,
    fiveElementDistribution,
    bodyStrength: strengthDetail.strength,
    favorableElements: yongShen.favorable,
    unfavorableElements: yongShen.unfavorable,
    geJu: specialGeJu || geJu,
    // 新增
    strengthDetail,
    yongShen,
    shenSha,
    chongHe,
    taiYuan,
    mingGong: { stem: mingGongStem, branch: mingGongBranch },
    climate: climateResult,
    specialGeJu,
  }
}

// ============================================================
// 格局定性
// ============================================================

function generateWarnings(bazi: BaziChart, strength: string): string[] {
  const warnings: string[] = []
  const dm = bazi.dayMaster
  const dmElem = STEM_ELEMENT[dm]

  // 枭神夺食检测
  const dayGod = bazi.day.tenGod
  const monthGod = bazi.month.tenGod
  if ((monthGod === '偏印' && dayGod === '食神') || (monthGod === '食神' && dayGod === '偏印')) {
    warnings.push('枭神夺食：月令偏印夺食神，智慧被压制，心性易压抑抑郁，做事优柔寡断')
  }

  // 财多身弱
  let caiCount = 0
  for (const p of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    if (p.tenGod === '正财' || p.tenGod === '偏财') caiCount++
  }
  if (caiCount >= 3 && strength === '身弱') {
    warnings.push('财多身弱：财旺而身不胜财，易因财致祸，有钱难守，健康受损')
  }

  // 偏枯检测
  const dist = calculateElementDistribution(bazi)
  const maxElem = Object.entries(dist).sort((a, b) => b[1] - a[1])[0]!
  if (maxElem[1] > 12) {
    warnings.push(`五行偏枯：${maxElem[0]}过旺，${maxElem[0]}对应的脏腑和运势需格外注意调理`)
  }

  // 日主无根
  const dayBranchElem = bazi.day.branchElement
  if (dayBranchElem !== dmElem && strength === '身弱') {
    warnings.push('日主无根：日支不载日主之气，命主一生漂泊感强，早年根基不稳')
  }

  return warnings
}

function generateSummary(bazi: BaziChart, strength: string, person: PersonInfo): string {
  const dm = bazi.dayMaster
  const dmElem = STEM_ELEMENT[dm]
  const dmYY = STEM_YIN_YANG[dm]
  const zodiac = ZODIAC[bazi.year.branch]
  const monthElem = bazi.month.branchElement

  const parts: string[] = []
  parts.push(`日主「${dm}」属${ELEM_SYMBOL[dmElem]}**${dmElem}**，${dmYY}性，生肖**${zodiac}**，月令**${bazi.month.branch}月**（${monthElem}旺）。`)
  parts.push(`经判官定盘，日主**${strength}**，以**${ELEM_SYMBOL[dmElem]}${dmElem}**为体。`)

  return parts.join('')
}

// ============================================================
// 0. 排盘方法论说明
// ============================================================

function renderPaipanDisclaimer(person: PersonInfo, bazi: BaziChart): string {
  const { birthYear, birthMonth, birthDay, birthHour, birthMinute, longitude } = person
  const originalTime = `${String(birthHour).padStart(2, '0')}:${String(birthMinute).padStart(2, '0')}`

  const { actualHour, actualMinute } = getTrueSolarHourBranch(birthHour, birthMinute, longitude)
  const solarTime = `${String(actualHour).padStart(2, '0')}:${String(actualMinute).padStart(2, '0')}`

  // 检查是否处于子时（23:00-01:00）
  const isZiShi = birthHour === 23 || birthHour === 0

  // 计算不使用真太阳时时柱会是什么
  // 时柱由日干+时辰地支决定，时辰地支由北京时间直接计算
  const beijingHourBranch = Math.floor(((birthHour + 1) % 24) / 2)
  const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const altHourBranch = BRANCH_NAMES[beijingHourBranch]!

  // 五鼠遁计算时干
  const HOUR_STEM_MAP: Record<string, string[]> = {
    '甲': ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
    '乙': ['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
    '丙': ['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
    '丁': ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
    '戊': ['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
    '己': ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
    '庚': ['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
    '辛': ['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
    '壬': ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
    '癸': ['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  }
  const altHourStem = HOUR_STEM_MAP[bazi.dayMaster]?.[beijingHourBranch] ?? '?'

  const lines: string[] = []
  lines.push('### 🔍 排盘方法论说明\n')
  lines.push('> 本报告在排盘时做了以下选择，不同流派有不同处理方式，特此说明：\n')

  // 真太阳时说明
  if (longitude !== 120) {
    const diff = Math.abs(longitude - 120).toFixed(1)
    const dir = longitude > 120 ? '西' : '东'
    lines.push(`> - **真太阳时校准：** 出生时间 ${originalTime}（北京时间），经度 ${longitude}°E（与120°E相差${diff}°→约${Math.round(parseFloat(diff) * 4)}分钟），校准后真太阳时为 **${solarTime}**。时柱为「${bazi.hour.stem}${bazi.hour.branch}」。`)
    lines.push(`> - **若不使用真太阳时：** 时柱将为「${altHourStem}${altHourBranch}」。命理学界对此尚无统一标准，两种方法均有大量实践者。`)
  } else {
    lines.push(`> - **真太阳时：** 出生地经度接近120°E，无需校准。`)
  }

  // 子时说明
  if (isZiShi) {
    lines.push(`> - **子时处理：** 出生时间位于子时（23:00-01:00），当前采用常规子时法。不同流派对子时换日有不同处理（如晚子时法、子初换日法等），日柱可能不同。若命理与实际不符，可尝试其他子时处理方式对比验证。`)
  }

  lines.push('')
  return lines.join('\n')
}

// ============================================================
// 1. 乾坤定盘 报告
// ============================================================

export function renderFundamentalReport(result: AnalysisResult): string {
  const { bazi, person, fiveElementDistribution, bodyStrength, geJu, warnings, favorableElements, unfavorableElements } = result

  let md = '## 一、乾坤定盘 (Fundamental Analysis)\n\n'

  // 警示录
  if (warnings.length > 0) {
    md += '> **【⚠️ 警示录】** 判官直言，此局有不可忽视之偏枯/刑冲，切勿讳疾忌医。\n>\n'
    for (const w of warnings) {
      md += `> - ⚠️ ${w}\n`
    }
    md += '\n'
  }

  // 八字排盘表格
  md += '### 📅 八字排盘\n\n'
  md += '| 柱位 | 天干 | 地支 | 藏干 | 十神 | 纳音 | 五行 |\n'
  md += '|:---|:---|:---|:---|:---|:---|:---|\n'

  const pillars: [string, Pillar][] = [
    ['**年柱**', bazi.year],
    ['**月柱**', bazi.month],
    ['**日柱**', bazi.day],
    ['**时柱**', bazi.hour],
  ]

  for (const [label, p] of pillars) {
    const hs = p.hiddenStems.join('、')
    md += `| ${label} | **${p.stem}** | **${p.branch}** | ${hs} | ${p.tenGod} | ${p.naYin} | ${ELEM_SYMBOL[p.stemElement]}${p.stemElement}/${ELEM_SYMBOL[p.branchElement]}${p.branchElement} |\n`
  }

  md += `\n> **判官批语：** 日主 **${bazi.dayMaster}**（${ELEM_SYMBOL[STEM_ELEMENT[bazi.dayMaster]]}${STEM_ELEMENT[bazi.dayMaster]}），生于${bazi.month.branch}月，为 **${geJu}**。\n\n`

  // 排盘方法论说明
  md += renderPaipanDisclaimer(person, bazi)

  // 格局定性
  md += '### ⚖️ 格局定性\n\n'
  md += `| 属性 | 判定 |\n|:---|:---|\n`
  md += `| **身强/身弱** | ${bodyStrength} |\n`
  md += `| **格局** | ${geJu} |\n`
  md += `| **喜用神** | ${favorableElements.map(e => ELEM_SYMBOL[e] + e).join('、')} |\n`
  md += `| **忌神** | ${unfavorableElements.map(e => ELEM_SYMBOL[e] + e).join('、')} |\n`

  md += '\n'

  // 五行能量文本柱状图
  md += '### 🔢 五行能量分布\n\n'
  md += '```\n'
  const maxVal = Math.max(...Object.values(fiveElementDistribution), 1)
  for (const elem of FIVE_ELEMENTS) {
    const val = fiveElementDistribution[elem]
    const barLen = Math.round((val / maxVal) * 30)
    const bar = '█'.repeat(barLen)
    md += `${ELEM_SYMBOL[elem]} ${elem}  ${bar} ${val.toFixed(1)}\n`
  }
  md += '```\n\n'

  // 旺衰详细
  md += '### 📊 旺衰判定（多维度综合加权法）\n\n'
  md += `> **结论：** ${result.bodyStrength}（总分：${result.strengthDetail.totalScore >= 0 ? '+' : ''}${result.strengthDetail.totalScore.toFixed(1)}）\n>\n`
  md += '> **评分方法：** 月令旺衰(±3) + 地支根气(0~+4) + 天干生助(±5) + 三围生克(±3) + 连锁惩罚(-0~-3) + 寒暖修正(±1)\n\n'
  md += '| 维度 | 得分 | 说明 |\n|:---|:---|:---|\n'
  md += `| 月令旺衰 | ${result.strengthDetail.monthScore} | ${result.bazi.month.branch}月·${getWangXiangDesc(result.bazi.dayMaster, result.bazi.month.branch)} |\n`
  md += `| 地支根气 | +${result.strengthDetail.rootScore.toFixed(1)} | ${result.strengthDetail.rootDetails.map(d => d.rootType).join('、') || '无根'} |\n`
  md += `| 天干生助 | ${result.strengthDetail.helpScore >= 0 ? '+' : ''}${result.strengthDetail.helpScore} | 比劫印星天干透出 |\n`
  md += `| 三围生克 | ${result.strengthDetail.surroundScore >= 0 ? '+' : ''}${result.strengthDetail.surroundScore} | 月干+日支+时干 |\n`
  if (result.strengthDetail.chainPenalty !== 0) md += `| 连锁惩罚 | ${result.strengthDetail.chainPenalty} | 生助忌神自动扣分 |\n`
  if (result.strengthDetail.coldPenalty !== 0) md += `| 寒暖修正 | ${result.strengthDetail.coldPenalty} | 冬火减力/夏水减力 |\n`
  md += '\n'

  // 用神详细
  md += '### 🎯 用神体系（四维加权）\n\n'
  md += '| 用神维度 | 五行 |\n|:---|:---|\n'
  md += `| 扶抑用神 | ${result.yongShen.fuYi.join('、')} |\n`
  md += `| 调候用神 | ${result.yongShen.tiaoHou.join('、')}（天干：${result.yongShen.tiaoHouStems.join('、')}）|\n`
  md += `| 通关用神 | ${result.yongShen.tongGuan.length > 0 ? result.yongShen.tongGuan.join('、') : '无'} |\n`
  md += `| 病药用神 | ${result.yongShen.bingYao.length > 0 ? result.yongShen.bingYao.join('、') : '无'} |\n`
  md += '\n'

  // 格局
  if (result.specialGeJu) {
    md += `> **特殊格局：** ⚠️ 此命为「**${result.specialGeJu}**」，非寻常格局，论断需格外谨慎。\n\n`
  }

  // 寒暖燥湿
  md += `**寒暖燥湿：** ${result.climate.label === '寒' ? '❄️ 寒局，需火调候' : result.climate.label === '暖' ? '☀️ 暖局，需水调候' : result.climate.label === '燥' ? '🔥 燥局，需水润泽' : result.climate.label === '湿' ? '💧 湿局，需火暖局' : '✅ 气候中和'}（暖度${result.climate.warmthScore} / 湿度${result.climate.humidityScore}）${result.climate.needTiaoHou ? ' ⚠️需调候' : ''} | **胎元：** ${result.taiYuan.stem}${result.taiYuan.branch} | **命宫：** ${result.mingGong.stem}${result.mingGong.branch}\n\n`

  // 神煞
  md += '### 🔮 神煞一览\n\n'
  if (result.shenSha.all.length > 0) {
    md += '| 神煞 | 类型 | 所在 | 含义 |\n|:---|:---|:---|:---|\n'
    for (const s of result.shenSha.all) {
      const typeIcon = s.type === '吉' ? '✅' : s.type === '凶' ? '⚠️' : '🔵'
      md += `| ${s.name} | ${typeIcon}${s.type} | ${s.pillar} | ${s.description} |\n`
    }
    md += '\n'
  } else {
    md += '命局无明显神煞配置。\n\n'
  }

  // 刑冲合害
  md += '### ⚡ 刑冲合害\n\n'
  if (result.chongHe.summary.length > 0) {
    for (const s of result.chongHe.summary) {
      md += `- ${s}\n`
    }
    md += '\n'
  } else {
    md += '命局地支平和，无明显刑冲合害。\n\n'
  }

  return md
}

function getWangXiangDesc(dayMaster: HeavenlyStem, monthBranch: EarthlyBranch): string {
  const elem = STEM_ELEMENT[dayMaster]
  const map: Record<EarthlyBranch, Record<FiveElement, string>> = {
    '寅': { '木': '木旺', '火': '火相', '土': '土死', '金': '金囚', '水': '水休' },
    '卯': { '木': '木旺', '火': '火相', '土': '土死', '金': '金囚', '水': '水休' },
    '辰': { '木': '木休', '火': '火休', '土': '土旺', '金': '金相', '水': '水死' },
    '巳': { '木': '木休', '火': '火旺', '土': '土相', '金': '金死', '水': '水囚' },
    '午': { '木': '木休', '火': '火旺', '土': '土相', '金': '金死', '水': '水囚' },
    '未': { '木': '木囚', '火': '火休', '土': '土旺', '金': '金相', '水': '水死' },
    '申': { '木': '木死', '火': '火囚', '土': '土休', '金': '金旺', '水': '水相' },
    '酉': { '木': '木死', '火': '火囚', '土': '土休', '金': '金旺', '水': '水相' },
    '戌': { '木': '木囚', '火': '火休', '土': '土旺', '金': '金相', '水': '水死' },
    '亥': { '木': '木相', '火': '火死', '土': '土囚', '金': '金休', '水': '水旺' },
    '子': { '木': '木相', '火': '火死', '土': '土囚', '金': '金休', '水': '水旺' },
    '丑': { '木': '木囚', '火': '火休', '土': '土旺', '金': '金相', '水': '水死' },
  }
  return map[monthBranch]?.[elem] ?? '未知'
}

// ============================================================
// 2. 六亲缘分 报告
// ============================================================

export function renderFamilyReport(result: AnalysisResult): string {
  const { bazi, person } = result

  let md = '## 二、六亲缘分 (Family & Ancestry)\n\n'

  // 年柱 = 祖辈
  md += '### 🏛️ 祖荫分析\n\n'
  const yearStem = bazi.year.stem
  const yearBranch = bazi.year.branch
  const yearElem = STEM_ELEMENT[yearStem]

  const yearTenGod = bazi.year.tenGod
  if (yearTenGod === '正印' || yearTenGod === '偏印') {
    md += `年柱**${yearStem}${yearBranch}**为印星坐守，主祖辈有一定文化底蕴或田产传承，原生家庭对命主的精神滋养较为充足。\n\n`
  } else if (yearTenGod === '正财' || yearTenGod === '偏财') {
    md += `年柱**${yearStem}${yearBranch}**财星高透，祖上经济条件不差，但若日主身弱，反主早年孤贫，得祖荫有限。\n\n`
  } else if (yearTenGod === '正官' || yearTenGod === '偏官') {
    md += `年柱**${yearStem}${yearBranch}**官星当头，祖辈中或有从政、执法之人，家风较为严格，幼年受管教颇多。\n\n`
  } else if (yearTenGod === '食神' || yearTenGod === '伤官') {
    md += `年柱**${yearStem}${yearBranch}**食伤泄秀，祖辈或为手艺、艺术之人，家学渊源自由开放，但也易产生代际隔阂。\n\n`
  } else {
    md += `年柱**${yearStem}${yearBranch}**比劫当头，祖辈根基尚可但家业多变，兄弟姐妹之间互动密切但竞争亦重。\n\n`
  }

  // 月柱 = 父母兄弟
  md += '### 👨‍👩‍👧‍👦 父母兄弟\n\n'
  const monthStem = bazi.month.stem
  const monthBranch = bazi.month.branch
  const monthTenGod = bazi.month.tenGod

  if (monthTenGod === '正印' || monthTenGod === '偏印') {
    md += `月柱**${monthStem}${monthBranch}**为印星，主母亲对命主人生产生深远影响，幼年多得母亲悉心照料。`
    if (bazi.year.tenGod === '偏财') {
      md += '但年柱见偏财，父母之间或存在矛盾，少年家庭氛围有紧张时期。'
    }
    md += '\n\n'
  } else if (monthTenGod === '正财' || monthTenGod === '偏财') {
    md += `月柱**${monthStem}${monthBranch}**财星当令，父亲在家庭中地位显著，物质条件尚可但精神关怀可能欠缺。\n\n`
  } else if (monthTenGod === '正官' || monthTenGod === '偏官') {
    md += `月柱**${monthStem}${monthBranch}**官杀重，原生家庭管教严格甚至苛刻，成长过程中心理压力较大，可能影响自信心的建立。\n\n`
  } else {
    md += `月柱**${monthStem}${monthBranch}**为${monthTenGod}，兄弟姐妹缘分中等，家庭关系需靠后天经营。\n\n`
  }

  // 比劫分析
  let biJieCount = 0
  for (const p of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    if (p.tenGod === '比肩' || p.tenGod === '劫财') biJieCount++
  }

  if (biJieCount >= 3) {
    md += '> **判官批语：** 局中比劫重重，手足缘分虽深但竞争激烈，家产易起纷争，且配偶易与家人有嫌隙。\n\n'
  } else if (biJieCount === 0) {
    md += '> **判官批语：** 局中全无比劫，命主性格独立，但易感孤独，兄弟姐妹缘分较浅或较少。\n\n'
  }

  return md
}

// ============================================================
// 3. 运程长卷 报告
// ============================================================

export function renderLifeStagesReport(result: AnalysisResult): string {
  const { bazi, bigFortunes, person, currentFortune } = result

  let md = '## 三、运程长卷 (Life Stages)\n\n'

  // 起运年龄说明
  const firstFortune = bigFortunes[0]
  if (firstFortune) {
    const startAge = firstFortune.startAge
    md += `> **起运年龄：** ${startAge}岁起运（系统采用排盘引擎自动计算）。大运每十年一换，逢交运之年（如${startAge + 10 * 10}岁前后）人生有重大转换。\n\n`
  }

  const stages: { name: string; ageStart: number; ageEnd: number; icon: string }[] = [
    { name: '少年启智', ageStart: 0, ageEnd: 19, icon: '🌱' },
    { name: '青年立身', ageStart: 20, ageEnd: 39, icon: '⚡' },
    { name: '中年沉淀', ageStart: 40, ageEnd: 59, icon: '🏔️' },
    { name: '晚年颐养', ageStart: 60, ageEnd: 99, icon: '🌅' },
  ]

  for (const stage of stages) {
    md += `### ${stage.icon} ${stage.name}（${stage.ageStart}-${stage.ageEnd}岁）\n\n`
    // 大运按起始年龄分配所属阶段
    const relevantFortunes = bigFortunes.filter(
      f => f.startAge >= stage.ageStart && f.startAge < stage.ageEnd + 1,
    )

    if (relevantFortunes.length === 0) {
      md += '此阶段无大运流转记录。\n\n'
      continue
    }

    md += '| 大运 | 干支 | 纳音 | 十神 | 运势简述 |\n'
    md += '|:---|:---|:---|:---|:---|\n'

    for (const fortune of relevantFortunes) {
      // 跳过干支为空的占位符行
      if (!fortune.stem || !fortune.branch) continue
      const desc = describeFortune(fortune, bazi, result.favorableElements, result.unfavorableElements, fortune.startAge)
      md += `| ${fortune.startAge}-${fortune.endAge}岁 | **${fortune.stem}${fortune.branch}** | ${fortune.naYin} | ${fortune.tenGod} | ${desc} |\n`
    }
    md += '\n'
  }

  // 当前大运
  if (currentFortune) {
    const currentAge = new Date().getFullYear() - person.birthYear
    md += `> **判官批语：** 命主当前${currentAge}岁，正行 **${currentFortune.stem}${currentFortune.branch}** 大运（${currentFortune.startAge}-${currentFortune.endAge}岁），为${currentFortune.tenGod}运，${describeFortune(currentFortune, bazi, result.favorableElements, result.unfavorableElements, currentFortune.startAge)}\n\n`
  }

  // 关键提醒
  md += '### ⏳ 关键转折预警\n\n'
  md += '大运转换之年前后三年，为人生重大转折窗口期。尤以30岁、40岁、50岁时的交运节点最为关键，届时应稳守待机，不宜激进。\n\n'

  return md
}

function describeFortune(fortune: BigFortune, bazi: BaziChart, favorable: FiveElement[], unfavorable: FiveElement[], startAge: number): string {
  const god = fortune.tenGod
  const elem = fortune.element
  const isFav = favorable.includes(elem)
  const isUnfav = unfavorable.includes(elem)

  // 大运吉凶基调
  const baseDesc: Record<string, { good: string; bad: string }> = {
    '正印': { good: '贵人相助，学业事业双丰收，宜进修深造', bad: '印旺为忌，思虑过多错失良机，需放空心态' },
    '偏印': { good: '独特思维发挥作用，利于钻研和技术突破', bad: '偏印夺食，孤僻多疑，注意人际关系' },
    '正官': { good: '事业稳步上升，职位晋升，婚姻运佳', bad: '官星为忌，压力山大，谨防官非口舌' },
    '偏官': { good: '魄力爆发，危机变转机，权力扩大', bad: '七杀攻身，小人暗算，意外事件多发' },
    '正财': { good: '稳定财源增长，适合投资理财买房', bad: '财星为忌，为财所累，开销巨大' },
    '偏财': { good: '意外之财频来，投资回报丰厚', bad: '偏财虚浮，投机易损，谨防诈骗' },
    '食神': { good: '才思敏捷，创造力旺盛，安逸享福', bad: '食神泄身太过，精力分散，贪图安逸' },
    '伤官': { good: '才华横溢，创新突破，名气上升', bad: '伤官见官，口舌是非，职场人际紧张' },
    '比肩': { good: '人脉扩展，合作共赢，多劳多得', bad: '比劫争财，竞争激烈，合伙易散' },
    '劫财': { good: '社交活跃，朋友助力，开拓新局', bad: '劫财夺财，破财消灾，谨防损友' },
  }

  const desc = baseDesc[god] || { good: '运势平稳', bad: '运势平淡' }
  const mainDesc = isFav ? `✅ ${desc.good}` : isUnfav ? `⚠️ ${desc.bad}` : desc.good

  // 年龄阶段侧重
  let stageNote = ''
  if (startAge < 20) {
    stageNote = '此运在少年时期，重学业根基与性格养成'
  } else if (startAge < 40) {
    stageNote = god === '正财' || god === '偏财' ? '青年财运期，打好财富基础' :
      god === '正官' || god === '偏官' ? '青年事业上升期，职场冲刺' : '青年发展期，多尝试多积累'
  } else if (startAge < 60) {
    stageNote = god === '正财' || god === '偏财' ? '中年财运黄金期，财富稳步积累' :
      god === '正官' || god === '偏官' ? '中年事业巅峰期，权责加重' : '中年沉淀期，稳中求进'
  } else {
    stageNote = god === '正印' || god === '偏印' ? '晚年安逸期，重精神修养' :
      god === '比肩' || god === '劫财' ? '晚年社交活跃期，朋友相聚' : '晚年颐养期，健康为上'
  }

  return `${mainDesc}。${stageNote}`
}

// ============================================================
// 4. 判官直言 + 避坑指南
// ============================================================

export function renderRiskReport(result: AnalysisResult): string {
  const { bazi, fiveElementDistribution, bodyStrength, person } = result

  let md = '## 四、判官直言 (Risk Warning)\n\n'

  // 性格硬伤：引用 PersonalityProfile 的数据，不独立分析
  md += '### 🎭 性格需注意之处\n\n'
  const personality = analyzePersonality(result)

  if (personality.weaknesses.length > 0) {
    for (const w of personality.weaknesses) {
      md += `- ${w}\n`
    }
    // 额外提醒
    const spread = Math.max(...Object.values(fiveElementDistribution)) - Math.min(...Object.values(fiveElementDistribution))
    if (spread > 4) {
      md += `- 五行严重偏枯（差值${spread.toFixed(1)}），性格中可能有极端化倾向，需自我觉察与平衡\n`
    }
  } else {
    md += '此局性格整体中和，无明显偏激之处。但各人所处环境不同，还需自我觉察与修心。\n'
  }
  md += '\n'

  // 健康隐患
  md += '### 💊 健康隐患\n\n'

  const healthWarnings: string[] = []
  const allVals = Object.values(fiveElementDistribution)
  const maxVal = Math.max(...allVals)
  const minVal = Math.min(...allVals)
  const spread = maxVal - minVal
  const maxElem = (Object.entries(fiveElementDistribution).find(([, v]) => v === maxVal)?.[0] || '') as FiveElement
  const minElem = (Object.entries(fiveElementDistribution).find(([, v]) => v === minVal)?.[0] || '') as FiveElement

  const elemHealth: Record<FiveElement, string> = {
    '木': '肝胆、筋骨、神经系统',
    '火': '心脏、小肠、血液循环',
    '土': '脾胃、肌肉、消化系统',
    '金': '肺部、大肠、呼吸系统',
    '水': '肾脏、膀胱、泌尿生殖系统',
  }

  if (maxVal > 10) {
    healthWarnings.push(`⚠️ 五行**${maxElem}**极度过旺（${maxVal.toFixed(1)}分），${elemHealth[maxElem]}系统有"过亢为病"的严重风险，需重点监测和调理`)
  } else if (maxVal > 7) {
    healthWarnings.push(`五行**${maxElem}**偏旺（${maxVal.toFixed(1)}分），${elemHealth[maxElem]}需防过亢`)
  }

  if (minVal < 1) {
    healthWarnings.push(`🚨 五行**${minElem}**极度虚弱（仅${minVal.toFixed(1)}分），${elemHealth[minElem]}系统先天严重不足，是命局最大健康风险点，需终身养护！`)
  } else if (minVal < 2) {
    healthWarnings.push(`⚠️ 五行**${minElem}**很弱（${minVal.toFixed(1)}分），${elemHealth[minElem]}功能偏弱，日常需加强调理`)
  } else if (minVal < 3) {
    healthWarnings.push(`五行**${minElem}**偏弱（${minVal.toFixed(1)}分），${elemHealth[minElem]}需适当关注`)
  }

  if (spread > 5) {
    healthWarnings.push(`⚠️ 五行严重偏枯（${maxElem}${maxVal.toFixed(1)} vs ${minElem}${minVal.toFixed(1)}），体质失衡严重，务必重视综合调理`)
  }

  for (const hw of healthWarnings) {
    md += `- ${hw}\n`
  }
  md += '\n'

  // 避坑指南
  md += '### 🛡️ 【避坑指南】\n\n'
  md += `1. 日主${bodyStrength}，${bodyStrength === '身强' ? '忌再行比劫印运，应选择克泄耗的职业方向' : '忌再行财官食伤运，应优先稳定积累'}\n`
  md += `2. 合作投资需审慎，尤其流年见劫财透干之年，谨防合伙破财\n`
  md += `3. 选择居住地/工作地宜往喜用神方向（${result.favorableElements.map(e => ELEM_COLOR[e] + '方').join('、')}）\n\n`

  // 进取之策
  md += '### 🚀 【进取之策】\n\n'
  md += `1. **职业方向：** 优先选择与${result.favorableElements.map(e => `**${ELEM_SYMBOL[e]}${e}**`).join('、')}相关的行业\n`
  md += `2. **人际策略：** 多交${getComplementaryPeople(result)}\n`
  md += `3. **修身要点：** 通过冥想、书法、太极等修养心性，平衡五行偏颇\n\n`

  return md
}

function getComplementaryPeople(result: AnalysisResult): string {
  const fav = result.favorableElements
  const tips: string[] = []
  if (fav.includes('水')) tips.push('属水/木之人')
  if (fav.includes('木')) tips.push('属木/火之人')
  if (fav.includes('火')) tips.push('属火/土之人')
  if (fav.includes('土')) tips.push('属土/金之人')
  if (fav.includes('金')) tips.push('属金/水之人')
  return tips.join('、') || '志同道合之人'
}

// ============================================================
// 合盘报告（单人预览版 - 先展示自身合盘潜力）
// ============================================================

export function renderCompatibilityPreview(result: AnalysisResult): string {
  let md = '## ⚖️ 龙凤合鸣 - 合盘潜力分析\n\n'
  md += '> 此为命主自身婚恋潜力的初步判词。如需深度合盘，请提供对方八字信息。\n\n'

  const god = result.bazi.day.tenGod
  const spousePalace = result.bazi.day.branch
  const spouseElem = BRANCH_ELEMENT[spousePalace]

  md += `**配偶宫：** 日支 **${spousePalace}**（${ELEM_SYMBOL[spouseElem]}${spouseElem}），为${god}。\n\n`

  if (god === '正官' || god === '正财') {
    md += '配偶宫坐正星，婚姻对象品性端正，双方关系稳定和谐，为正缘配置。\n\n'
  } else if (god === '偏官' || god === '偏财') {
    md += '配偶宫坐偏星，情感经历可能较为丰富，或因工作/社交结识伴侣，关系中需更多包容。\n\n'
  } else if (god === '比肩' || god === '劫财') {
    md += '> ⚠️ **判官警示：** 配偶宫坐比劫，夫妻间易因经济问题或第三方介入产生矛盾，需格外注意婚姻经营。\n\n'
  }

  return md
}
