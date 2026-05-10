/**
 * 命主全维分析引擎
 * 性格 · 健康 · 长相 · 家庭 · 智商五大维度深度解析
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement, TenGod } from '../constants'
import {
  HEAVENLY_STEMS, EARTHLY_BRANCHES,
  STEM_ELEMENT, STEM_YIN_YANG, BRANCH_ELEMENT,
  FIVE_ELEMENTS, HIDDEN_STEMS, ZODIAC,
  getTenGod, BRANCH_YIN_YANG,
} from '../constants'
import type { BaziChart, Pillar, AnalysisResult, BigFortune } from '../types'
import { calculateElementDistribution } from './bazi'
import { analyzeSixRelatives } from './liuqin'
import type { StarStatus } from './liuqin'

const ELEM_SYMBOL: Record<FiveElement, string> = { '木': '🌳', '火': '🔥', '土': '⛰️', '金': '⚜️', '水': '💧' }

// ============================================================
// 1. 性格深度分析
// ============================================================

interface PersonalityProfile {
  coreTrait: string
  strengths: string[]
  weaknesses: string[]
  socialStyle: string
  emotionalPattern: string
  workStyle: string
  communicationStyle: string
}

export function analyzePersonality(result: AnalysisResult): PersonalityProfile {
  const { bazi, bodyStrength } = result
  const dm = bazi.dayMaster
  const dmElem = STEM_ELEMENT[dm]
  const dmYY = STEM_YIN_YANG[dm]

  const profile: PersonalityProfile = {
    coreTrait: '',
    strengths: [],
    weaknesses: [],
    socialStyle: '',
    emotionalPattern: '',
    workStyle: '',
    communicationStyle: '',
  }

  // === 核心性格（基于日主五行+阴阳+月令+根气） ===
  // 去巴纳姆化：每个标签都必须有八字依据
  const monthBranch = bazi.month.branch

  // 判断日主得令、得地、得势
  const monthElem = bazi.month.branchElement
  const isDeLing = monthElem === dmElem
  const rootCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(
    p => p.hiddenStems[0] === dm
  ).length
  const isDeDi = rootCount >= 1
  const helpCount = [bazi.year, bazi.month, bazi.hour].filter(
    p => p.tenGod === '比肩' || p.tenGod === '劫财' || p.tenGod === '正印' || p.tenGod === '偏印'
  ).length
  const isDeShi = helpCount >= 2

  // 日主状态决定核心性格基调
  const statusTraits: Record<string, { core: string; strengths: string[]; weaknesses: string[] }> = {
    '得令得地': {
      core: `${dmYY === '阳' ? '外放' : '内聚'}型，${dmElem === '木' ? '生发向上' : dmElem === '火' ? '热烈奔放' : dmElem === '土' ? '厚重温稳' : dmElem === '金' ? '刚锐果决' : '灵动善变'}，根基扎实`,
      strengths: [
        `日主${dm}得月令${bazi.month.branch}之气，先天能量充沛，自我驱动力强`,
        `日支${bazi.day.branch}为根，内心坚定有主见，不易被外界动摇`,
        `气场稳健，在团队中自然而然地成为中心人物`,
        bodyStrength === '身强' ? '精力旺盛能扛事，适合挑大梁' : '得地有根，虽非最强但根基扎实',
      ],
      weaknesses: [
        `${dm}气偏强，有时过于${dmElem === '火' ? '急躁冲动，耐心不足' : dmElem === '金' ? '刚硬决绝，不近人情' : dmElem === '木' ? '固执倔强，不善变通' : dmElem === '水' ? '任性放纵，缺乏约束' : '保守固执，排斥新事物'}`,
        '自我意识强，合作中偶尔忽略他人意见，需刻意练习倾听',
      ],
    },
    '失令有根': {
      core: `外${dmYY === '阳' ? '柔' : '刚'}内${dmYY === '阳' ? '刚' : '柔'}型，${dmElem === '木' ? '坚韧不拔' : dmElem === '火' ? '蓄势待发' : dmElem === '土' ? '沉默负重' : dmElem === '金' ? '藏锋于鞘' : '暗流涌动'}，表面低调内里有主见`,
      strengths: [
        `虽月令${bazi.month.branch}不助日主，但日支${bazi.day.branch}有根，外弱内强，关键时候靠得住`,
        `逆境中反能激发潜力，不惧困难，有越挫越勇的韧性`,
        `不张扬不炫耀，但心中有数，做事沉稳可靠`,
      ],
      weaknesses: [
        '有时过于内敛低调，不善自我展示，容易被低估实力',
        `早年${bazi.month.branch}月失令，自信需要时间逐步建立`,
        '面对表扬时不太自在，可能因此错失升迁或合作机会',
      ],
    },
    '失令无根': {
      core: '', // 动态生成，见下方
      strengths: [
        `对他人的情绪和需求感知敏锐，有超越常人的共情力`,
        '善于借助外部资源和力量，不蛮干不硬碰',
        '适应环境能力强，能在不同场合调整自己',
      ],
      weaknesses: [
        `日主${dm}失令无根，独立性较弱，重大决策时容易犹豫反复`,
        '面对权威或强势人物时容易退缩，需要更多时间建立自信',
        '对他人依赖度偏高，独处时效率下降明显',
      ],
    },
  }

  let statusKey: string
  if ((isDeLing || isDeDi) && isDeShi) statusKey = '得令得地'
  else if (isDeDi) statusKey = '失令有根'
  else statusKey = '失令无根'

  const st = statusTraits[statusKey]!

  // 失令无根 → 按日主五行生成独特的核心画像
  if (statusKey === '失令无根') {
    const fd = result.fiveElementDistribution
    const rootLessTraits: Record<FiveElement, string> = {
      '木': `${dmYY === '阳' ? '谨慎' : '敏感'}型，如藤蔓无依，需攀附方能向上。${fd['水'] > 5 ? '水多木漂，外在温和实则内在漂泊感重。' : '独立支撑力弱，需团队环境发挥。'}`,
      '火': `${dmYY === '阳' ? '谨慎' : '敏感'}型，如烛火在风中摇曳，热情容易被环境压制。${fd['水'] > 5 ? '水多火灭，内心火热却常感无力施展。' : '需要合适时机和环境才能绽放光芒。'}`,
      '土': `${dmYY === '阳' ? '谨慎' : '敏感'}型，如沙土遇水易随波逐流。${fd['水'] > 5 ? '身弱水旺土流，外在沉稳实则内心易受外界左右。' : '土薄难载物，需积累沉淀方可成事。'}`,
      '金': `${dmYY === '阳' ? '谨慎' : '敏感'}型，如薄刃易折，锋芒内敛。${fd['火'] > 5 ? '火旺金熔，外柔内刚但不轻易示人。' : '需在合适领域磨砺方能显锋芒。'}`,
      '水': `${dmYY === '阳' ? '谨慎' : '敏感'}型，如浅水易竭，需要源头活水方能流转不息。${fd['土'] > 5 ? '土重水塞，思虑虽多但行动受阻。' : '灵动有余但持续力不足。'}`,
    }
    st.core = rootLessTraits[dmElem] || st.core
  }

  profile.coreTrait = st.core
  profile.strengths = [...st.strengths]
  profile.weaknesses = [...st.weaknesses]

  // === 十神修正（数据驱动，非模板） ===
  const monthGod = bazi.month.tenGod

  // 伤官：月柱伤官透出
  if (monthGod === '伤官') {
    const shangGuanStem = bazi.month.stem
    profile.strengths.push(`月干${shangGuanStem}伤官泄秀，思维敏捷、表达能力突出`)
    profile.weaknesses.push(`伤官${shangGuanStem}透月干，言辞犀利易伤人，需注意口舌是非`)
  }

  // 食神
  if (monthGod === '食神') {
    const shiShenStem = bazi.month.stem
    profile.strengths.push(`月干${shiShenStem}食神泄秀，温厚有福，创造力佳`)
    profile.weaknesses.push('食神旺则安于现状，进取心不如伤官强烈')
  }

  // 正官
  if (monthGod === '正官') {
    const zhengGuanStem = bazi.month.stem
    profile.strengths.push(`月干${zhengGuanStem}正官当令，规则意识强，适合体制内发展`)
    profile.weaknesses.push(`正官${zhengGuanStem}为约束，${bodyStrength === '身弱' || bodyStrength === '身偏弱' ? '官星为忌时压力过大，易焦虑' : '自律性强但有时过于刻板'}`)
  }

  // 偏官/七杀
  if (monthGod === '偏官') {
    const qiShaStem = bazi.month.stem
    profile.strengths.push(`月干${qiShaStem}七杀当权，魄力与决断力远超常人，能成大事`)
    profile.weaknesses.push(`七杀${qiShaStem}攻身，${bodyStrength === '身强' || bodyStrength === '身偏旺' ? '身强可驾驭杀星化为权柄' : '身弱则易被压力压垮，需印星化杀'}`)
  }

  // 正印
  if (monthGod === '正印') {
    const zhengYinStem = bazi.month.stem
    profile.strengths.push(`月干${zhengYinStem}正印护身，学习能力强，有慈悲心`)
    profile.weaknesses.push('印星过重则依赖性强，独立决断力不足')
  }

  // 偏印
  if (monthGod === '偏印') {
    const pianYinStem = bazi.month.stem
    profile.strengths.push(`月干${pianYinStem}偏印当令，思维不循常规，在专业领域可独树一帜`)
    profile.weaknesses.push(`偏印${pianYinStem}重则孤僻多疑，人际疏离`)
  }

  // 正财
  if (monthGod === '正财') {
    const zhengCaiStem = bazi.month.stem
    profile.strengths.push(`月干${zhengCaiStem}正财当令，务实可靠，重视物质基础`)
    profile.weaknesses.push('过于务实则显得缺乏情趣，需注意工作与生活的平衡')
  }

  // 偏财
  if (monthGod === '偏财') {
    const pianCaiStem = bazi.month.stem
    profile.strengths.push(`月干${pianCaiStem}偏财当令，商业嗅觉敏锐，慷慨大方`)
    profile.weaknesses.push('偏财旺则花钱大方，需注意理财规划')
  }

  // === 十神分布修正 ===
  const biJieCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(
    p => p.tenGod === '比肩' || p.tenGod === '劫财'
  ).length
  const caiCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(
    p => p.tenGod === '正财' || p.tenGod === '偏财'
  ).length
  const yinCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(
    p => p.tenGod === '正印' || p.tenGod === '偏印'
  ).length
  const shaCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(
    p => p.tenGod === '偏官'
  ).length

  // 比劫多 → 竞争意识/固执
  if (biJieCount >= 2) {
    profile.strengths.push(`比劫${biJieCount}重，竞争意识强，不畏挑战，有独立精神和自我驱动力`)
    profile.weaknesses.push(`比劫过多（${biJieCount}柱），性格中有固执己见的一面，合作时需注意倾听他人意见`)
  }
  // 财多 → 务实/计较
  if (caiCount >= 2) {
    profile.strengths.push(`财星${caiCount}透，务实可靠，对价值和资源有敏锐的判断力`)
    if (bodyStrength === '身弱' || bodyStrength === '身偏弱') {
      profile.weaknesses.push('财多身弱，虽有理财意识但容易为财所累，需注意量力而行')
    }
  }
  // 印多 → 学识/依赖
  if (yinCount >= 2) {
    profile.strengths.push(`印星${yinCount}现，学识吸收能力强，有慈悲心和包容力`)
    profile.weaknesses.push('印星过重，依赖心偏强，独立决断时需要更多勇气')
  }
  // 七杀 → 魄力/压力
  if (shaCount > 0 && bodyStrength === '身强') {
    profile.strengths.push('七杀在局，胆识过人，越是困难越能激发斗志，适合开创性工作')
  }

  // === 五行偏枯修正 ===
  const fd = result.fiveElementDistribution
  const allVals = Object.values(fd)
  const maxVal = Math.max(...allVals)
  const minVal = Math.min(...allVals)
  const maxElem = (Object.entries(fd).find(([, v]) => v === maxVal)?.[0] || '') as FiveElement
  const minElem = (Object.entries(fd).find(([, v]) => v === minVal)?.[0] || '') as FiveElement

  const elemStrengthTraits: Record<FiveElement, { strong: string; weak: string }> = {
    '木': { strong: '木气旺盛，有仁德之心和成长性思维，追求自我提升', weak: '木气不足，决断力偏弱，需要外界推动才能下定决心' },
    '火': { strong: '火气旺盛，热情主动，有感染力和行动力', weak: '火气不足，热情和行动力偏弱，做事容易三分钟热度' },
    '土': { strong: '土气厚重，诚信可靠，稳扎稳打不投机取巧', weak: '土气不足，缺乏足够的定力和耐心，容易受外界影响而动摇' },
    '金': { strong: '金气刚锐，有原则性和执行力，做事果断利落', weak: '金气不足，决断力和执行力偏弱，面对冲突时容易退缩' },
    '水': { strong: '水气充沛，聪慧灵动，适应力强，随机应变', weak: '水气不足，思维灵活性偏弱，面对复杂局面容易束手无策' },
  }

  if (maxVal > 8) {
    profile.strengths.push(elemStrengthTraits[maxElem].strong)
  }
  if (minVal < 2) {
    profile.weaknesses.push(elemStrengthTraits[minElem].weak)
  }

  // === 神煞修正 ===
  const shenShaNames = result.shenSha.all.map(s => s.name)
  if (shenShaNames.includes('文昌贵人') || shenShaNames.includes('学堂')) {
    profile.strengths.push('文昌/学堂入命，学习能力强，对知识有天然的亲近感')
  }
  if (shenShaNames.includes('将星')) {
    profile.strengths.push('将星入命，具备领导潜质，关键时刻能挺身而出统领全局')
  }
  if (shenShaNames.includes('华盖')) {
    profile.strengths.push('华盖入命，对玄学、艺术、哲学有超越常人的领悟力')
    profile.weaknesses.push('华盖孤高，有时显得不通人情世故，社交中需刻意练习共情表达')
  }
  if (shenShaNames.includes('孤辰') || shenShaNames.includes('寡宿')) {
    profile.weaknesses.push('孤辰寡宿入命，在人际交往中有时不善于得体表达，需要刻意经营重要关系')
  }
  if (shenShaNames.includes('羊刃')) {
    profile.strengths.push('羊刃加身，魄力和执行力出众，能快刀斩乱麻')
    profile.weaknesses.push('羊刃气盛，脾气来得快去得也快，需注意冲动伤人')
  }
  if (shenShaNames.includes('空亡')) {
    profile.weaknesses.push('空亡入命，在某些领域中容易有"怀才不遇"之感，需耐心等待时机')
  }

  // === 日支（内心世界） ===
  const dayBranch = bazi.day.branch
  const dayBranchElem = BRANCH_ELEMENT[dayBranch]
  const dayGodOnBranch = getTenGod(dm, bazi.day.stem)

  // 日支为配偶宫，也是命主内心真实自我
  if (dayBranchElem === dmElem) {
    profile.emotionalPattern = '内心与外表一致，表里如一，情感表达直接真实。做人不虚伪，但也容易因为过于直率而忽略他人感受。'
  } else if (
    (dmElem === '木' && dayBranchElem === '水') || (dmElem === '火' && dayBranchElem === '木') ||
    (dmElem === '土' && dayBranchElem === '火') || (dmElem === '金' && dayBranchElem === '土') ||
    (dmElem === '水' && dayBranchElem === '金')
  ) {
    profile.emotionalPattern = '内心被滋养，情感世界丰富而细腻。善于自我疗愈，但也容易沉浸在自己的情感世界里，对外界反应不够敏锐。'
  } else {
    profile.emotionalPattern = '内外存在张力，表面与内心不完全一致。可能需要独处时才能真正放松，在亲密关系中需要更多理解和空间。'
  }

  // 刑冲合害对情感模式的修正
  const chongHe = result.chongHe
  const dayChong = chongHe.liuChong.filter(c => c.positions?.includes('日支'))
  const dayHai = chongHe.liuHai.filter(h => h.positions?.includes('日支'))
  if (dayChong.length > 0) {
    profile.emotionalPattern += ' ⚠️ 日支（配偶/情感宫）逢冲，感情世界易有波折动荡，需在亲密关系中学会包容与沟通。'
  }
  if (dayHai.length > 0) {
    profile.emotionalPattern += ' ⚠️ 日支被害，情感中需防暗中的不睦或第三者干扰。'
  }
  if (chongHe.xiangXing.some(x => x.positions?.includes('日支'))) {
    profile.emotionalPattern += ' 日支带刑，在感情中容易自我折磨或与对方陷入纠缠状态，需学会放下。'
  }

  // === 社交风格 ===
  let socialScore = 0
  for (const p of [bazi.year, bazi.month, bazi.hour]) {
    if (p.tenGod === '比肩' || p.tenGod === '劫财') socialScore += 2
    if (p.tenGod === '食神' || p.tenGod === '伤官') socialScore += 1
    if (p.tenGod === '偏印') socialScore -= 1
    if (p.tenGod === '偏官') socialScore -= 1
  }
  if (dmElem === '火') socialScore += 1
  if (dmElem === '金') socialScore -= 1

  if (socialScore >= 3) {
    const energyNote = (bodyStrength === '身弱' || bodyStrength === '身偏弱')
      ? '但身弱格局，社交能量有限，热闹过后需要独处恢复，否则容易心力交瘁。'
      : ''
    profile.socialStyle = `主动社交型：比肩食神透出，有社交意愿和能力，能在人群中自然交流。${energyNote}需注意交友质量，避免交浅言深。`
  } else if (socialScore >= 0) {
    profile.socialStyle = '温和社交型：社交能力适中，能在需要的场合得体交流，但也享受独处时光。有固定的社交圈但不会过度扩张。'
  } else if (socialScore >= -2) {
    profile.socialStyle = '适度疏离型：不喜过多社交，更享受独处或小圈子交流。在人群中容易感到疲惫，但少数挚友关系极为深厚。'
  } else {
    profile.socialStyle = '深度独处型：社交欲望很低，对人群有明显的疏离感。这并非缺陷——独处的深度思考能力往往是其最大的天赋。'
  }

  // === 工作风格（十神修正） ===
  let workBase = ''
  if (bodyStrength === '身强' || bodyStrength === '身偏旺') {
    workBase = '精力充沛，适合高强度工作。'
  } else if (bodyStrength === '身弱' || bodyStrength === '身偏弱') {
    workBase = '精力有限但思维缜密，以智取胜。'
  } else {
    workBase = '精力与耐力均衡，适应性强。'
  }

  // 十神修正
  let workGod = ''
  if (monthGod === '正财' || monthGod === '偏财') {
    workGod = '务实稳重型：对数字和结果敏感，适合财务、商业、资源管理方向。做事有规划，追求可量化的成果。'
  } else if (monthGod === '食神') {
    workGod = '创意驱动型：灵感丰富，适合创意、设计、艺术方向。需要自由发挥空间，条条框框会扼杀其才华。'
  } else if (monthGod === '伤官') {
    workGod = '突破创新型：思维不受拘束，适合研发、创业、战略方向。挑战传统，但也容易与权威发生冲突。'
  } else if (monthGod === '偏官') {
    workGod = '冲锋挑战型：敢打敢拼，适合竞争激烈的领域（销售、竞技、军警）。压力即动力，越挫越勇。'
  } else if (monthGod === '正官') {
    workGod = '规则执行型：擅长在体制内发挥作用，适合公务员、管理、法律方向。自律严谨，值得信赖。'
  } else if (monthGod === '正印' || monthGod === '偏印') {
    workGod = '研究深耕型：适合学术、教育、顾问方向。需要深度思考时间，在一个领域深耕细作。'
  } else if (monthGod === '比肩' || monthGod === '劫财') {
    workGod = '团队协作型：在集体中发挥最佳，适合管理、协调、人际关系导向的工作。单打独斗不如团队合作。'
  }

  profile.workStyle = `${workGod || workBase}${workGod ? '' : ''}`.trim() || `${workBase}`

  // === 沟通风格 ===
  if (monthGod === '伤官' || monthGod === '食神') {
    profile.communicationStyle = '表达型：善于用语言打动人心，是天生的沟通者。但伤官过重者需注意言辞分寸，避免"祸从口出"。'
  } else if (monthGod === '正印' || monthGod === '偏印') {
    profile.communicationStyle = '倾听型：更善于倾听和思考，不轻易开口但言之有物。书面表达往往优于口头表达。'
  } else {
    profile.communicationStyle = '平衡型：能说会听，沟通风格灵活。面对不同对象会调整自己的表达方式。'
  }

  return profile
}

export function renderPersonalityReport(result: AnalysisResult): string {
  const p = analyzePersonality(result)
  const dm = result.bazi.dayMaster
  const dmElem = STEM_ELEMENT[dm]

  let md = '## 二、性格全息图谱 (Personality Profile)\n\n'

  // 核心特质
  md += `> **核心画像：** ${p.coreTrait}\n\n`

  // 优势与弱势双栏
  md += '### 🎯 性格双面\n\n'
  md += '| 优势 ✨ | 弱势 ⚠️ |\n|:---|:---|\n'
  const maxLen = Math.max(p.strengths.length, p.weaknesses.length)
  for (let i = 0; i < maxLen; i++) {
    const s = p.strengths[i] || ''
    const w = p.weaknesses[i] || ''
    md += `| ${s} | ${w} |\n`
  }
  md += '\n'

  // 多维分析
  md += '### 🔍 多维性格分析\n\n'
  md += `| 维度 | 判词 |\n|:---|:---|\n`
  md += `| **社交模式** | ${p.socialStyle} |\n`
  md += `| **情感模式** | ${p.emotionalPattern} |\n`
  md += `| **工作风格** | ${p.workStyle} |\n`
  md += `| **沟通风格** | ${p.communicationStyle} |\n\n`

  return md
}

// ============================================================
// 2. 健康五行论
// ============================================================

interface HealthProfile {
  constitution: string
  organDetails: { organ: string; element: FiveElement; level: '旺' | '偏旺' | '平' | '偏弱' | '弱'; advice: string }[]
  vulnerableAreas: string[]
  seasonalAdvice: string
  dietAdvice: string
  exerciseAdvice: string
}

export function analyzeHealth(result: AnalysisResult): HealthProfile {
  const { bazi, fiveElementDistribution: dist, bodyStrength, favorableElements, unfavorableElements } = result
  const dm = result.bazi.dayMaster
  const dmElem = STEM_ELEMENT[dm]

  const organMap: Record<FiveElement, { yin: string; yang: string }> = {
    '木': { yin: '肝', yang: '胆' },
    '火': { yin: '心', yang: '小肠' },
    '土': { yin: '脾', yang: '胃' },
    '金': { yin: '肺', yang: '大肠' },
    '水': { yin: '肾', yang: '膀胱' },
  }

  const bodyParts: Record<FiveElement, string> = {
    '木': '筋骨、指甲、眼睛、神经系统',
    '火': '血脉、舌、面部气色、内分泌',
    '土': '肌肉、口唇、消化吸收功能',
    '金': '皮肤、毛发、鼻子、呼吸系统',
    '水': '骨骼、牙齿、耳朵、泌尿系统',
  }

  // 体质判定：基于五行偏枯程度（最大-最小差值）
  let constitution = ''
  const allVals = Object.values(dist)
  const spread = Math.max(...allVals) - Math.min(...allVals)
  const minElem = FIVE_ELEMENTS.find(e => dist[e] === Math.min(...allVals))!
  const maxElem = FIVE_ELEMENTS.find(e => dist[e] === Math.max(...allVals))!

  if (spread > 4) {
    constitution = `五行严重偏枯（${maxElem}${Math.max(...allVals).toFixed(1)} vs ${minElem}${Math.min(...allVals).toFixed(1)}，差值${spread.toFixed(1)}）—— 先天体质严重失衡，${minElem}对应的${organMap[minElem].yin}${organMap[minElem].yang}系统最为薄弱，需重点养护，${maxElem}对应的系统则需防过亢为病。`
  } else if (spread > 2.5) {
    constitution = `五行略偏（${maxElem}${Math.max(...allVals).toFixed(1)} vs ${minElem}${Math.min(...allVals).toFixed(1)}，差值${spread.toFixed(1)}）—— ${minElem}对应的${organMap[minElem].yin}${organMap[minElem].yang}偏弱，${maxElem}偏旺，需针对性调理。`
  } else {
    constitution = `五行相对平衡（差值${spread.toFixed(1)}）—— 体质尚可，但仍需根据流年五行变化调整养护重点。`
  }

  // 火极弱特殊警示
  if (dist['火'] < 1) {
    constitution += ' ⚠️ 火气极弱，心脑血管系统和阳气运行需格外关注，忌寒凉过度。'
  }

  // 水极弱特殊警示
  if (dist['水'] < 1) {
    constitution += ' ⚠️ 水气极弱，肾脏泌尿系统先天薄弱，忌过度劳累伤精。'
  }

  // 各脏腑详细分析
  const organDetails: HealthProfile['organDetails'] = []
  for (const elem of FIVE_ELEMENTS) {
    const val = dist[elem]
    let level: '旺' | '偏旺' | '平' | '偏弱' | '弱'
    let advice = ''

    if (val >= 7.5) {
      level = '旺'
      if (elem === dmElem) {
        advice = `本命${elem}气过旺为病，${organMap[elem].yin}火易亢。建议：避免熬夜、少喝酒、控制情绪波动，可多食${getRestrainingFood(dmElem)}。`
      } else if (val >= 10) {
        advice = `${elem}气极旺为忌神，${organMap[elem].yin}${organMap[elem].yang}系统有"过亢为病"的风险，需重点调理。`
      } else {
        advice = `${elem}气偏旺，${organMap[elem].yin}${organMap[elem].yang}需防过亢。建议：保持作息规律，适度运动以泄${elem}气。`
      }
    } else if (val >= 5.5) {
      level = '偏旺'
      advice = `${organMap[elem].yin}${organMap[elem].yang}功能偏旺，适度养护即可。`
    } else if (val >= 3.5) {
      level = '平'
      advice = `${organMap[elem].yin}${organMap[elem].yang}功能平稳，正常养护即可。`
    } else if (val >= 2) {
      level = '偏弱'
      const s = getSupplementaryFood(elem)
      advice = `${elem}气偏弱，${organMap[elem].yin}${organMap[elem].yang}功能稍显不足。建议：宜食${s.direct}；间接补宜${s.indirect}。`
    } else {
      level = '弱'
      const s = getSupplementaryFood(elem)
      advice = `${elem}气严重不足（仅${val.toFixed(1)}分），${organMap[elem].yin}${organMap[elem].yang}先天薄弱，是命局最需补益的方向。建议：重点摄入${s.direct}；间接补宜${s.indirect}；⚠️ ${s.avoid}。${elem}对应的季节需格外养护。`
    }

    organDetails.push({
      organ: `${organMap[elem].yin}/${organMap[elem].yang} · ${bodyParts[elem]}`,
      element: elem,
      level,
      advice,
    })
  }

  // 易感部位
  const vulnerableAreas: string[] = []
  const weakElems = FIVE_ELEMENTS.filter(e => dist[e] <= 2)
  for (const e of weakElems) {
    vulnerableAreas.push(bodyParts[e])
  }
  if (vulnerableAreas.length === 0) {
    vulnerableAreas.push('先天体质较为均衡，无明显薄弱环节')
  }

  // 季节建议
  const seasonMap: Record<FiveElement, string> = { '木': '春季', '火': '夏季', '土': '长夏（季末18天）', '金': '秋季', '水': '冬季' }
  const weakSeasons = weakElems.map(e => seasonMap[e])
  let seasonalAdvice = ''
  if (weakSeasons.length > 0) {
    seasonalAdvice = `命主在${weakSeasons.join('、')}需格外注意养生。薄弱五行对应的季节，身体容易出现问题，应提前预防。`
  } else {
    seasonalAdvice = '四季皆宜，无明显季节性薄弱期，但仍需注意季节更替时的适应。'
  }

  // 饮食建议
  const dietAdvice = buildDietAdvice(dist, dmElem, favorableElements, unfavorableElements)

  // 运动建议
  const exerciseByElem: Record<FiveElement, string> = {
    '木': '瑜伽、太极、拉伸、户外散步（柔和的伸展运动）',
    '火': '有氧运动、跑步、跳舞（适度出汗的运动）',
    '土': '力量训练、登山、负重运动（增强肌肉力量）',
    '金': '呼吸训练、游泳、骑行（增强心肺功能）',
    '水': '游泳、冥想、水中运动（水的环境最为适宜）',
  }
  const weakElem = Object.entries(dist).sort((a, b) => a[1] - b[1])[0]![0] as FiveElement
  const exerciseAdvice = `推荐：${exerciseByElem[weakElem]}，以补益最弱五行之${weakElem}气。`

  return {
    constitution,
    organDetails,
    vulnerableAreas,
    seasonalAdvice,
    dietAdvice,
    exerciseAdvice,
  }
}

/** 克制关系表：key 克 value */
const CONTROLS_FOOD: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

