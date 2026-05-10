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

/** 六爻 — 单爻 */
export interface YaoLine {
  index: number          // 1-6 从下往上
  value: 0 | 1           // 0=阴 1=阳
  changing: boolean      // 是否为变爻
  label: string          // 少阳/少阴/老阳/老阴
}

/** 六爻起卦结果 */
export interface LiuyaoResult {
  lines: YaoLine[]       // 6爻
  originalHexagram: Hexagram
  originalName: string
  changingPositions: number[]
  changedHexagram: Hexagram | null
  changedName: string | null
  method: 'coin' | 'number' | 'random'
  numbers?: number[]     // 数字起卦时的三个数
  timestamp: number
}

/** 梅花易数起卦结果 */
export interface MeihuaResult {
  upperTrigram: Trigram
  lowerTrigram: Trigram
  originalHexagram: Hexagram
  changingYao: number    // 1-6 动爻位置
  changedHexagram: Hexagram
  huHexagram: Hexagram   // 互卦
  tiYong: TiYongRelation
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
