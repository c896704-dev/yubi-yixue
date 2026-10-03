import type { ReactNode } from 'react'
import type { PersonInfo } from '../types'
import type { DocBlock } from './docModel'

/**
 * 报告章节模型 —— 全站报告的唯一结构契约。
 *
 * 解决的问题（见《P2-1 报告骨架标准化方案》§0）：
 *  - 根因 A：此前没有「报告」这个对象，四个板块各写一套章节拼装，目录只能反过来扫 DOM
 *  - 根因 B：显示文本与 AI 输入是同一个字符串，导致"改显示必动 AI"
 *  - 根因 C：「AI 正文不可改」只是文档里的一张表，没有类型约束
 *
 * 设计要点：
 *  1) 章节是**数据**，不是 JSX 结构。顺序 = 数组顺序。
 *  2) `body` 与 `aiContext` **彻底分离**：前者给读者看，后者喂给模型，各自演进。
 *  3) `kind: 'ai'` 让"AI 生成"成为类型事实，而不是靠人记的白名单。
 *  4) 序号由呈现层派生（见 deriveChapterNums），章节数据里**不含序号**。
 */

/** 章节性质。决定呈现层的默认处理方式。 */
export type ChapterKind =
  /** 引擎结论：模板生成，可自由改写 */
  | 'engine'
  /** AI 生成：正文一字不可改，只允许调整承载（容器/位置/折叠） */
  | 'ai'
  /** 纯数据展示：表格 / 图表 / 时间轴 */
  | 'data'

/**
 * AI 章节的运行时内容。
 *
 * AI 正文来自异步请求，属于页面状态而非报告结构，因此不放进 `ReportSpec`，
 * 而是按 `chapter.id` 由 `ReportContext.ai` 在渲染时提供。
 * 这样 ReportView 能对所有 `kind:'ai'` 章节统一施加 AI 承载（标题/标识/折叠/锚点），
 * 页面只需把文本塞进来。
 */
export interface AiSlot {
  text: string | null
  loading?: boolean
  error?: string | null
  /** 标题右侧操作位（如「重新解读」） */
  action?: ReactNode
}

/** 构造与渲染期上下文。各板块用泛型收窄 `result` 的具体类型。 */
export interface ReportContext<R = unknown> {
  result: R
  person?: PersonInfo
  /** AI 章节内容，键为 chapter.id */
  ai?: Record<string, AiSlot>
}

/** 章节正文。string 视为 Markdown；函数形式用于需要 JSX 的板块（识人、算卦）。 */
export type ChapterBody<R = unknown> =
  | string
  | ((ctx: ReportContext<R>) => ReactNode)

interface ChapterBase<R> {
  /** 锚点 id，全局唯一。呈现层统一据此生成跳转与 scroll-margin */
  id: string
  /**
   * 章节标题，**不含序号** —— 序号是呈现层的事。
   * 需要带运行时数字时（如「取前 N 条」）用函数形式，避免标题与实际渲染内容不符。
   */
  title: string | ((ctx: ReportContext<R>) => string)

  /** 附挂在正文之后的额外内容（如八字的事业地图、运程时间轴） */
  aside?: (ctx: ReportContext<R>) => ReactNode

  /** 章节头图标（渲染在序号之后、标题之前） */
  icon?: ReactNode

  /**
   * 章节头右侧的附加内容（状态徽章等，如「两口径结论存在实质翻转」）。
   * 语义上属于章节头的状态提示，不应塞进正文。
   */
  headerExtra?: (ctx: ReportContext<R>) => ReactNode

  /** 给章节卡附加的变体类名（如 rs-alt-banner 提供金色左边框强调） */
  variant?: string

  /**
   * 喂给 AI 的上下文。**与 body 完全独立**。
   *
   * 迁移纪律（方案 §4.2）：从旧实现搬家时，本字段必须与被替换的字符串**逐字相同**，
   * 否则 AI 输出会漂移且无法归因。显示侧可以自由精简，AI 侧不受影响。
   * 若 AI 输入本就取自引擎对象（如识人/合婚），则**不需要**本字段。
   *
   * 函数形式用于上下文随结果变化的板块（如算卦的代码层分析）。
   */
  aiContext?: string | ((ctx: ReportContext<R>) => string)

  /** 附录：不占用正文章节号，单独编为「附录A/附录B…」 */
  appendix?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
  /**
   * 可见性谓词。返回 false 时整章（含卡头与序号）都不出现——
   * 用于只在特定条件下存在的章节（如晚子时才有的换日口径披露、有节点时才出的重引动一览）。
   * 注意：**不是**用来隐藏内容的开关，条件不满足时应视为"本章不存在"。
   */
  when?: (ctx: ReportContext<R>) => boolean
}