/** 被克制关系表：key 被 value 克（反向查：谁克我？） */
function getController(elem: FiveElement): FiveElement | null {
  for (const [k, v] of Object.entries(CONTROLS_FOOD)) {
    if (v === elem) return k as FiveElement
  }
  return null
}

function getRestrainingFood(elem: FiveElement): string {
  const map: Record<FiveElement, string> = {
    '木': '酸味食物（醋、山楂、柠檬）',
    '火': '苦味食物（苦瓜、莲子心、绿茶）',
    '土': '甘味食物（蜂蜜、红枣、山药）',
    '金': '辛味食物（姜、葱、蒜、辣椒）',
    '水': '咸味食物（海带、紫菜、盐味适中）',
  }
  return map[elem] || '清淡饮食'
}

function getMotherElement(elem: FiveElement): FiveElement {
  const map: Record<FiveElement, FiveElement> = {
    '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
  }
  return map[elem]
}

function getFoodFor(elem: FiveElement): string {
  const map: Record<FiveElement, string> = {
    '木': '绿色蔬菜、芽菜、麦苗',
    '火': '红色食物、红枣、枸杞',
    '土': '黄色食物、小米、南瓜',
    '金': '白色食物、百合、银耳',
    '水': '黑色食物、黑豆、黑芝麻',
  }
  return map[elem] || ''
}

