/** 天干 */
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number]

/** 地支 */
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number]

/** 五行 */
export const FIVE_ELEMENTS = ['木', '火', '土', '金', '水'] as const
export type FiveElement = (typeof FIVE_ELEMENTS)[number]

/** 阴阳 */
export type YinYang = '阳' | '阴'

/** 十神 */
export const TEN_GODS = ['比肩', '劫财', '食神', '伤官', '正财', '偏财', '正官', '偏官', '正印', '偏印'] as const
export type TenGod = (typeof TEN_GODS)[number]

/** 纳音 */
export const NA_YIN = [
  '海中金','炉中火','大林木','路旁土','剑锋金','山头火',
  '涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土',
  '霹雳火','松柏木','长流水','砂中金','山下火','平地木',
  '壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金',
  '桑柘木','柘榴木','大海水','石榴木','大海水','海中金',
] as const

/** 地支藏干 */
export const HIDDEN_STEMS: Record<EarthlyBranch, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
}

/** 天干五行映射 */
export const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  '甲': '木','乙': '木','丙': '火','丁': '火','戊': '土',
  '己': '土','庚': '金','辛': '金','壬': '水','癸': '水',
}

/** 地支五行映射 */
export const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  '子': '水','丑': '土','寅': '木','卯': '木',
  '辰': '土','巳': '火','午': '火','未': '土',
  '申': '金','酉': '金','戌': '土','亥': '水',
}

/** 天干阴阳映射 */
export const STEM_YIN_YANG: Record<HeavenlyStem, YinYang> = {
  '甲': '阳','乙': '阴','丙': '阳','丁': '阴','戊': '阳',
  '己': '阴','庚': '阳','辛': '阴','壬': '阳','癸': '阴',
}

/** 地支阴阳映射 */
export const BRANCH_YIN_YANG: Record<EarthlyBranch, YinYang> = {
  '子': '阳','丑': '阴','寅': '阳','卯': '阴',
  '辰': '阳','巳': '阴','午': '阳','未': '阴',
  '申': '阳','酉': '阴','戌': '阳','亥': '阴',
}

/** 生肖映射 */
export const ZODIAC: Record<EarthlyBranch, string> = {
  '子': '鼠','丑': '牛','寅': '虎','卯': '兔',
  '辰': '龙','巳': '蛇','午': '马','未': '羊',
  '申': '猴','酉': '鸡','戌': '狗','亥': '猪',
}

/** 地支节气月份映射（寅月为正月=立春到惊蛰） */
export const BRANCH_MONTH_MAP: Record<EarthlyBranch, string> = {
  '寅': '正月(立春-惊蛰)', '卯': '二月(惊蛰-清明)',
  '辰': '三月(清明-立夏)', '巳': '四月(立夏-芒种)',
  '午': '五月(芒种-小暑)', '未': '六月(小暑-立秋)',
  '申': '七月(立秋-白露)', '酉': '八月(白露-寒露)',
  '戌': '九月(寒露-立冬)', '亥': '十月(立冬-大雪)',
  '子': '十一月(大雪-小寒)', '丑': '十二月(小寒-立春)',
}

