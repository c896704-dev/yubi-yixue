import type { HeavenlyStem, EarthlyBranch, TenGod, FiveElement, YinYang } from './constants'
import type { StrengthResult, ClimateResult } from './utils/wangshuai'
import type { YongShenResult } from './utils/yongshen'
import type { ShenShaResult } from './utils/shensha'
import type { ChongHeResult } from './utils/chonghe'

export interface Pillar {
  stem: HeavenlyStem
  branch: EarthlyBranch
  stemElement: FiveElement
  branchElement: FiveElement
  naYin: string
  hiddenStems: string[]
  tenGod: TenGod
  stemYinYang: YinYang
  branchYinYang: YinYang
}

export interface BaziChart {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar
  dayMaster: HeavenlyStem
  dayMasterElement: FiveElement
  dayMasterYinYang: YinYang
}

export interface BigFortune {
  startAge: number
  endAge: number
  stem: HeavenlyStem
  branch: EarthlyBranch
  naYin: string
  tenGod: TenGod
  element: FiveElement
}

export interface PersonInfo {
  name: string
  gender: '男' | '女'
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  birthMinute: number
  birthPlace: string
  longitude: number
}

export interface AnalysisResult {
  bazi: BaziChart
  person: PersonInfo
  bigFortunes: BigFortune[]
  currentFortune?: BigFortune
  summary: string
  warnings: string[]
  fiveElementDistribution: Record<FiveElement, number>
  bodyStrength: string
  favorableElements: FiveElement[]
  unfavorableElements: FiveElement[]
  geJu: string
  // 新增：古籍引擎字段
  strengthDetail: StrengthResult
  yongShen: YongShenResult
  shenSha: ShenShaResult
  chongHe: ChongHeResult
  taiYuan: { stem: HeavenlyStem; branch: EarthlyBranch }
  mingGong: { stem: HeavenlyStem; branch: EarthlyBranch }
  climate: ClimateResult
  specialGeJu?: string
}

export interface CompatibilityResult {
  male: AnalysisResult
  female: AnalysisResult
  scores: {
    attraction: number
    stability: number
    complement: number
    total: number
  }
  /** 各维度评分明细 */
  scoreBreakdown?: {
    attraction: { factors: { name: string; contribution: number; reason: string }[]; methodology: string }
    stability: { factors: { name: string; contribution: number; reason: string }[]; methodology: string }
    complement: { factors: { name: string; contribution: number; reason: string }[]; methodology: string }
  }
  relationshipModel: string
  advantages: string[]
  weaknesses: string[]
  warnings: string[]
  verdict: string
  suggestion: string
  /** 大运同步分析 */
  fortuneSync?: {
    currentSync: string
    nextFortuneSync: string
    description: string
  }
}

/** 排盘配置 — 用于报告中的方法论说明 */
export interface PaipanConfig {
  useTrueSolar: boolean
  originalTime: string
  solarTime: string
  altHourPillar: string
  altDayMaster?: string
  isZiShi: boolean
  daYunStartAge: number
}
