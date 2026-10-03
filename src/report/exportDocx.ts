/**
 * 报告 Word 导出器 —— 由 `ReportSpec` 驱动，**屏幕与文档共用同一份章节结构**。
 *
 * 与旧实现（src/utils/docxExport.ts，已删除）的区别：
 *  - 旧版是手写的第二套章节表：标题写死、序号写死、章节切分与屏幕不同步。
 *    实际已经漂移——Word 里有「尊卑生克链」「胎息·元神画像」等屏幕上并不存在的
 *    独立章节，而屏幕上有的「限运四段」「三垣落地」它又没有。
 *  - 新版章节来自 `resolveChapters(spec, ctx)`，与 ReportView **调的是同一个函数**：
 *    哪些章节存在、什么顺序、什么标题、编号是几，两边由构造成立地一致。
 *  - 正文由各章节自己的 `doc(ctx)` 投影提供（屏幕是 JSX，文档是中性块）。
 *    少了投影不会静默略过——直接抛错（见 assertProjected）。
 *
 * 排版原则：**紧凑、正常大小**。正文 10pt、辅助 9pt、小注 8.5pt，行距 1.25，
 * 2cm 页边距。屏幕上的展示型大字（命盘 30px 等）在文档里没有对应概念，
 * 一律回到文档尺度——文档不是网页截图。
 */

import {
  AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph,
  ShadingType, Table, TableCell, TableRow, TextRun, WidthType, type IBorderOptions,
} from 'docx'
import type { DocBlock, DocCell, DocRun, DocTone } from './docModel'
import { resolveChapters, type ReportContext, type ReportSpec } from './types'

/* ── 版式常量（docx 的字号单位是半磅，间距单位是 twip / 20 = 磅）───── */
const SZ = {
  title: 30,      // 15pt
  meta: 17,       // 8.5pt
  chapter: 24,    // 12pt
  sub: 21,        // 10.5pt
  body: 20,       // 10pt
  small: 18,      // 9pt
  note: 17,       // 8.5pt
  cellLabel: 14,  // 7pt
  cellValue: 22,  // 11pt
  cellSub: 19,    // 9.5pt
  cellNote: 14,   // 7pt
  footer: 15,     // 7.5pt
}
const TONE: Record<DocTone, string> = {
  ink: '2B2B2B', qing: '004D4D', gold: '8C7326', sha: '9C3D54', muted: '666666',
}
const RULE: IBorderOptions = { style: BorderStyle.SINGLE, size: 4, color: 'D9D5CC' }
const CELL_MARGIN = { top: 60, bottom: 60, left: 110, right: 110 }
const FONT = 'Noto Serif SC'

/* ── 基础构造 ─────────────────────────────────────────────── */

function run(text: string, o: { bold?: boolean; tone?: DocTone; size?: number } = {}): TextRun {
  return new TextRun({
    text,
    bold: o.bold,
    color: TONE[o.tone ?? 'ink'],
    size: o.size ?? SZ.body,
    font: FONT,
  })
}

/** 段落。`keepNext` 用于标题类，避免标题落在页尾而正文翻页。 */
function p(children: TextRun[], o: {
  size?: number; bold?: boolean; tone?: DocTone
  before?: number; after?: number; line?: number
  indentLeft?: number; hanging?: number
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]
  keepNext?: boolean
  borderLeft?: boolean
  borderBottom?: boolean
  heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]
} = {}): Paragraph {
  return new Paragraph({
    heading: o.heading,
    alignment: o.alignment,
    keepNext: o.keepNext,
    spacing: { before: o.before ?? 0, after: o.after ?? 100, line: o.line ?? 300 },
    indent: (o.indentLeft || o.hanging)
      ? { left: o.indentLeft ?? 0, hanging: o.hanging }
      : undefined,
    border: (o.borderLeft || o.borderBottom)
      ? {
        ...(o.borderLeft ? { left: { ...RULE, size: 12, color: 'C9A227' } } : {}),
        ...(o.borderBottom ? { bottom: RULE } : {}),
      }
      : undefined,
    children,
  })
}