/**
 * 获取补益某弱五行所需的食物建议
 * 包含直接补益（同五行）和间接补益（生我之五行）
 * 同时标出禁忌：克我之五行的食物
 */
function getSupplementaryFood(weakElement: FiveElement): { direct: string; indirect: string; avoid: string } {
  const map: Record<FiveElement, { direct: string; indirect: string; avoid: string }> = {
    '火': {
      direct: '红色食物（红枣、枸杞、红豆、番茄）',
      indirect: '绿色食物（绿色蔬菜、芽菜）—— 木生火',
      avoid: '黑色/咸味食物（黑豆、黑芝麻、海带）—— 水克火，需慎食',
    },
    '水': {
      direct: '黑色食物（黑豆、黑芝麻、黑米）',
      indirect: '白色食物（白萝卜、百合）—— 金生水',
      avoid: '黄色/甘味食物（小米、南瓜、红枣）—— 土克水，需慎食',
    },
    '木': {
      direct: '绿色食物（菠菜、芹菜、西兰花）',
      indirect: '黑色食物（黑豆、黑芝麻）—— 水生木',
      avoid: '白色/辛味食物（白萝卜、葱蒜）—— 金克木，需慎食',
    },
    '金': {
      direct: '白色食物（百合、银耳、白萝卜）',
      indirect: '黄色食物（小米、南瓜）—— 土生金',
      avoid: '红色/苦味食物（红枣、苦瓜）—— 火克金，需慎食',
    },
    '土': {
      direct: '黄色食物（小米、玉米、南瓜）',
      indirect: '红色食物（红枣、枸杞）—— 火生土',
      avoid: '绿色/酸味食物（绿色蔬菜、山楂）—— 木克土，需慎食',
    },
  }
  return map[weakElement]
}

