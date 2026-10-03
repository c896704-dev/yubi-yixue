/**
 * 文档投影模型 —— 报告的「第三种形态」。
 *
 * 屏幕用 JSX 渲染（`ChapterBody`），Word / 打印用这里的**中性块**描述。
 * 做这一层的原因：
 *  - 屏幕的 JSX 无法直接变成 docx（SVG 仪表盘、可点选时间轴在 Word 里没有对应物）
 *  - 但**章节的存在与否、顺序、标题、序号**必须两边完全一致 —— 那部分不在这里，
 *    而在 `resolveChapters()`：ReportView 与导出器调用的是同一个函数，
 *    所以「Word 比屏幕少一章 / 多一章 / 编号对不上」在结构上不可能发生。
 *
 * 本模型刻意做小（8 种块）。新增板块要加块类型之前先问：能不能用已有的表达？
 * 块越少，导出器的排版规则就越少，Word 观感就越统一。
 */

/** 文字色调。导出器负责映射到具体色值，本模型不出现颜色。 */
export type DocTone = 'ink' | 'qing' | 'gold' | 'sha' | 'muted'

/** 等宽小格（八信息盘 / 三垣卡这类"一格一象"的视觉单元） */
export interface DocCell {
  /** 格子上方的小字标签 */
  label?: string
  /** 主值（大字号） */
  value?: string
  /** 主值下方的小字（纳音、宫位等） */
  sub?: string
  /** 角标（如「同年柱」） */
  note?: string
}

/** 段内的富文本片段（仅用于保留 Markdown 里的 `**强调**`） */
export interface DocRun {
  text: string
  bold?: boolean
}

export type DocBlock =
  /** 章内小标题（如单个四象段、单张关系卡） */
  | { t: 'h'; text: string; level?: 2 | 3 }
  /** 段落。给了 `runs` 时以它为准，`text` 只作纯文本备份 */
  | { t: 'p'; text: string; runs?: DocRun[]; tone?: DocTone; bold?: boolean; small?: boolean; indent?: boolean }
  /** 古籍引文（屏幕上是带 Quote 图标的取象原文） */
  | { t: 'cite'; text: string }
  /** 无序列表 */
  | { t: 'list'; items: string[]; small?: boolean; tone?: DocTone }
  /** 字段行（标签 + 值），如刑冲害 / 旬空 / 明干五行 */
  | { t: 'fields'; rows: { k: string; v: string; tone?: DocTone }[] }
  /** 等宽格子表，每行 N 格 */
  | { t: 'grid'; rows: DocCell[][] }
  /** 普通表格 */
  | { t: 'table'; head?: string[]; rows: string[][]; small?: boolean }
  /** 灰色小字说明（口径提示、方法论尾注） */
  | { t: 'note'; text: string }