/** 把一行里的 `**粗体**` 拆成 runs（AI 正文里的强调不能丢） */
function inlineRuns(text: string, base: { size?: number; tone?: DocTone; bold?: boolean } = {}): TextRun[] {
  const out: TextRun[] = []
  for (const part of text.split(/(\*\*[^*]+\*\*)/)) {
    if (!part) continue
    const m = part.match(/^\*\*([^*]+)\*\*$/)
    out.push(run(m ? m[1]! : part, m
      ? { ...base, bold: true, tone: base.tone === 'ink' ? 'qing' : base.tone }
      : base))
  }
  return out.length ? out : [run('', base)]
}

function tableCell(children: Paragraph[], o: {
  width?: number; fill?: string; span?: number; borders?: boolean
} = {}): TableCell {
  return new TableCell({
    width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: o.span,
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    margins: CELL_MARGIN,
    borders: o.borders
      ? { top: RULE, bottom: RULE, left: RULE, right: RULE }
      : { top: RULE, bottom: RULE, left: { style: BorderStyle.NONE, size: 0, color: 'auto' }, right: { style: BorderStyle.NONE, size: 0, color: 'auto' } },
    children,
  })
}

function cellParas(cell: DocCell): Paragraph[] {
  const out: Paragraph[] = []
  if (cell.label) out.push(p([run(cell.label, { size: SZ.cellLabel, tone: 'muted' })], { after: 20, line: 240, alignment: AlignmentType.CENTER }))
  if (cell.value) out.push(p([run(cell.value, { size: SZ.cellValue, bold: true, tone: 'qing' })], { after: 20, line: 260, alignment: AlignmentType.CENTER }))
  if (cell.sub) out.push(p([run(cell.sub, { size: SZ.cellSub, tone: 'gold' })], { after: 20, line: 260, alignment: AlignmentType.CENTER }))
  if (cell.note) out.push(p([run(cell.note, { size: SZ.cellNote, tone: 'muted' })], { after: 0, line: 240, alignment: AlignmentType.CENTER }))
  return out.length ? out : [p([run('', { size: SZ.small })], { after: 0 })]
}

/* ── 块 → docx ───────────────────────────────────────────── */

function blockToDocx(b: DocBlock): (Paragraph | Table)[] {
  switch (b.t) {
    case 'h': {
      const level = b.level ?? 3
      return [p([run(b.text, { size: level === 2 ? SZ.sub : SZ.sub - 1, bold: true, tone: 'qing' })], {
        heading: level === 2 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
        before: level === 2 ? 220 : 160, after: 60, keepNext: true,
      })]
    }

    case 'p':
      return [p(b.runs ? b.runs.map((r: DocRun) => run(r.text, { bold: r.bold, size: b.small ? SZ.small : SZ.body, tone: b.tone }))
        : inlineRuns(b.text, { size: b.small ? SZ.small : SZ.body, tone: b.tone }),
      {
        bold: b.bold, tone: b.tone,
        indentLeft: b.indent ? 240 : undefined,
        after: b.small ? 60 : 100,
      })]

    case 'cite':
      return [p(inlineRuns(b.text, { size: SZ.small, tone: 'gold' }), {
        borderLeft: true, indentLeft: 170, after: 80,
      })]

    case 'list':
      return b.items.map((it) => p(inlineRuns(it, { size: b.small ? SZ.small : SZ.body, tone: b.tone }), {
        indentLeft: 300, hanging: 150, after: 40,
      }))

    case 'note':
      return [p([run(b.text, { size: SZ.note, tone: 'muted' })], { after: 80 })]

    case 'fields':
      return [new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: b.rows.map((r) => new TableRow({
          children: [
            tableCell([p([run(r.k, { size: SZ.small, bold: true, tone: 'muted' })], { after: 0, line: 280 })], { width: 17 }),
            tableCell([p(inlineRuns(r.v, { size: SZ.small, tone: r.tone ?? 'ink' }), { after: 0, line: 280 })], { width: 83 }),
          ],
        })),
      })]

    case 'grid': {
      const cols = Math.max(1, ...b.rows.map((r) => r.length))
      return [new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: b.rows.map((cells) => new TableRow({
          children: cells.map((c) => tableCell(cellParas(c), { width: 100 / cols, fill: 'FCFBF7', borders: true })),
        })),
      })]
    }

    case 'table': {
      const rows: TableRow[] = []
      if (b.head) {
        rows.push(new TableRow({
          tableHeader: true,
          children: b.head.map((h) => tableCell(
            [p([run(h, { size: SZ.small - 2, bold: true, tone: 'qing' })], { after: 0, line: 260 })],
            { fill: 'F6F1E2', borders: true },
          )),
        }))
      }
      for (const r of b.rows) {
        rows.push(new TableRow({
          children: r.map((c) => tableCell(
            [p(inlineRuns(c, { size: b.small ? SZ.note : SZ.small }), { after: 0, line: 260 })],
            { borders: true },
          )),
        }))
      }
      return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })]
    }
  }
}