/** 引擎 / 数据章节：正文由本 spec 提供 */
export interface ContentChapter<R> extends ChapterBase<R> {
  kind: 'engine' | 'data'
  body: ChapterBody<R>
  /**
   * Word / 打印导出时的正文投影。**只描述内容，不描述排版**——字号、间距、
   * 分页由导出器统一决定（见 report/exportDocx.ts）。
   *
   * 为什么屏幕的 `body` 不能自动变成 Word：`body` 返回的是 ReactNode，
   * 里面的仪表盘、可点选时间轴在文档里没有对应物。所以每个章节要显式声明
   * 它在文档里的样子。没写 `doc` 的章节**不会被静默跳过**——导出器会直接抛错，
   * 避免出现"少了一章但没人发现"的文档。
   *
   * 注意：`body` 与 `doc` 是同一份内容的两种呈现，改一个就要改另一个；
   * 两边的**章节标题、顺序、序号、可见条件**由 resolveChapters 保证一致，无需操心。
   */
  doc?: (ctx: ReportContext<R>) => DocBlock[]
}

/**
 * AI 章节：**不允许写 body**。
 *
 * 这是「AI 正文不可改」从文档约定升级为**类型约束**的地方（方案根因 C）——
 * 想往 spec 里塞一段 AI 文案会直接编译不过，而不是靠人记得查白名单。
 * 正文由 `ReportContext.ai[chapter.id]` 在运行时提供，呈现层统一套用 AI 承载。
 */
export interface AiChapter<R> extends ChapterBase<R> {
  kind: 'ai'
  body?: never
  /** AI 卡上方的补充说明（组件固定文案，非 AI 输出） */
  note?: string
}

export type ReportChapter<R = unknown> = ContentChapter<R> | AiChapter<R>

export interface ReportSpec<R = unknown> {
  /** 用于打印页眉与 Word 导出标题 */
  title: string
  subtitle?: string
  chapters: ReportChapter<R>[]
}

const CN_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']

/**
 * 派生章节序号 —— **全站序号的唯一产生点**。
 *
 * 正文按非附录章节的顺序编为 一/二/三…；附录单独编为 附录A/附录B…
 * 返回数组与传入的 chapters 一一对应。
 */
/**
 * 派生章节序号 —— **全站序号的唯一产生点**。
 *
 * 规则（与 P1-1 建立的「卡头 = 导航 编号一致」不变式绑定）：
 *  - 正文（`kind: 'engine' | 'data'`）按顺序编为 一/二/三…
 *  - `appendix` 单独编为 附录A/附录B…
 *  - `kind: 'ai'` **不占号**，返回空串。原因：AI 卡按设计不显示序号（八字/合婚/识人
 *    三处共用同一承载），若导航给它编号，就会出现"导航说十二、卡上没有十二"的错位。
 *    语义上也自洽：序号只给可核查的引擎结论，AI 是延伸段。
 *
 * 返回数组与传入的 chapters 一一对应。
 */
export function deriveChapterNums<R = unknown>(chapters: ReportChapter<R>[]): string[] {
  let main = 0
  let appendix = 0
  return chapters.map((c) => {
    if (c.kind === 'ai') return ''
    if (c.appendix) {
      const letter = String.fromCharCode(65 + appendix) // 附录A、附录B…
      appendix += 1
      return `附录${letter}`
    }
    const n = CN_NUMS[main] ?? String(main + 1)
    main += 1
    return n
  })
}

/** 已解析的章节：可见性、序号、标题都已求值，可直接交给任何呈现介质。 */
export interface ResolvedChapter<R = unknown> {
  chapter: ReportChapter<R>
  /** 已求值的标题（spec 里可以是函数） */
  title: string
  /** 已派生的序号；AI 章节为空串 */
  num: string
}

/**
 * **「这份报告有哪些章节」的唯一答案** —— 屏幕、Word、打印共用。
 *
 * 两处过滤都必须发生在派生序号之前（踩过的坑）：
 *  1. `when` 不满足 → 视为"本章不存在"，不占号、不进目录
 *  2. `kind:'ai'` 但 ctx 没给槽位（如楼盘位置分析没有 AI 报告）→ 同样整章跳过。
 *     若把过滤留到渲染时做，目录里会留下一个点不开的幽灵条目。
 *
 * 这是 P2-1 迁移后 Phase 2 的关键一步：此前「屏幕的章节」由 ReportView 决定、
 * 「Word 的章节」由 docxExport 自己手写，两者只能靠人肉对齐（实际已经漂移过：
 * Word 有「尊卑生克链」「胎息·元神画像」等屏幕并不存在的独立章节）。
 * 现在两边调同一个函数，**结构一致性由构造成立，不靠纪律**。
 */
export function resolveChapters<R>(
  spec: ReportSpec<R>,
  ctx: ReportContext<R>,
): ResolvedChapter<R>[] {
  const chapters = spec.chapters
    .filter((c) => !c.when || c.when(ctx))
    .filter((c) => c.kind !== 'ai' || Boolean(ctx.ai?.[c.id]))
  const nums = deriveChapterNums(chapters)
  return chapters.map((c, i) => ({
    chapter: c,
    title: typeof c.title === 'function' ? c.title(ctx) : c.title,
    num: nums[i] ?? '',
  }))
}

/** 汇总一份报告要喂给 AI 的全部上下文（按章节顺序，跳过未提供 aiContext 的章节）。 */