function buildDietAdvice(
  dist: Record<FiveElement, number>,
  dmElem: FiveElement,
  favorable: FiveElement[],
  unfavorable?: FiveElement[],
): string {
  const parts: string[] = []
  const unfavSet = new Set(unfavorable || [])
  const weak = FIVE_ELEMENTS.filter(e => dist[e] < 3)
  const strong = FIVE_ELEMENTS.filter(e => dist[e] > 8)

  // 弱五行：给出具体补益方案（直接+间接），但忌神元弱是好事，不应补
  for (const w of weak) {
    if (unfavSet.has(w)) {
      // 忌神弱是好事，不应补充
      parts.push(`${ELEM_SYMBOL[w]}${w}弱（${dist[w]?.toFixed(1)}分，但${w}为忌神，弱反为吉，无需刻意补充）`)
    } else {
      const s = getSupplementaryFood(w)
      parts.push(`${ELEM_SYMBOL[w]}${w}弱（${dist[w]?.toFixed(1)}分）：宜食${s.direct}；间接补宜${s.indirect}；⚠️ ${s.avoid}`)
    }
  }

  if (strong.length > 0) {
    parts.push(`控制${strong.map(e => `${ELEM_SYMBOL[e]}${e}`).join('、')}性食物摄入，避免过亢`)
  }

  // 喜用神对应食材
  const favFoods = favorable
    .filter(e => !strong.includes(e))  // 排除已经过旺的
    .map(e => `${ELEM_SYMBOL[e]}${getFoodFor(e)}`)
  if (favFoods.length > 0) {
    parts.push(`日常养生以喜用神食材为重点：${favFoods.join('、')}`)
  }

  return parts.join('；') + '。'
}

export function renderHealthReport(result: AnalysisResult): string {
  const h = analyzeHealth(result)

  let md = '## 三、健康五行论 (Health Analysis)\n\n'

  // 体质
  md += `> **体质判定：** ${h.constitution}\n\n`

  // 脏腑详情表
  md += '### 🫀 五脏六腑详析\n\n'
  md += '| 脏腑/部位 | 五行 | 状态 | 养护建议 |\n|:---|:---|:---|:---|\n'
  for (const od of h.organDetails) {
    const levelIcon = od.level === '旺' ? '🔴 旺' : od.level === '偏旺' ? '🟠 偏旺' : od.level === '平' ? '🟢 平' : od.level === '偏弱' ? '🟡 偏弱' : '🔴 弱'
    md += `| ${od.organ} | ${ELEM_SYMBOL[od.element]}${od.element} | ${levelIcon} | ${od.advice} |\n`
  }
  md += '\n'

  // 易感
  md += `**易感薄弱环节：** ${h.vulnerableAreas.join('、')}\n\n`

  // 养生
  md += '### 🌿 养生指南\n\n'
  md += `| 维度 | 建议 |\n|:---|:---|\n`
  md += `| **季节养生** | ${h.seasonalAdvice} |\n`
  md += `| **饮食调养** | ${h.dietAdvice} |\n`
  md += `| **运动建议** | ${h.exerciseAdvice} |\n\n`

  return md
}

// ============================================================
// 3. 面相身形 — 加权融合（五行权重混合）
// ============================================================

/** 各五行纯特征描述 */
/** 各五行纯描述（仅骨架/气质，不使用易发胖/易水肿等主观判断） */
const PURE_ELEM_APPEARANCE: Record<FiveElement, { build: string; skin: string; face: string; feature: string; frame: string }> = {
  '木': {
    build: '身形偏修长，四肢比例较长',
    skin: '肤色偏青白，肤质细腻',
    face: '面型偏长，额头较宽，下巴偏尖',
    feature: '手指修长、举止文雅',
    frame: '骨架偏窄，清瘦挺拔',
  },
  '火': {
    build: '身形偏瘦或中等，新陈代谢较快',
    skin: '肤色偏红润，气色好时有光泽',
    face: '面型偏尖，颧骨较突出，眼神明亮',
    feature: '动作迅速、语速偏快、肢体语言丰富',
    frame: '骨架中等',
  },
  '土': {
    build: '身形偏敦实，骨架较宽',
    skin: '肤色偏黄，肤质偏厚实',
    face: '面型偏方或偏圆，下颌有力，鼻大而圆',
    feature: '手掌厚实、步伐沉稳',
    frame: '骨架偏宽，体态稳重',
  },
  '金': {
    build: '身形匀称，轮廓分明',
    skin: '肤色偏白净，肤质细腻',
    face: '面型偏方，棱角清晰，五官立体感强',
    feature: '仪容整洁、姿态端正',
    frame: '骨架方正，比例协调',
  },
  '水': {
    build: '身形偏圆润，曲线柔和',
    skin: '肤色偏深或透着水润光泽',
    face: '面型偏圆，脸颊饱满，眼大有神采',
    feature: '声音柔和、步履轻缓',
    frame: '骨架适中偏小',
  },
}

/** 五行融合描述映射：当两个元素融合时，用自然语言描述 */
const FUSION_DESC: Record<string, string> = {
  '土-水': '戊土日主奠定了骨架偏宽的基础，但命局水势较强，水主圆润柔和，中和了土形的厚重感，整体形貌介于敦实与清秀之间，给人外稳内动的印象',
  '水-土': '水主圆润柔和，但土气调和了水的流动感，身形比纯水形更显稳重，曲线中带有一定的骨架感',
  '土-火': '土形骨架偏宽，火气带来红润气色和明亮眼神，敦实中透着热情活力',
  '火-土': '火形偏瘦，土气增加了骨架宽度，身形比纯火形更显稳重，气色红润而有光泽',
  '木-水': '木形修长，水气增添了圆润柔和感，身形在清瘦与圆润之间取得平衡',
  '水-木': '水主圆润，木气拉长了身形线条，比纯水形更显修长，柔和中带着挺拔',
  '金-土': '金形匀称方正，土气增加了骨架宽度，轮廓分明中带有厚重感',
  '土-金': '土形敦实，金气增加了棱角感和立体五官，方正中有锐利',
  '木-火': '木形修长，火气带来红润气色和明快举止，清瘦中透着活力',
  '火-木': '火形偏瘦敏捷，木气拉长了身形比例，明快中带着文雅气质',
  '金-水': '金形方正有棱角，水气柔和了锐利感，匀称中带着圆润',
  '水-金': '水主圆润柔和，金气增加了轮廓清晰度，圆润中不失立体感',
  '火-水': '火形偏瘦，水气调和了急躁感，明快中带着沉稳',
  '水-火': '水主圆润柔和，火气带来红润气色，柔和中透着神采',
}