/* ── Markdown → DocBlock（AI 正文用）──────────────────────── */

/**
 * AI 正文是 Markdown。这里只做**结构解析**，不改一个字：
 * `**粗体**` 保留为粗体 run，`###` 变子标题，`- ` 变列表，`> ` 变引文。
 * 无法识别的行按普通段落输出——宁可少一点样式，也不能丢内容。
 */
export function mdToBlocks(md: string): DocBlock[] {
  const out: DocBlock[] = []
  const lines = md.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]!.trimEnd()
    const t = line.trim()

    if (!t) { i++; continue }

    if (/^[-—–*_]{3,}$/.test(t)) { i++; continue }        // 分隔线在文档里由间距承担

    const h = t.match(/^(#{1,4})\s+(.*)$/)
    if (h) { out.push({ t: 'h', text: h[2]!, level: h[1]!.length <= 2 ? 2 : 3 }); i++; continue }

    // 管道表格
    if (/^\|.*\|$/.test(t) && /^\|[\s:|-]+\|$/.test((lines[i + 1] ?? '').trim())) {
      const cells = (row: string) => row.trim().slice(1, -1).split('|').map((c) => c.trim())
      const head = cells(t)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\|.*\|$/.test(lines[i]!.trim())) { rows.push(cells(lines[i]!.trim())); i++ }
      out.push({ t: 'table', head, rows, small: true })
      continue
    }

    if (/^[-*+]\s+/.test(t)) {
      const items: string[] = []
      while (i < lines.length && /^[-*+]\s+/.test(lines[i]!.trim())) { items.push(lines[i]!.trim().replace(/^[-*+]\s+/, '')); i++ }
      out.push({ t: 'list', items })
      continue
    }

    if (/^\d+[.、]\s+/.test(t)) {
      const items: string[] = []
      while (i < lines.length && /^\d+[.、]\s+/.test(lines[i]!.trim())) {
        items.push(lines[i]!.trim().replace(/^\d+[.、]\s+/, ''))
        i++
      }
      out.push({ t: 'list', items })
      continue
    }

    if (/^>\s?/.test(t)) {
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i]!.trim())) { buf.push(lines[i]!.trim().replace(/^>\s?/, '')); i++ }
      out.push({ t: 'cite', text: buf.filter(Boolean).join(' ') })
      continue
    }

    // 普通段落：连续非空行合并
    const buf: string[] = [t]
    i++
    while (i < lines.length && lines[i]!.trim() && !/^(#{1,4}\s|[-*+]\s|\d+[.、]\s|>\s?|\|)/.test(lines[i]!.trim())) {
      buf.push(lines[i]!.trim()); i++
    }
    out.push({ t: 'p', text: buf.join('') })
  }
  return out
}

