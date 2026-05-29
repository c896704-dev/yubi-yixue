/** 八卦定义 */
export interface Trigram {
  name: string       // 卦名：乾/兑/离/震/巽/坎/艮/坤
  symbol: string     // 卦画符号：☰☱☲☳☴☵☶☷
  number: number     // 卦数：1-8
  element: FiveElement
  direction: string  // 方位：西北/西/南/东/东南/北/东北/西南
  image: string      // 象征：天/泽/火/雷/风/水/山/地
  person: string     // 人物：父/少女/中女/长男/长女/中男/少男/母
  body: string       // 身体：首/口/目/足/股/耳/手/腹
  animal: string     // 动物：马/羊/雉/龙/鸡/豕/狗/牛
  mnemonic: string   // 卦画口诀
  yangYao: number[]  // 阳爻位置（从下往上1-3），如乾=[1,2,3]
}

export type FiveElement = '金' | '木' | '水' | '火' | '土'

/** 六十四卦定义 */
export interface Hexagram {
  name: string           // 卦名：乾为天等
  upperTrigram: string   // 上卦名
  lowerTrigram: string   // 下卦名
  palace: string         // 所属宫：乾/坎/艮/震/巽/离/坤/兑
  palaceElement: FiveElement
  symbol: number         // 6位二进制卦画 0b000000-0b111111
  judgment: string       // 卦辞（现代中文简释，20-40字）
  meaning: string        // 释义（60-100字）
}

/** 六爻 — 纳甲装卦后的单爻 */
export interface YaoLine {
  index: number          // 1-6 从下往上
  value: 0 | 1           // 0=阴 1=阳
  changing: boolean      // 是否为变爻
  label: string          // 少阳/少阴/老阳/老阴
  gan?: string           // Y6-1: 天干
  zhi?: string           // Y6-1: 地支
  wuxing?: string        // Y6-1: 五行
  liuqin?: string        // Y6-1: 六亲
  shiying?: '世' | '应' | null  // Y6-2: 世应
}

/** 六爻纳甲装卦结果 */
export interface Sizhu {
  year:  { gan: string; zhi: string; full: string }
  month: { gan: string; zhi: string; full: string }
  day:   { gan: string; zhi: string; full: string }
  hour:  { gan: string; zhi: string; full: string }
}

export interface LiuyaoNaja {
  lines: YaoLine[]
  palaceName: string; palaceElement: string
  isLiuChong: boolean; isLiuHe: boolean; isStatic: boolean; isChunGua: boolean
  monthZhi: string; monthWuxing: string; dayZhi: string; dayWuxing: string
  castTime: string
  sizhu: Sizhu            // 完整四柱
  jieqi: string           // 节气区间
  chiShiLiqin: string     // 持世六亲
  chiShiText: string      // 持世吉凶含义
  ceShu: number           // 策数
  guiShu: number          // 轨数
}

/** 六爻起卦结果 */
export interface LiuyaoResult {
  lines: YaoLine[]       // 6爻（含纳甲）
  originalHexagram: Hexagram
  originalName: string
  changingPositions: number[]
  changedHexagram: Hexagram | null
  changedName: string | null
  method: 'coin' | 'number' | 'random'
  numbers?: number[]
  naja?: LiuyaoNaja     // Y6-1: 纳甲装卦数据
  timestamp: number
}

/** 卦气旺衰 */
export interface SeasonalStrength {
  monthName: string     // 农历月名
  monthElement: string  // 月支五行
  tiState: string       // 体卦状态（旺/相/休/囚/死）
  yongState: string     // 用卦状态
  summary: string
}

/** 应期推算 */
export interface YingQi {
  method: string
  description: string
  timeRange: string
}

/** 一体百用交叉分析 */
export interface TiBaiYong {
  huToTi: string
  changedToTi: string
  summary: string
}

/** 梅花易数起卦结果 */
export interface MeihuaResult {
  upperTrigram: Trigram
  lowerTrigram: Trigram
  originalHexagram: Hexagram
  changingYao: number
  changedHexagram: Hexagram
  huHexagram: Hexagram
  huFromChanged: boolean     // F-2: 互卦是否来自变卦（乾坤无互）
  tiYong: TiYongRelation
  changedTiYong: TiYongRelation | null  // F-6: 变卦体用
  cuoHexagram: Hexagram | null          // F-11: 错卦
  zongHexagram: Hexagram | null         // F-11: 综卦
  seasonalStrength: SeasonalStrength    // F-5: 卦气旺衰
  yingQi: YingQi                        // F-4: 应期
  tiBaiYong: TiBaiYong                  // F-7: 一体百用
  calcProcess: string                   // F-3: 起卦过程
  method: 'number' | 'time' | 'text'
  numbers?: number[]
  text?: string
  timestamp: number
}

/** 体用生克关系 */
export interface TiYongRelation {
  ti: Trigram            // 体卦（无动爻之卦）
  yong: Trigram          // 用卦（有动爻之卦）
  tiElement: FiveElement
  yongElement: FiveElement
  relation: '体克用' | '用克体' | '体生用' | '用生体' | '体用比和'
  judgment: string       // 吉凶断语
}

/** 算卦历史记录 */
export interface DivinationRecord {
  id: string
  type: 'liuyao' | 'meihua'
  method: string
  question: string
  hexagramData: LiuyaoResult | MeihuaResult
  aiInterpretation: string | null
  createdAt: number
  label: string
}