function generateAppearance(
  dmElem: FiveElement,
  dist: Record<FiveElement, number>,
  monthElem: FiveElement,
  shenSha: { all: { name: string }[] },
  bodyStrength: string,
): { build: string; skin: string; face: string; feature: string; frame: string; fusionNote: string } {
  const topElem = (Object.entries(dist).sort((a, b) => b[1] - a[1])[0]?.[0] || dmElem) as FiveElement

  const weights = new Map<FiveElement, number>()
  weights.set(dmElem, 40)
  weights.set(topElem, (weights.get(topElem) || 0) + 30)
  weights.set(monthElem, (weights.get(monthElem) || 0) + 20)

  if (shenSha.all.some(s => s.name === '桃花')) weights.set('火', (weights.get('火') || 0) + 10)
  if (shenSha.all.some(s => s.name === '华盖')) weights.set('金', (weights.get('金') || 0) + 10)

  const sorted = [...weights.entries()].sort((a, b) => b[1] - a[1])
  const primary = sorted[0]![0]
  const secondary = sorted[1]![0]
  const primaryRatio = sorted[0]![1] / (sorted[0]![1] + sorted[1]![1])

  const p = PURE_ELEM_APPEARANCE[primary]
  const s = PURE_ELEM_APPEARANCE[secondary]

  // 查融合描述表，生成自然语言
  const fusionKey = `${primary}-${secondary}`
  const fusionNote = FUSION_DESC[fusionKey] || (primaryRatio > 0.65
    ? `以${primary}形为主，${secondary}气为辅调和`
    : `${primary}形与${secondary}气均衡融合`)

  // 统一生成：根据主导比例取中间描述，避免拼接矛盾
  const isDominated = primaryRatio > 0.65

  let build = ''
  if (isDominated) {
    build = p.build
  } else {
    // 双元素均衡：描述为"介于X与Y之间"
    build = `身形介于${p.build.replace(/^身形偏?|，.*$/g, '')}与${s.build.replace(/^身形偏?|，.*$/g, '')}之间`
  }

  let frame = ''
  if (isDominated) {
    frame = p.frame
    if (bodyStrength === '身弱' || bodyStrength === '身偏弱') {
      frame += '，但身弱格局下骨架力度偏轻'
    }
  } else {
    frame = `骨架介于${p.frame.replace(/^骨架|，.*$/g, '')}与${s.frame.replace(/^骨架|，.*$/g, '')}之间，整体协调`
  }

  let skin = isDominated ? p.skin : `${p.skin.replace(/，.*$/g, '')}，透着${s.skin.split('，')[0]?.replace(/^肤色偏?|，.*$/g, '') || ''}调`

  let face = isDominated ? p.face : `${p.face.replace(/，.*$/g, '')}，兼具${s.face.split('，')[0]?.replace(/^面型偏?|，.*$/g, '') || '柔和'}感`

  let feature = isDominated ? p.feature : `${p.feature}，${secondary}气赋予的${s.feature.split('、')[0] || '特质'}亦有体现`

  return { build, skin, face, feature, frame, fusionNote }
}

export function renderAppearanceReport(result: AnalysisResult): string {
  const { bazi, fiveElementDistribution: dist, bodyStrength, shenSha } = result
  const dm = bazi.dayMaster
  const dmElem = STEM_ELEMENT[dm]
  const dmYY = STEM_YIN_YANG[dm]
  const monthElem = bazi.month.branchElement

  const topElem = (Object.entries(dist).sort((a, b) => b[1] - a[1])[0]?.[0] || dmElem) as FiveElement
  const bt = generateAppearance(dmElem, dist, monthElem, shenSha, bodyStrength)

  let md = '## 四、面相身形 (Physical Appearance)\n\n'

  // 总览
  md += `> ${bt.fusionNote}。实际长相还受后天环境、地域、饮食、年龄等因素影响，八字仅提供先天形貌的倾向性参考。\n\n`

  // 身形
  md += '### 🧍 身形体态\n\n'
  md += `- **体格：** ${bt.build}\n`
  md += `- **骨架：** ${bt.frame}\n`
  md += `- **肤色：** ${bt.skin}\n`
  md += `- **特征：** ${bt.feature}\n\n`

  // 面容
  md += '### 😊 面容五官\n\n'
  md += `- **面型：** ${bt.face}\n\n`

  // 五行调和说明（自然语言）
  md += '### 🔄 五行调和说明\n\n'
  md += `**日主${dm}${dmElem}${dmYY}**（${ELEM_SYMBOL[dmElem]}）为先天底色`
  if (dmElem !== topElem) {
    md += `，命局最旺**${topElem}**（${dist[topElem]?.toFixed(1)}分）强烈调和了容貌特征`
  }
  if (monthElem !== dmElem && monthElem !== topElem) {
    md += `，月令**${monthElem}**之气亦有影响`
  }
  md += '。\n\n'

  if (bodyStrength === '身弱' || bodyStrength === '身偏弱') {
    md += `- 身弱格局：骨架力度和肌肉饱满度可能比同五行者偏轻，给人偏文弱的感觉\n`
  }
  if (shenSha.all.some(s => s.name === '桃花')) {
    md += `- 桃花入命：五官协调度较高，容貌有自然吸引异性的特质\n`
  }
  if (shenSha.all.some(s => s.name === '华盖')) {
    md += `- 华盖入命：气质中带孤高疏离感，眼神可能有深邃或沉静的特质\n`
  }

  md += '\n> **判官批语：** 相由心生，八字定其骨，修为定其神。后天修养与心态调整，比先天容貌更为关键。\n\n'

  return md
}

// ============================================================
// 4. 智商天赋分析
// ============================================================

export function renderIntelligenceReport(result: AnalysisResult): string {
  const { bazi, bodyStrength, favorableElements } = result
  const dm = bazi.dayMaster
  const dmElem = STEM_ELEMENT[dm]

  // 智识评估
  let iqScore = 0 // 0-10
  const iqFactors: string[] = []

  // 食伤 = 创造力、逻辑思维、表达能力
  let shiShangCount = 0
  for (const p of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    if (p.tenGod === '食神') { shiShangCount++; iqScore += 1.5; iqFactors.push('食神泄秀，才思敏捷') }
    if (p.tenGod === '伤官') { shiShangCount++; iqScore += 2; iqFactors.push('伤官聪慧，悟性超群') }
  }

  // 印星 = 学习能力、记忆力、学术天赋
  let yinCount = 0
  for (const p of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    if (p.tenGod === '正印') { yinCount++; iqScore += 1.8; iqFactors.push('正印得力，学业有成') }
    if (p.tenGod === '偏印') { yinCount++; iqScore += 1.3; iqFactors.push('偏印独特思维，钻研力强') }
  }

  // 日主得令
  const monthElem = bazi.month.branchElement
  if (monthElem === dmElem) { iqScore += 1; iqFactors.push('日主得月令之气，思维清朗') }

  // 五行智识特质
  const intelMap: Record<FiveElement, { type: string; desc: string }> = {
    '木': { type: '策略型智慧', desc: '善于长远规划，目光长远，策略思维能力突出。在管理、战略、教育领域有天然优势。' },
    '火': { type: '创意型智慧', desc: '灵感丰富，思维跳跃，擅长创意和即兴发挥。在艺术、设计、演讲领域表现卓越。' },
    '土': { type: '实践型智慧', desc: '逻辑严谨，思维缜密，善于将复杂问题系统化。在工程、金融、管理领域得心应手。' },
    '金': { type: '分析型智慧', desc: '理性客观，分析能力极强，善于找出问题的本质。在法律、科研、技术领域天赋异禀。' },
    '水': { type: '洞察型智慧', desc: '直觉敏锐，能洞察人心，记忆力出众。在咨询、心理学、写作领域无人能及。' },
  }

  // 评分等级
  let iqLevel = ''
  let iqNote = ''
  if (iqScore >= 6) iqLevel = '上等 —— 天资聪颖，学东西快，悟性高。若后天得到良好教育，必成大器。'
  else if (iqScore >= 4) iqLevel = '中上 —— 聪明伶俐，理解力好。在感兴趣的领域能钻得很深，但需要持续努力才能保持优势。'
  else if (iqScore >= 2) iqLevel = '中等 —— 智力正常，勤奋可补拙。虽非天生奇才，但稳扎稳打也能有出色成就。'
  else iqLevel = '朴实型 —— 非以传统学术智慧见长，但实践经验丰富、踏实稳重。智慧和判断力可能随年龄增长而不断提升。'

  // 分维度高但总分低的特别说明
  if (iqScore < 2 && result.fiveElementDistribution['水'] > 5) {
    iqNote = '> **注意：** 命主虽智力评级朴实，但水行能量充足（记忆力突出），属于"记忆力强但非传统学术型智慧"的类型，动手实践和记忆类领域反有优势。\n'
  }

  let md = '## 五、智识天赋 (Intellectual Profile)\n\n'

  md += `> **智力评级：** ${iqLevel}\n`
  if (iqNote) md += iqNote
  md += '\n'

  const it = intelMap[dmElem]

  md += '### 🧠 思维类型\n\n'
  md += `**${it.type}** —— ${it.desc}\n\n`

  md += '### 📊 智识要素分析\n\n'
  md += '| 要素 | 星神 | 强度 | 说明 |\n|:---|:---|:---|:---|\n'

  // 创造力
  const creativityLevel = shiShangCount >= 3 ? '⭐⭐⭐⭐⭐' : shiShangCount >= 2 ? '⭐⭐⭐⭐' : shiShangCount >= 1 ? '⭐⭐⭐' : '⭐⭐'
  md += `| **创造力** | 食神/伤官 | ${creativityLevel} | ${shiShangCount >= 2 ? '天马行空，创意无限' : shiShangCount >= 1 ? '有一定创造力' : '创造力中等，但可在后天培养'} |\n`

  // 学习力
  const learningLevel = yinCount >= 3 ? '⭐⭐⭐⭐⭐' : yinCount >= 2 ? '⭐⭐⭐⭐' : yinCount >= 1 ? '⭐⭐⭐' : '⭐⭐'
  md += `| **学习力** | 正印/偏印 | ${learningLevel} | ${yinCount >= 2 ? '过目不忘，触类旁通' : yinCount >= 1 ? '学有所成，持之以恒' : '需加倍努力，但学得扎实'} |\n`

  // 判断力
  const dmScore = bodyStrength === '身强' ? 4 : bodyStrength === '中和' ? 3 : 2
  md += `| **判断力** | 日主强弱 | ${'⭐'.repeat(dmScore)} | ${bodyStrength === '身强' ? '果断明确，不易被他人左右' : '稳重审慎，三思而后行'} |\n`

  // 记忆力
  const waterLevel = result.fiveElementDistribution['水']
  const memoryLevel = waterLevel > 8 ? '⭐⭐⭐⭐⭐' : waterLevel > 5 ? '⭐⭐⭐⭐' : waterLevel > 3 ? '⭐⭐⭐' : '⭐⭐'
  const memoryDesc = waterLevel > 8 ? '记忆能力出众，博闻强记' : waterLevel > 5 ? '记性良好，信息留存率高' : waterLevel > 3 ? '理解记忆为主，重要信息能牢记' : '偏重理解记忆而非机械记忆'
  md += `| **记忆力** | 水行能量 | ${memoryLevel} | ${memoryDesc} |\n`

  md += '\n'

  // 最佳学习方式
  md += '### 📚 最佳学习路径\n\n'
  const learningStyle = buildLearningAdvice(bazi, dmElem, iqScore)
  md += learningStyle

  md += '\n'

  return md
}