/* ── 导出入口 ───────────────────────────────────────────── */

export interface ExportDocxOptions {
  /** 报告标题下方的一行元信息（如命主信息条），来自页面而非报告结构 */
  meta?: string
  /** 下载文件名（不含扩展名） */
  fileName?: string
}

/**
 * 把一份 `ReportSpec` + 运行时上下文导出为 .docx。
 *
 * 章节的取舍、顺序、标题、编号全部来自 resolveChapters，与屏幕一致；
 * 只有"每章长什么样"由各章节的 `doc()` 决定。
 */
export async function exportReportDocx<R>(
  spec: ReportSpec<R>,
  ctx: ReportContext<R>,
  opts: ExportDocxOptions = {},
): Promise<void> {
  const resolved = resolveChapters(spec, ctx)

  // 可见章节缺 Word 投影 → 直接报错，不生成"悄悄少一章"的文档
  const missing = resolved.filter((r) => r.chapter.kind !== 'ai' && !r.chapter.doc)
  if (missing.length > 0) {
    throw new Error(
      `导出中断：以下章节还没有 Word 投影（doc）——${missing.map((m) => `${m.num}、${m.title}`).join('；')}。` +
      '请在对应 spec 里补上 doc()，否则文档会缺章。',
    )
  }

  const children: (Paragraph | Table)[] = []

  // 报头
  children.push(p([run(spec.title, { size: SZ.title, bold: true, tone: 'qing' })], {
    alignment: AlignmentType.CENTER, after: 60,
  }))
  children.push(p([run('御笔易学 · 以古籍为骨 以数据为墨', { size: SZ.meta, tone: 'gold' })], {
    alignment: AlignmentType.CENTER, after: opts.meta ? 40 : 240,
  }))
  if (opts.meta) {
    children.push(p([run(opts.meta, { size: SZ.meta, tone: 'muted' })], {
      alignment: AlignmentType.CENTER, after: 240,
    }))
  }
  if (spec.subtitle) children.push(p([run(spec.subtitle, { size: SZ.small, tone: 'muted' })], { after: 160 }))

  for (const { chapter, title, num } of resolved) {
    if (chapter.kind === 'ai') {
      const text = ctx.ai?.[chapter.id]?.text
      if (!text) continue   // 屏幕上还没生成时只有按钮；文档里留一个空章没有意义
      children.push(p([run(title, { size: SZ.chapter, bold: true, tone: 'qing' })], {
        heading: HeadingLevel.HEADING_2, before: 320, after: 40, keepNext: true,
      }))
      children.push(p([run('AI 生成 · 仅供参考', { size: SZ.cellNote, tone: 'muted' })], {
        after: 140, borderBottom: true, keepNext: true,
      }))
      for (const b of mdToBlocks(text)) children.push(...blockToDocx(b))
      continue
    }

    // 章标题：序号 + 顿号 + 标题，与打印版的「一、」写法一致
    children.push(p([run(`${num}、${title}`, { size: SZ.chapter + 1, bold: true, tone: 'qing' })], {
      heading: HeadingLevel.HEADING_2, before: 340, after: 140, keepNext: true,
    }))

    for (const b of chapter.doc!(ctx)) children.push(...blockToDocx(b))
  }

  children.push(p([run(`御笔易学 yubiyixue.xyz · 生成于 ${new Date().toLocaleString('zh-CN')}`, {
    size: SZ.footer, tone: 'muted',
  })], { alignment: AlignmentType.CENTER, before: 400 }))

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SZ.body, color: TONE.ink },
          paragraph: { spacing: { line: 300, after: 100 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },              // A4 纵向（twip）
          margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 }, // 2cm
        },
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.fileName ?? spec.title}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