/** 五虎遁：年上起月法，年干→正月(寅月)天干 */
export const MONTH_STEM_BY_YEAR: Record<HeavenlyStem, HeavenlyStem[]> = {
  '甲': ['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
  '乙': ['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
  '丙': ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
  '丁': ['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  '戊': ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
  '己': ['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
  '庚': ['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
  '辛': ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
  '壬': ['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  '癸': ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
}

/** 五鼠遁：日上起时法，日干→子时天干 */
export const HOUR_STEM_BY_DAY: Record<HeavenlyStem, HeavenlyStem[]> = {
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

/** 十神生克关系：日干与其他天干的关系 */
export function getTenGod(dayStem: HeavenlyStem, targetStem: HeavenlyStem): TenGod {
  const dayYinYang = STEM_YIN_YANG[dayStem]
  const targetYinYang = STEM_YIN_YANG[targetStem]
  const sameYinYang = dayYinYang === targetYinYang

  // 同我 = 比劫
  if (targetStem === dayStem) return '比肩'

  const dayElem = STEM_ELEMENT[dayStem]
  const targetElem = STEM_ELEMENT[targetStem]

  // 同五行不同阴阳 = 劫财（如戊土+己土、甲木+乙木）
  if (dayElem === targetElem) return '劫财'

  // 我生 = 食伤
  if (
    (dayElem === '木' && targetElem === '火') ||
    (dayElem === '火' && targetElem === '土') ||
    (dayElem === '土' && targetElem === '金') ||
    (dayElem === '金' && targetElem === '水') ||
    (dayElem === '水' && targetElem === '木')
  ) {
    return sameYinYang ? '食神' : '伤官'
  }

  // 我克 = 财
  if (
    (dayElem === '木' && targetElem === '土') ||
    (dayElem === '火' && targetElem === '金') ||
    (dayElem === '土' && targetElem === '水') ||
    (dayElem === '金' && targetElem === '木') ||
    (dayElem === '水' && targetElem === '火')
  ) {
    return sameYinYang ? '偏财' : '正财'
  }

  // 克我 = 官
  if (
    (targetElem === '木' && dayElem === '土') ||
    (targetElem === '火' && dayElem === '金') ||
    (targetElem === '土' && dayElem === '水') ||
    (targetElem === '金' && dayElem === '木') ||
    (targetElem === '水' && dayElem === '火')
  ) {
    return sameYinYang ? '偏官' : '正官'
  }

  // 生我 = 印
  return sameYinYang ? '偏印' : '正印'
}

/** 天干对应的纳音五行 */
export function getNaYin(stem: HeavenlyStem, branch: EarthlyBranch): string {
  const idx = (HEAVENLY_STEMS.indexOf(stem) + EARTHLY_BRANCHES.indexOf(branch)) % NA_YIN.length
  return NA_YIN[idx] ?? '海中金'
}

/** 完整的六十甲子纳音表 */
export const SIXTY_JIAZI_NAYIN: Record<string, string> = {
  '甲子': '海中金','乙丑': '海中金','丙寅': '炉中火','丁卯': '炉中火',
  '戊辰': '大林木','己巳': '大林木','庚午': '路旁土','辛未': '路旁土',
  '壬申': '剑锋金','癸酉': '剑锋金','甲戌': '山头火','乙亥': '山头火',
  '丙子': '涧下水','丁丑': '涧下水','戊寅': '城头土','己卯': '城头土',
  '庚辰': '白蜡金','辛巳': '白蜡金','壬午': '杨柳木','癸未': '杨柳木',
  '甲申': '泉中水','乙酉': '泉中水','丙戌': '屋上土','丁亥': '屋上土',
  '戊子': '霹雳火','己丑': '霹雳火','庚寅': '松柏木','辛卯': '松柏木',
  '壬辰': '长流水','癸巳': '长流水','甲午': '砂中金','乙未': '砂中金',
  '丙申': '山下火','丁酉': '山下火','戊戌': '平地木','己亥': '平地木',
  '庚子': '壁上土','辛丑': '壁上土','壬寅': '金箔金','癸卯': '金箔金',
  '甲辰': '覆灯火','乙巳': '覆灯火','丙午': '天河水','丁未': '天河水',
  '戊申': '大驿土','己酉': '大驿土','庚戌': '钗钏金','辛亥': '钗钏金',
  '壬子': '桑柘木','癸丑': '桑柘木','甲寅': '大溪水','乙卯': '大溪水',
  '丙辰': '沙中土','丁巳': '沙中土','戊午': '天上火','己未': '天上火',
  '庚申': '石榴木','辛酉': '石榴木','壬戌': '大海水','癸亥': '大海水',
}