function buildLearningAdvice(bazi: BaziChart, dmElem: FiveElement, iqScore: number): string {
  const parts: string[] = []

  // 基于日主的学习建议
  const learnMap: Record<FiveElement, string> = {
    '木': '- **结构化学习：** 善于从宏观框架入手，先建立知识体系再填充细节。适合系统性的课程和进阶式阅读。\n- **输出式学习：** 通过教别人来巩固自己的理解。',
    '火': '- **兴趣驱动学习：** 需要强烈的兴趣点才能持续投入。喜欢新鲜感和变化，不适合单调重复的学习方式。\n- **实践式学习：** 动手做比看书学得更快。',
    '土': '- **重复巩固学习：** 稳扎稳打，步步为营。虽然学得不快，但一旦掌握就非常牢固。\n- **小组学习：** 与人讨论中能获得更深理解。',
    '金': '- **逻辑推理学习：** 善于从原理出发推导结论。对公式、定理、模型有天然敏感度。\n- **自学成才型：** 独立自学效率远高于课堂听讲。',
    '水': '- **沉浸式学习：** 需要安静不被打扰的环境。在放松状态下（如散步、泡澡时）灵感和理解力最强。\n- **博览群书型：** 广泛阅读，跨领域吸收知识。',
  }

  parts.push(learnMap[dmElem])

  // 印星强弱修正
  const monthGod = bazi.month.tenGod
  if (monthGod === '正印' || monthGod === '偏印') {
    parts.push('- 月令印星助力，天生适合学术研究和深造。')
  }
  if (monthGod === '食神' || monthGod === '伤官') {
    parts.push('- 月令食伤泄秀，创意和表达能力是最强学习武器，建议多用写作、演讲等方式输出。')
  }

  return parts.join('\n')
}

// ============================================================
// 5. 家庭关系深度分析
// ============================================================

export function renderFamilyDeepReport(result: AnalysisResult): string {
  const { bazi, person } = result
  const sr = analyzeSixRelatives(bazi, person.gender)

  let md = '## 六、家庭关系图谱 (Family Dynamics)\n\n'

  // === 父星 ===
  md += '### 👨 父亲\n\n'
  md += `| 项目 | 内容 |\n|:---|:---|\n`
  md += `| **父星位置** | ${sr.father.starPosition} |\n`
  md += `| **干支** | ${sr.father.starStemBranch || '—'} |\n`
  md += `| **十神** | ${sr.father.starTenGod} |\n`
  md += `| **状态** | ${statusLabel(sr.father.starStatus)} |\n\n`
  md += `**分析：** ${buildFatherAnalysis(bazi, sr, person.gender)}\n\n`

  // === 母星 ===
  md += '### 👩 母亲\n\n'
  md += `| 项目 | 内容 |\n|:---|:---|\n`
  md += `| **母星位置** | ${sr.mother.starPosition} |\n`
  md += `| **干支** | ${sr.mother.starStemBranch || '—'} |\n`
  md += `| **十神** | ${sr.mother.starTenGod} |\n`
  md += `| **状态** | ${statusLabel(sr.mother.starStatus)} |\n\n`
  md += `**分析：** ${buildMotherAnalysis(bazi, sr, person.gender)}\n\n`

  // === 父母宫 ===
  md += '### 🏠 父母宫\n\n'
  md += `年柱${bazi.year.stem}${bazi.year.branch}为父宫，月柱${bazi.month.stem}${bazi.month.branch}为母宫。`
  md += buildParentsPalaceAnalysis(bazi, sr)
  if (sr.parentsPalace.chongHe.length > 0) {
    for (const ch of sr.parentsPalace.chongHe) {
      md += `\n- ⚠️ ${ch}`
    }
  }
  if (sr.parentsPalace.warning) {
    md += `\n\n> **判官警示：** ${sr.parentsPalace.warning}`
  }
  md += '\n\n'

  // === 兄弟姐妹 ===
  md += '### 👫 兄弟姐妹\n\n'
  md += buildSiblingAnalysis(bazi, sr)
  md += '\n'

  return md
}

/** 构建父亲分析段落 */
function buildFatherAnalysis(bazi: BaziChart, sr: ReturnType<typeof analyzeSixRelatives>, gender: string): string {
  const f = sr.father
  const parts: string[] = []

  // 定位解读
  if (f.starPosition.includes('年柱') && !f.starPosition.includes('藏干')) {
    parts.push('父星在年柱，父亲在命主早年成长中发挥核心影响')
  } else if (f.starPosition.includes('月柱') && !f.starPosition.includes('藏干')) {
    parts.push('父星在月柱，父亲在命主青少年阶段（求学/初入社会时期）发挥更大作用')
  } else if (f.starPosition.includes('时柱')) {
    parts.push('父星在时柱，父亲对命主的影响在成长后期或成年后更加凸显，可能是父亲晚年得子或父子缘分后期更深')
  } else if (f.starPosition.includes('藏干')) {
    parts.push('父星伏藏于藏干之中，父亲在命主生活中的直接影响可能不那么显性，但深层影响仍在')
  }

  // 十神解读
  if (f.starTenGod === '偏财') {
    parts.push('偏财为父，父亲性格偏灵活务实，对金钱和资源有直觉性的把握，教育方式可能偏放手型而非严管型')
  } else if (f.starTenGod === '正财') {
    parts.push('正财为父，父亲性格偏稳重传统，重视物质基础和家庭稳定，教育方式可能偏规矩型')
  }

  // 状态解读
  if (f.starStatus === '受克') {
    parts.push('父星受克，父亲在命主成长过程中可能面临外部压力（工作、健康或家庭资源方面），导致对命主的直接陪伴或支持受到一定制约')
  } else if (f.starStatus === '受生') {
    parts.push('父星得生助，父亲运势较顺，能为命主提供较好的成长环境和资源支持')
  } else if (f.starStatus === '伏藏') {
    parts.push('父星伏藏，父亲在家庭中可能不是话语权最强的一方，但对命主的深层价值观有潜移默化的塑造')
  }

  // 比劫影响（比劫克财）
  const biJieCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(
    p => p.tenGod === '比肩' || p.tenGod === '劫财'
  ).length
  if (biJieCount >= 2 && (f.starTenGod === '偏财' || f.starTenGod === '正财')) {
    parts.push(`命局比劫较多（${biJieCount}柱），比劫夺财，暗示父亲在财务或资源分配上可能经历过一些压力`)
  }

  return parts.join('。') + '。'
}

/** 构建母亲分析段落 */
function buildMotherAnalysis(bazi: BaziChart, sr: ReturnType<typeof analyzeSixRelatives>, gender: string): string {
  const m = sr.mother
  const parts: string[] = []

  // 定位解读
  if (m.starPosition.includes('年柱') && !m.starPosition.includes('藏干')) {
    parts.push('母星在年柱，母亲在命主婴幼儿和童年期的影响最为深刻')
  } else if (m.starPosition.includes('月柱') && !m.starPosition.includes('藏干')) {
    parts.push('母星在月柱，母亲在命主成长关键期（青少年阶段）发挥重要引导作用')
  } else if (m.starPosition.includes('藏干')) {
    parts.push('母星伏藏于藏干之中，母亲在家庭中的角色可能隐而不显——她可能不是家庭对外的主导者，但对内默默付出，影响深远而不张扬')
  }

  // 十神解读
  if (m.starTenGod === '正印') {
    parts.push('正印为母，母亲性格偏温和慈爱，注重命主的学业和品德教育，给予的是滋养型的爱')
  } else if (m.starTenGod === '偏印') {
    parts.push('偏印为母，母亲性格偏内敛或有不循常规的一面，对命主的关爱方式可能不是典型的温情型，而是通过自身的学识、技能或人生经验传递价值观')
  }

  // 状态解读
  if (m.starStatus === '受克') {
    parts.push('母星受克，母亲在家庭或生活中可能承受了一定压力，财旺克印暗示家庭经济或父亲方面的因素对母亲角色有所制约')
  } else if (m.starStatus === '伏藏') {
    parts.push('母星伏藏，母亲对命主的影响是潜移默化型的——她可能不善言辞或不是家庭对外的主导者，但她的付出和价值观会在命主成年后被越来越深刻地感知到')
  } else if (m.starStatus === '受生') {
    parts.push('母星得生，母亲得外界或家庭内部助力，在抚养命主的过程中较为顺遂')
  }

  // 财旺克印检测
  const caiCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(
    p => p.tenGod === '正财' || p.tenGod === '偏财'
  ).length
  if (caiCount >= 2 && (m.starTenGod === '正印' || m.starTenGod === '偏印')) {
    parts.push(`命局财星较多（${caiCount}柱），财克印，暗示家庭中经济压力或父亲的决策可能对母亲的发挥空间产生了一定影响`)
  }

  return parts.join('。') + '。'
}

/** 构建父母宫分析段落 */
function buildParentsPalaceAnalysis(bazi: BaziChart, sr: ReturnType<typeof analyzeSixRelatives>): string {
  const parts: string[] = []
  const yearGod = bazi.year.tenGod
  const monthGod = bazi.month.tenGod

  // 年柱为祖上/父系根基
  parts.push(`年干${bazi.year.stem}为${yearGod}`)
  if (yearGod === '偏财' || yearGod === '正财') {
    parts.push('父星透于年干，祖上或父亲一系对命主有较为直接的资源传递')
  } else if (yearGod === '正印' || yearGod === '偏印') {
    parts.push('年干为印星，祖上有学识或德行传承，家庭文化氛围较好')
  } else if (yearGod === '比肩' || yearGod === '劫财') {
    parts.push('年柱比劫，祖上根基可能经历过波动，父辈兄弟姐妹较多')
  } else if (yearGod === '偏官') {
    parts.push('年柱七杀，祖上可能有军警或武职背景，家风中带有刚毅色彩')
  } else if (yearGod === '食神' || yearGod === '伤官') {
    parts.push('年柱食伤，祖上可能有技艺或文化传承，家庭氛围偏自由开放')
  }

  // 月柱为父母/兄弟宫
  parts.push(`月干${bazi.month.stem}为${monthGod}`)
  if (monthGod === '正印' || monthGod === '偏印') {
    parts.push('母星或长辈星透于月干，父母在命主青少年阶段给予了充分的支持和引导')
  } else if (monthGod === '正官' || monthGod === '偏官') {
    parts.push('月干为官星，家庭管教可能偏严格，有规矩和纪律的传统')
  }

  return parts.join('；') + '。'
}

