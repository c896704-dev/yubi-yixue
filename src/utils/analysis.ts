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
import {
  renderPersonalityReport,
  renderHealthReport,
  renderAppearanceReport,
  renderIntelligenceReport,
  renderFamilyDeepReport,
  renderCareerReport,
} from './persona'

import {
  HEAVENLY_STEMS, EARTHLY_BRANCHES,
  STEM_ELEMENT, STEM_YIN_YANG, BRANCH_ELEMENT,
  FIVE_ELEMENTS, HIDDEN_STEMS, ZODIAC,
  getTenGod,
} from '../constants'
import type { HeavenlyStem, EarthlyBranch, FiveElement, TenGod } from '../constants'
import type { BaziChart, Pillar, BigFortune, PersonInfo, AnalysisResult } from '../types'
import { calculateBazi, calculateBigFortunes, calculateElementDistribution, determineGeJu, isCongGe, isZhuanWangGe, isHuaQiGe } from './bazi'
import { getTrueSolarHourBranch, getEquationOfTime } from './solarTime'
import { judgeBodyStrength, judgeClimate, SHI_ER_CHANG_SHENG } from './wangshuai'
import { determineYongShen } from './yongshen'
import { calculateShenSha, getKongWang } from './shensha'
import { getChongHeAnalysis, getTaiYuan, getMingGong, getMingGongStem } from './chonghe'
import { Solar } from 'lunar-typescript'

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

  // 2. 格局判定（正八格 + 特殊格局）——特殊格局需在用神判定前得出
  const geJu = determineGeJu(bazi)
  const specialGeJu = isCongGe(bazi, strengthDetail.totalScore)
    || isZhuanWangGe(bazi, fiveElementDistribution)
    || isHuaQiGe(bazi, fiveElementDistribution)
    || undefined

  // 3. 用神判定（四维加权：扶抑+调候+通关+病药；从格/专旺格走特殊取法）
  const yongShen = determineYongShen(bazi, strengthDetail, fiveElementDistribution, specialGeJu)

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
    [bazi.year.stem, bazi.month.stem, bazi.day.stem, bazi.hour.stem],
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

  // 当前大运（大运段按虚岁计算，虚岁 = 周岁 + 1）
  const currentAge = new Date().getFullYear() - person.birthYear + 1
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

  // 枭神夺食检测：四柱中偏印与食神并存（日柱十神恒为比肩，不能作为判定依据）
  const allPillars = [bazi.year, bazi.month, bazi.day, bazi.hour]
  const hasPianYin = allPillars.some(p => p.tenGod === '偏印')
  const hasShiShen = allPillars.some(p => p.tenGod === '食神')
  if (hasPianYin && hasShiShen) {
    warnings.push('枭神夺食：偏印与食神同现，智慧被压制，心性易压抑抑郁，做事优柔寡断')
  }

  // 财多身弱
  let caiCount = 0
  for (const p of [bazi.year, bazi.month, bazi.hour]) { // 日柱恒为比肩，不计入
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

  // 日主无根：检查四柱地支藏干是否藏有日主本气/中气/余气（用通根而非日支五行）
  const dayMasterInHidden = (branch: EarthlyBranch) =>
    (HIDDEN_STEMS[branch] ?? []).includes(bazi.dayMaster)
  const hasRoot = [bazi.year.branch, bazi.month.branch, bazi.day.branch, bazi.hour.branch]
    .some(dayMasterInHidden)
  if (!hasRoot && strength === '身弱') {
    warnings.push('日主无根：四柱地支无日主通根（日主之气虚浮无依），命主一生漂泊感强，早年根基不稳')
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

  const { actualHour, actualMinute } = getTrueSolarHourBranch(birthHour, birthMinute, longitude, birthYear, birthMonth, birthDay)
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
    // 经度 > 120°E 在东侧（如130°E），当地正午早于北京时间；经度 < 120°E 在西侧
    const dir = longitude > 120 ? '东' : '西'
    // 均时差（全年 -14~+16 分钟）
    const eot = Math.round(getEquationOfTime(birthYear, birthMonth, birthDay) * 10) / 10
    lines.push(`> - **真太阳时校准：** 出生时间 ${originalTime}（北京时间），出生地经度 ${longitude}°E 位于120°E以${dir}，经度差${diff}°约${Math.round(parseFloat(diff) * 4)}分钟，叠加当日均时差${eot > 0 ? '+' : ''}${eot}分钟，校准后真太阳时为 **${solarTime}**。时柱为「${bazi.hour.stem}${bazi.hour.branch}」。`)
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

  // 排盘表与五行能量由 PillarTable / ElementBars 组件渲染，此处只出判官批语
  md += `> **判官批语：** 日主 **${bazi.dayMaster}**（${ELEM_SYMBOL[STEM_ELEMENT[bazi.dayMaster]]}${STEM_ELEMENT[bazi.dayMaster]}），生于${bazi.month.branch}月，为 **${geJu}**。\n\n`

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

  // 格局
  if (result.specialGeJu) {
    md += `> **特殊格局：** ⚠️ 此命为「**${result.specialGeJu}**」，非寻常格局，论断需格外谨慎。`
    md += `喜忌取法特殊：**弃命从势，顺其势而逆扶抑**（喜用神 ${result.favorableElements.map(e => ELEM_SYMBOL[e] + e).join('、')}，忌神 ${result.unfavorableElements.map(e => ELEM_SYMBOL[e] + e).join('、')}）。\n\n`
  }

  // 寒暖燥湿
  md += `**寒暖燥湿：** ${result.climate.label === '寒' ? '❄️ 寒局，需火调候' : result.climate.label === '暖' ? '☀️ 暖局，需水调候' : result.climate.label === '燥' ? '🔥 燥局，需水润泽' : result.climate.label === '湿' ? '💧 湿局，需火暖局' : '✅ 气候中和'}（暖度${result.climate.warmthScore} / 湿度${result.climate.humidityScore}）${result.climate.needTiaoHou ? ' ⚠️需调候' : ''} | **胎元：** ${result.taiYuan.stem}${result.taiYuan.branch} | **命宫：** ${result.mingGong.stem}${result.mingGong.branch}\n\n`

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
    '辰': { '木': '木囚', '火': '火休', '土': '土旺', '金': '金相', '水': '水死' },
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
// 3. 运程长卷 报告
// ============================================================

export function renderLifeStagesReport(result: AnalysisResult): string {
  const { bazi, bigFortunes, person, currentFortune } = result

  let md = '## 七、运程长卷 (Life Stages)\n\n'

  // 起运年龄说明
  const firstFortune = bigFortunes?.[0]
  if (firstFortune) {
    const startAge = firstFortune.startAge
    md += `> **起运年龄：** ${startAge}岁起运（系统采用排盘引擎自动计算）。大运每十年一换，逢交运之年（如${startAge + 10}岁、${startAge + 20}岁前后）人生有重大转换。\n\n`
  }

  // 大运与流年由 FortuneTimelineV2 时间轴组件呈现（点大运节点展开流年，点流年看逐年分析）
  md += '> 💡 **大运流年时间轴见下**——点击大运节点可展开该十年内的逐年流年，点击流年节点查看"干支+十神+吉凶"分析。\n\n'

  // 当前大运（大运段按虚岁计算，显示年龄须与查找逻辑一致：虚岁 = 周岁 + 1）
  if (currentFortune) {
    const currentAge = new Date().getFullYear() - person.birthYear + 1
    md += `> **判官批语：** 命主当前${currentAge}岁（虚岁），正行 **${currentFortune.stem}${currentFortune.branch}** 大运（${currentFortune.startAge}-${currentFortune.endAge}岁），为${currentFortune.tenGod}运，${describeFortune(currentFortune, bazi, result.favorableElements, result.unfavorableElements, currentFortune.startAge)}\n\n`
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
  const { bazi, fiveElementDistribution, bodyStrength } = result

  let md = '## 八、判官直言 (Risk Warning)\n\n'

  // 判官批语：综合命局风险（性格/健康细节见对应章节，此处只给总纲）
  md += '> **判官总批：** 此局日主' + bodyStrength + '，'
  const maxElem = (Object.entries(fiveElementDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || '') as FiveElement
  const minElem = (Object.entries(fiveElementDistribution).sort((a, b) => a[1] - b[1])[0]?.[0] || '') as FiveElement
  const spread = Math.max(...Object.values(fiveElementDistribution)) - Math.min(...Object.values(fiveElementDistribution))
  if (spread > 5) {
    md += `五行严重偏枯（${ELEM_SYMBOL[maxElem]}${maxElem}旺 vs ${ELEM_SYMBOL[minElem]}${minElem}弱，差值${spread.toFixed(1)}），运势起伏大，须以喜用神${result.favorableElements.map(e => ELEM_SYMBOL[e] + e).join('、')}为行事依归。\n\n`
  } else if (spread > 2.5) {
    md += `五行略有偏颇（差值${spread.toFixed(1)}），大运流年引动时仍须留意${minElem}相关领域。\n\n`
  } else {
    md += `五行相对均衡（差值${spread.toFixed(1)}），命局平稳，忌大起大落之举。\n\n`
  }

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
  let md = '### 💑 婚恋潜力（合盘预览）\n\n'
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

// ============================================================
// 命盘基础信息结构化数据（供 PillarTable 组件渲染"字段为行、四柱为列"纵向大表）
// ============================================================

export interface PillarTableCell {
  pillarKey: '年柱' | '月柱' | '日柱' | '时柱'
  pillarLabel: string
  mainStar: TenGod            // 主星 = 天干十神
  stem: HeavenlyStem
  branch: EarthlyBranch
  hiddenStems: HeavenlyStem[] // 藏干
  subStars: { stem: HeavenlyStem; god: TenGod }[] // 副星 = 藏干十神
  xingYun: string             // 星运 = 十二长生
  ziZuo: string               // 自坐 = 地支本气藏干十神（日柱前缀"自坐"）
  isKongWang: boolean         // 该柱地支是否落空亡
  naYin: string
  shenSha: { name: string; type: '吉' | '凶' | '中性' }[]
}

export interface PillarTableData {
  columns: PillarTableCell[]
  kongWangBranches: EarthlyBranch[] // 旬空二支
  globalShenSha: { name: string; type: '吉' | '凶' | '中性'; desc: string }[] // 天德/月德等全局神煞
  shenShaDetails: { name: string; type: '吉' | '凶' | '中性'; pillar: string; desc: string }[]
}

export function buildPillarTableData(result: AnalysisResult): PillarTableData {
  const { bazi } = result
  const pillars: { key: '年柱' | '月柱' | '日柱' | '时柱'; label: string; p: Pillar }[] = [
    { key: '年柱', label: '年柱', p: bazi.year },
    { key: '月柱', label: '月柱', p: bazi.month },
    { key: '日柱', label: '日柱', p: bazi.day },
    { key: '时柱', label: '时柱', p: bazi.hour },
  ]

  const kongWangBranches = getKongWang(bazi.day.stem, bazi.day.branch)

  // 神煞按柱位分组（pillar 值为 年支/月支/日支/时支/日柱/全局）
  const shenShaByPillar: Record<string, typeof result.shenSha.all> = {}
  for (const s of result.shenSha.all) {
    const key = s.pillar || '全局'
    if (!shenShaByPillar[key]) shenShaByPillar[key] = []
    shenShaByPillar[key]!.push(s)
  }

  const columns: PillarTableCell[] = pillars.map(({ key, label, p }) => {
    const hiddenStems = p.hiddenStems as HeavenlyStem[]
    const subStars = hiddenStems.map(stem => ({ stem, god: getTenGod(bazi.dayMaster, stem) }))
    const ziZuoGod = getTenGod(bazi.dayMaster, hiddenStems[0] ?? p.stem)
    const branchKey = key.replace('柱', '支') // 年柱→年支
    const shenShaList = [
      ...(shenShaByPillar[branchKey] || []),
      ...(key === '日柱' ? (shenShaByPillar['日柱'] || []) : []),
    ]
    return {
      pillarKey: key,
      pillarLabel: label,
      mainStar: p.tenGod,
      stem: p.stem,
      branch: p.branch,
      hiddenStems,
      subStars,
      xingYun: SHI_ER_CHANG_SHENG[bazi.dayMaster]?.[p.branch] || '—',
      ziZuo: (key === '日柱' ? '自坐' : '坐') + ziZuoGod,
      isKongWang: kongWangBranches.includes(p.branch),
      naYin: p.naYin,
      shenSha: shenShaList.map(s => ({ name: s.name, type: s.type })),
    }
  })

  return {
    columns,
    kongWangBranches,
    globalShenSha: (shenShaByPillar['全局'] || []).map(s => ({ name: s.name, type: s.type, desc: s.description })),
    shenShaDetails: result.shenSha.all.map(s => ({ name: s.name, type: s.type, pillar: s.pillar, desc: s.description })),
  }
}

// ============================================================
// 流年生成（当前大运段内逐年，供 FortuneTimelineV2 时间轴）
// ============================================================

export interface LiuNianItem {
  year: number          // 公历年
  age: number           // 虚岁
  ganZhi: string        // 流年干支（立春为界）
  tenGod: TenGod        // 流年天干对日主的十神
  luck: '吉' | '平' | '凶'
  note: string          // 一句判词
}

export function buildFortuneYears(result: AnalysisResult): LiuNianItem[] {
  const { bazi, person, currentFortune } = result
  if (!currentFortune) return []
  const years: LiuNianItem[] = []
  // 当前大运的起止公历年：虚岁 startAge 对应 出生年+startAge-1
  const startYear = person.birthYear + currentFortune.startAge - 1
  const endYear = person.birthYear + currentFortune.endAge - 1
  const godNote: Record<TenGod, { good: string; bad: string }> = {
    '正印': { good: '贵人运旺，利学业文书、置业', bad: '思虑过重，防因保守错失机会' },
    '偏印': { good: '偏门技艺有突破，利进修', bad: '孤僻多疑，注意人际疏离' },
    '正官': { good: '事业有晋升机遇，得认可', bad: '压力加大，谨防官非口舌' },
    '偏官': { good: '魄力爆发，宜主动出击', bad: '小人暗算，防意外冲突' },
    '正财': { good: '正财运稳，利储蓄置业', bad: '为财所累，开销增大' },
    '偏财': { good: '意外之财可期，利投资', bad: '投机易损，谨防破财' },
    '食神': { good: '才思敏捷，生活安逸有福', bad: '贪图安逸，进取不足' },
    '伤官': { good: '才华外露，名声提升', bad: '口舌是非，职场人际紧张' },
    '比肩': { good: '人脉助力，合作共赢', bad: '竞争加剧，合伙易散' },
    '劫财': { good: '社交活跃，朋友相助', bad: '破财风险高，谨防损友' },
  }
  for (let y = startYear; y <= endYear; y++) {
    const gz = Solar.fromYmd(y, 6, 15).getLunar().getYearInGanZhi() // 年中取干支，避开立春边界
    const stem = gz.charAt(0) as HeavenlyStem
    const god = getTenGod(bazi.dayMaster, stem)
    const elem = STEM_ELEMENT[stem]
    const isFav = result.favorableElements.includes(elem)
    const isUnfav = result.unfavorableElements.includes(elem)
    const luck: '吉' | '平' | '凶' = isFav ? '吉' : isUnfav ? '凶' : '平'
    const note = isFav ? godNote[god].good : isUnfav ? godNote[god].bad : `${god}流年，运势平稳，按部就班即可`
    years.push({ year: y, age: currentFortune.startAge + (y - startYear), ganZhi: gz, tenGod: god, luck, note })
  }
  return years
}

export interface ReportSection {
  id: string
  num: string          // 章节编号（一~八 / 附录A）
  title: string
  icon: string
  render: (result: AnalysisResult) => string
  defaultOpen: boolean
}

/**
 * 八字报告章节编排（逻辑顺序：定盘→性格→事业→智识→家庭婚恋→健康→运程→判官→面相附录）
 * AI 总评（AiInsightCard）由页面在"一、乾坤定盘"之后插入，不在此列表内。
 */
export function buildReportSections(): ReportSection[] {
  return [
    { id: 'fundamental', num: '一', title: '乾坤定盘', icon: '☯️', render: renderFundamentalReport, defaultOpen: true },
    { id: 'personality', num: '二', title: '性格全息图谱', icon: '🎭', render: renderPersonalityReport, defaultOpen: true },
    { id: 'career', num: '三', title: '事业前程', icon: '💼', render: renderCareerReport, defaultOpen: true },
    { id: 'intelligence', num: '四', title: '智识天赋', icon: '🧠', render: renderIntelligenceReport, defaultOpen: true },
    { id: 'family', num: '五', title: '家庭与婚恋', icon: '🏠', render: (r) => renderFamilyDeepReport(r) + '\n' + renderCompatibilityPreview(r), defaultOpen: true },
    { id: 'health', num: '六', title: '健康养生', icon: '🫀', render: renderHealthReport, defaultOpen: true },
    { id: 'lifestages', num: '七', title: '运程长卷', icon: '📈', render: renderLifeStagesReport, defaultOpen: true },
    { id: 'risk', num: '八', title: '判官直言', icon: '🛡️', render: renderRiskReport, defaultOpen: true },
    { id: 'appearance', num: '附录A', title: '面相身形', icon: '🧍', render: renderAppearanceReport, defaultOpen: false },
  ]
}