/** 构建兄弟姐妹分析段落 */
function buildSiblingAnalysis(bazi: BaziChart, sr: ReturnType<typeof analyzeSixRelatives>): string {
  const biJiePillars = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(
    p => p.tenGod === '比肩' || p.tenGod === '劫财'
  )
  const biJieCount = biJiePillars.length
  const parts: string[] = []

  if (biJieCount >= 3) {
    parts.push(`命局比劫较多（${biJieCount}柱），兄弟姐妹缘分深厚，成长过程中不乏同辈陪伴`)
    parts.push('但比劫多也意味着资源竞争——在家庭关注度、教育资源分配等方面可能存在潜在的角力')
    // 检查比劫是否受冲
    const chongHe = sr.parentsPalace
    if (chongHe.chongHe.length > 0) {
      parts.push('父母宫有冲合，兄弟姐妹之间可能存在性格或发展路径的显著差异')
    }
  } else if (biJieCount >= 1) {
    const pillarNames = biJiePillars.map((p, i) => {
      const labels = ['年柱', '月柱', '日柱', '时柱']
      const idx = [bazi.year, bazi.month, bazi.day, bazi.hour].indexOf(p)
      return labels[idx] || '某柱'
    })
    parts.push(`命局${biJieCount}柱透比劫（${pillarNames.join('、')}），有${biJieCount === 1 ? '一位' : '一两位'}兄弟姐妹缘分`)
    // 判断比劫是否得令
    const monthBranch = bazi.month.branch
    const biJieStems = biJiePillars.map(p => p.stem)
    const biJieElem = biJieStems.length > 0 ? STEM_ELEMENT[biJieStems[0]!] : null
    if (biJieElem === bazi.month.branchElement) {
      parts.push('比劫得月令之气，兄弟姐妹能力较强，对命主有一定助益')
    } else {
      parts.push('比劫失令，兄弟姐妹虽有心相助但自身能力或资源有限')
    }
  } else {
    parts.push('命局比劫不显，兄弟姐妹缘分较浅，可能为独生子女或与兄弟姐妹聚少离多')
  }

  return parts.join('。') + '。'
}

function statusLabel(status: StarStatus): string {
  switch (status) {
    case '受生': return '🟢 受生（得生助，吉）'
    case '得地': return '🟢 得地（在局中有力）'
    case '受克': return '🔴 受克（被克制，关系复杂）'
    case '伏藏': return '🟡 伏藏（力量较弱）'
    case '无': return '⚪ 不显（局中无此星）'
  }
}

// ============================================================
// 6. 事业前程分析
// ============================================================

interface CareerProfile {
  suitableIndustries: string[]
  suitableRoles: string[]
  bestDirections: string[]
  bestCities: string[]
  sideHustles: string[]
  workEnvironment: string
  wealthAdvice: string
  timingAdvice: string
}

export function analyzeCareer(result: AnalysisResult): CareerProfile {
  const { bazi, bodyStrength, favorableElements, unfavorableElements } = result
  const dm = bazi.dayMaster
  const dmElem = STEM_ELEMENT[dm]

  // === 行业推荐（基于喜用神五行） ===
  const industryMap: Record<FiveElement, string[]> = {
    '木': ['教育/培训', '文化传媒', '出版/写作', '医药/健康', '环保/林业', '设计/艺术', '人力资源管理', '咨询顾问'],
    '火': ['互联网/科技', '能源/电力', '餐饮/食品', '娱乐/影视', '市场营销', '美容/化妆', '航空/航天', '电子/半导体'],
    '土': ['房地产/建筑', '金融/银行', '矿产/资源', '农业/畜牧', '仓储/物流', '酒店/旅游', '保险/证券', '土木工程'],
    '金': ['机械/制造', '汽车/交通', '法律/司法', '审计/会计', '军事/安保', '珠宝/奢侈品', '外科医疗', '精密仪器'],
    '水': ['航运/海运', '贸易/进出口', '旅游/酒店', '渔业/水产', '广告/公关', '心理咨询', '新闻/传媒', '饮品/酒业'],
  }

  const roleMap: Record<FiveElement, string[]> = {
    '木': ['管理者', '策划师', '培训师', '创业者', '产品经理', '教师'],
    '火': ['销售总监', '创意总监', '演说家', '演员', '市场总监', 'CEO'],
    '土': ['财务主管', '项目经理', '工程师', '运营总监', '投资经理', '行政总监'],
    '金': ['律师', '法官', '审计师', '外科医生', '企业高管', '技术专家'],
    '水': ['外交官', '心理咨询师', '研究员', '作家', '记者', '战略顾问'],
  }

  const profile: CareerProfile = {
    suitableIndustries: [],
    suitableRoles: [],
    bestDirections: [],
    bestCities: [],
    sideHustles: [],
    workEnvironment: '',
    wealthAdvice: '',
    timingAdvice: '',
  }

  // 行业推荐
  for (const elem of favorableElements) {
    profile.suitableIndustries.push(...(industryMap[elem] || []))
  }
  profile.suitableIndustries = [...new Set(profile.suitableIndustries)].slice(0, 6)

  // 角色推荐（基于日主+十神）
  const monthGod = bazi.month.tenGod
  if (monthGod === '正官' || monthGod === '偏官') {
    profile.suitableRoles = ['管理者', '公务员', '企业高管', '执法人员', '项目经理']
  } else if (monthGod === '正财' || monthGod === '偏财') {
    profile.suitableRoles = ['创业者', '投资人', '财务总监', '商人', '销售总监']
  } else if (monthGod === '食神' || monthGod === '伤官') {
    profile.suitableRoles = ['创意总监', '艺术家', '设计师', '自由职业者', '技术专家']
  } else if (monthGod === '正印' || monthGod === '偏印') {
    profile.suitableRoles = ['学者', '研究员', '教师', '医生', '顾问']
  } else {
    profile.suitableRoles = roleMap[dmElem] || ['管理者', '创业者']
  }

  // === 方位推荐（基于喜用神五行方位） ===
  const directionMap: Record<FiveElement, { dir: string; cities: string[] }> = {
    '木': { dir: '东方', cities: ['上海', '杭州', '苏州', '南京', '青岛', '厦门', '台北'] },
    '火': { dir: '南方', cities: ['深圳', '广州', '香港', '海口', '南宁', '昆明', '三亚'] },
    '土': { dir: '中部/本地', cities: ['北京', '天津', '郑州', '武汉', '长沙', '成都', '重庆'] },
    '金': { dir: '西方', cities: ['西安', '兰州', '乌鲁木齐', '银川', '成都', '重庆', '昆明'] },
    '水': { dir: '北方', cities: ['北京', '哈尔滨', '沈阳', '大连', '天津', '长春', '济南'] },
  }

  for (const elem of favorableElements) {
    const d = directionMap[elem]
    if (d) {
      profile.bestDirections.push(d.dir)
      profile.bestCities.push(...d.cities)
    }
  }
  profile.bestCities = [...new Set(profile.bestCities)].slice(0, 8)

  // === 副业推荐 ===
  const sideMap: Record<FiveElement, string[]> = {
    '木': ['内容创作（公众号/视频）', '线上课程讲师', '绿色植物/盆栽售卖', '文案策划外包', '健康管理顾问'],
    '火': ['短视频/直播', '个人IP打造', '电商带货', '活动策划', '摄影/摄像'],
    '土': ['房产投资咨询', '二手交易', '收纳整理师', '农产品电商', '投资理财顾问'],
    '金': ['法律咨询', '高端定制服务', '技术外包', '珠宝鉴定', '企业管理咨询'],
    '水': ['知识付费', '心理咨询', '翻译/同传', '跨境贸易', '海外代购'],
  }

  // 用次旺五行做副业
  const sortedElems = Object.entries(result.fiveElementDistribution).sort((a, b) => b[1] - a[1])
  const secondaryElem = (sortedElems[1]?.[0] || sortedElems[0]?.[0]) as FiveElement
  if (secondaryElem && sideMap[secondaryElem]) {
    profile.sideHustles = sideMap[secondaryElem].slice(0, 4)
  }

  // === 工作环境 ===
  if (bodyStrength === '身强') {
    profile.workEnvironment = '适合竞争激烈、快节奏的环境。大公司、创业团队、高压高回报的行业能激发最佳状态。不宜过于安逸，需要持续挑战。'
  } else if (bodyStrength === '身弱') {
    profile.workEnvironment = '适合稳定、有体系支撑的环境。大型机构、国企、事业单位，或加入成熟的团队而非单打独斗。需要印星的庇护和平台的加持。'
  } else {
    profile.workEnvironment = '适应力强，大小公司皆可，但需要找到合适的团队文化。适合自己的节奏感最重要。'
  }

  // === 财运建议 ===
  const caiCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(
    p => p.tenGod === '正财' || p.tenGod === '偏财'
  ).length
  if (caiCount >= 2 && bodyStrength === '身强') {
    profile.wealthAdvice = '财星得力，身强能担财。建议主业深耕+副业拓展双线并行，正偏财皆可把握。投资可适度激进，但仍需分散风险。'
  } else if (caiCount >= 2 && bodyStrength === '身弱') {
    profile.wealthAdvice = '财多身弱，需借平台之力而非独自承担。建议以稳定薪资为主，投资以稳健型（定投、债券）为重，切忌高杠杆。'
  } else if (caiCount === 0) {
    profile.wealthAdvice = '命局财星不显，财富需靠食伤生财（用技能、知识变现），而非直接求财。先积累专业口碑，财自然随之而来。'
  } else {
    profile.wealthAdvice = '财运中等，稳扎稳打是正道。建议建立多条收入来源，但每个方向都要做扎实后再拓展。'
  }

  // === 时机建议 ===
  const currentFortune = result.currentFortune
  if (currentFortune) {
    const god = currentFortune.tenGod
    if (god === '正财' || god === '偏财') {
      profile.timingAdvice = `当前正行**${currentFortune.stem}${currentFortune.branch}**财运（${currentFortune.startAge}-${currentFortune.endAge}岁），是财富积累的黄金期，应把握机会大胆进取。`
    } else if (god === '正官' || god === '偏官') {
      profile.timingAdvice = `当前正行**${currentFortune.stem}${currentFortune.branch}**官运，事业上升期，适合在职场上谋求晋升，不宜轻举妄动换赛道。`
    } else if (god === '食神' || god === '伤官') {
      profile.timingAdvice = `当前正行**${currentFortune.stem}${currentFortune.branch}**食伤运，创意和技能变现的黄金期，特别适合开展副业和尝试新方向。`
    } else {
      profile.timingAdvice = `当前正行**${currentFortune.stem}${currentFortune.branch}**${god}运，宜稳扎稳打，积累实力，等待下一个机遇窗口。`
    }
  } else {
    profile.timingAdvice = '当前运势平稳，是蓄力沉淀的时期，为下一阶段做好能力积累。'
  }

  return profile
}

/** 动态生成角色推荐原因，基于八字实际数据 */
function generateRoleReasons(roles: string[], bazi: BaziChart, bodyStrength: string): string[] {
  const reasons: string[] = []
  const monthGod = bazi.month.tenGod
  const hourGod = bazi.hour.tenGod
  const yearGod = bazi.year.tenGod

  for (const role of roles) {
    let reason = ''
    if (role.includes('管理') || role.includes('经理') || role.includes('高管')) {
      const biJieCount = [bazi.year, bazi.month, bazi.hour].filter(p => p.tenGod === '比肩' || p.tenGod === '劫财').length
      reason = biJieCount > 0
        ? `月干${bazi.month.stem}比肩透出，有带队和管理能力`
        : bodyStrength === '身强' ? '身强能担事，领导气场足' : '格局中有统筹协调之才'
    } else if (role.includes('创业') || role.includes('商人')) {
      reason = monthGod === '偏财'
        ? `月令${bazi.month.stem}偏财当令，商业嗅觉敏锐`
        : bodyStrength === '身强' ? '财星有力，适合独立操盘' : '偏财灵动，眼力独到'
    } else if (role.includes('技术') || role.includes('专家')) {
      const yinCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(p => p.tenGod === '正印' || p.tenGod === '偏印').length
      reason = yinCount > 0 ? '印星得力，钻研能力突出' : '食伤泄秀，技术思维敏锐'
    } else if (role.includes('创意') || role.includes('设计') || role.includes('艺术')) {
      reason = (monthGod === '食神' || monthGod === '伤官')
        ? `月干${bazi.month.stem}食伤泄秀，创意表达能力强`
        : '五行配置利于创意输出'
    } else if (role.includes('自由') || role.includes('独立')) {
      reason = bazi.month.tenGod === '比肩'
        ? '比劫独立性强，不喜受制于人'
        : '命局有自主经营的先天倾向'
    } else if (role.includes('学者') || role.includes('研究') || role.includes('教师')) {
      reason = monthGod === '正印'
        ? `月干${bazi.month.stem}正印当令，学术天赋突出`
        : '印星得力，适合知识密集型工作'
    } else if (role.includes('销售') || role.includes('市场')) {
      reason = (monthGod === '食神' || monthGod === '伤官') ? '食伤吐秀，口才与社交能力突出' : '社交星神得力'
    } else if (role.includes('公务员') || role.includes('执法')) {
      reason = (monthGod === '正官' || monthGod === '偏官')
        ? `月令${bazi.month.stem}官星当权，体制内有发展空间`
        : '官星为用，适合规范化环境'
    } else if (role.includes('财务') || role.includes('投资')) {
      reason = monthGod === '正财'
        ? `月干${bazi.month.stem}正财合身，对财务数字敏感`
        : '财星透出，理财意识强'
    } else {
      reason = '五行配置匹配'
    }
    reasons.push(reason)
  }
  return reasons
}

/** 动态生成副业推荐原因 */
function generateSideReasons(bazi: BaziChart, bodyStrength: string): string[] {
  const reasons: string[] = []
  const shiShangCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(p => p.tenGod === '食神' || p.tenGod === '伤官').length
  const caiCount = [bazi.year, bazi.month, bazi.day, bazi.hour].filter(p => p.tenGod === '正财' || p.tenGod === '偏财').length

  if (shiShangCount >= 2) reasons.push('食伤双透，创意变现能力强')
  if (caiCount >= 2) reasons.push('财星多重，多条财路并行互不冲突')
  if (bodyStrength === '身强') reasons.push('身强能担多重角色，主业副业兼顾')
  if (bazi.month.tenGod === '偏财') reasons.push('偏财灵动，善于捕捉非常规收入机会')

  // 补充通用理由
  reasons.push('投入成本可控，回报周期合理')
  reasons.push('可发挥个人特长与兴趣')
  reasons.push('与主业五行互补，相得益彰')

  return reasons
}

export function renderCareerReport(result: AnalysisResult): string {
  const c = analyzeCareer(result)
  const { favorableElements, unfavorableElements } = result

  let md = '## 七、事业前程 (Career & Wealth)\n\n'

  // 行业推荐
  md += '### 💼 适配行业\n\n'
  md += '| 行业 | 关联五行 |\n|:---|:---|\n'
  const elemForIndustry: Record<string, FiveElement> = {}
  for (const elem of FIVE_ELEMENTS) {
    const industries = getIndustryByElem(elem)
    for (const ind of industries) {
      if (c.suitableIndustries.includes(ind)) {
        elemForIndustry[ind] = elem
      }
    }
  }
  for (const ind of c.suitableIndustries.slice(0, 8)) {
    const elem = elemForIndustry[ind] || favorableElements[0]!
    const sym = ELEM_SYMBOL[elem]
    md += `| ${ind} | ${sym}${elem} |\n`
  }
  // 添加八字依据说明
  const dmElem = STEM_ELEMENT[result.bazi.dayMaster]
  const monthGod = result.bazi.month.tenGod
  if (monthGod === '比肩' || monthGod === '劫财') {
    md += `\n> 命局${monthGod}当令，竞争意识和执行力强，适合需要主动出击的行业。`
  } else if (monthGod === '正官' || monthGod === '偏官') {
    md += `\n> 命局${monthGod}当权，规则意识和抗压能力强，适合体制内或规范化行业。`
  } else if (monthGod === '食神' || monthGod === '伤官') {
    md += `\n> 命局${monthGod}泄秀，创意表达能力强，适合创意/技术/艺术方向。`
  } else if (monthGod === '正财' || monthGod === '偏财') {
    md += `\n> 命局${monthGod}主导，对价值和资源敏感，适合金融/商业/贸易方向。`
  }
  md += '\n'

  // 角色推荐
  md += '### 🎯 适配角色\n\n'
  md += `| 适合岗位 | 原因 |\n|:---|:---|\n`
  const dynamicReasons = generateRoleReasons(c.suitableRoles, result.bazi, result.bodyStrength)
  for (let i = 0; i < c.suitableRoles.slice(0, 5).length; i++) {
    md += `| ${c.suitableRoles[i]!} | ${dynamicReasons[i] || '五行配置匹配'} |\n`
  }
  md += '\n'

  // 城市/方位
  md += '### 🗺️ 发展方位与城市\n\n'
  md += `> **最佳方位：** ${c.bestDirections.join('、')}\n\n`
  md += '**推荐城市：**\n\n'
  for (const city of c.bestCities.slice(0, 6)) {
    md += `- 🏙️ ${city}\n`
  }
  md += '\n'

  // 副业
  md += '### 💰 副业方向\n\n'
  md += '| 副业方向 | 适合理由 |\n|:---|:---|\n'
  const sideReasons = generateSideReasons(result.bazi, result.bodyStrength)
  for (let i = 0; i < c.sideHustles.length; i++) {
    md += `| ${c.sideHustles[i]!} | ${sideReasons[i] || '五行配置匹配'} |\n`
  }
  md += '\n'

  // 工作环境
  md += '### 🏢 工作环境偏好\n\n'
  md += `> ${c.workEnvironment}\n\n`

  // 财运
  md += '### 💎 财运与时机\n\n'
  md += `${c.wealthAdvice}\n\n`
  md += `${c.timingAdvice}\n\n`

  return md
}

function getIndustryByElem(elem: FiveElement): string[] {
  const map: Record<FiveElement, string[]> = {
    '木': ['教育/培训', '文化传媒', '出版/写作', '医药/健康', '环保/林业', '设计/艺术', '人力资源管理', '咨询顾问'],
    '火': ['互联网/科技', '能源/电力', '餐饮/食品', '娱乐/影视', '市场营销', '美容/化妆', '航空/航天', '电子/半导体'],
    '土': ['房地产/建筑', '金融/银行', '矿产/资源', '农业/畜牧', '仓储/物流', '酒店/旅游', '保险/证券', '土木工程'],
    '金': ['机械/制造', '汽车/交通', '法律/司法', '审计/会计', '军事/安保', '珠宝/奢侈品', '外科医疗', '精密仪器'],
    '水': ['航运/海运', '贸易/进出口', '旅游/酒店', '渔业/水产', '广告/公关', '心理咨询', '新闻/传媒', '饮品/酒业'],
  }
  return map[elem]
}

// ============================================================
// 综合报告整合
// ============================================================

export function renderAllPersonaReports(result: AnalysisResult): string {
  let md = ''
  md += renderPersonalityReport(result)
  md += '---\n\n'
  md += renderHealthReport(result)
  md += '---\n\n'
  md += renderAppearanceReport(result)
  md += '---\n\n'
  md += renderIntelligenceReport(result)
  md += '---\n\n'
  md += renderFamilyDeepReport(result)
  md += '---\n\n'
  md += renderCareerReport(result)
  return md
}
