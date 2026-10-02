import { useState, type ReactNode } from 'react'
import { Card } from '../components/ui/Card'
import { ChevronDown } from '../components/ui/Icon'
import { ReportMarkdown } from './ReportMarkdown'
import { AiInsightCard } from './AiInsightCard'
import { ReportNav, type NavChapter } from './ReportNav'
import { deriveChapterNums, type ReportChapter, type ReportContext, type ReportSpec } from './types'

/**
 * 报告统一渲染器 —— 报告骨架的呈现层。
 *
 * 全站只实现一次的东西都在这里：**章节序号、锚点、吸顶导航、折叠、AI 承载**。
 * 各板块只负责构造 `ReportSpec`（数据），不再关心这些。
 *
 * 设计约束：
 *  - 序号由 `deriveChapterNums` 派生，章节数据里不含序号 → 不会再出现"卡头与正文各说一套"
 *  - `kind:'ai'` 的章节自动套用 AI 承载，页面不重复实现
 *  - 打印时折叠章节强制展开（见 report.css 的 @media print）
 *
 * 注：P2-1 Batch 0 只落地骨架，**尚未接入任何页面**。
 */
export function ReportView<R>({ spec, ctx }: { spec: ReportSpec<R>; ctx: ReportContext<R> }) {
  const nums = deriveChapterNums(spec.chapters)
  const navChapters: NavChapter[] = spec.chapters.map((c, i) => ({
    id: c.id,
    num: nums[i] ?? '',
    title: c.title,
  }))

  return (
    <div className="report-view">
      <ReportNav chapters={navChapters} />
      <Card title={spec.title}>
        {spec.subtitle && <p className="report-view-subtitle">{spec.subtitle}</p>}
        {spec.chapters.map((c, i) => (
          <ChapterView key={c.id} chapter={c} num={nums[i] ?? ''} ctx={ctx} />
        ))}
      </Card>
    </div>
  )
}

/** 单章渲染。AI 章节与非 AI 章节在这里分道，页面无需再判断。 */
function ChapterView<R>({ chapter, num, ctx }: { chapter: ReportChapter<R>; num: string; ctx: ReportContext<R> }) {
  const collapsible = chapter.collapsible ?? true
  const [open, setOpen] = useState(chapter.defaultOpen ?? true)

  // ── AI 章节：统一套用 AI 承载；正文由 ctx.ai 在运行时提供 ──
  if (chapter.kind === 'ai') {
    const slot = ctx.ai?.[chapter.id]
    if (!slot) return null
    return (
      <AiInsightCard
        id={chapter.id}
        title={chapter.title}
        insight={slot.text}
        loading={slot.loading}
        error={slot.error}
        action={slot.action}
        collapsible
      />
    )
  }

  // ── 引擎 / 数据章节：统一章节卡 ──
  const body: ReactNode = typeof chapter.body === 'function'
    ? chapter.body(ctx)
    : <ReportMarkdown>{chapter.body}</ReportMarkdown>

  const header = (
    <>
      <span className="report-section-num">{num}</span>
      <span className="report-section-title">{chapter.title}</span>
      {collapsible && (
        <span className={`report-section-toggle ${open ? 'open' : ''}`}><ChevronDown size={14} /></span>
      )}
    </>
  )

  return (
    <div className="report-section" id={chapter.id}>
      {collapsible ? (
        <button
          className="report-section-header"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {header}
        </button>
      ) : (
        <div className="report-section-header">{header}</div>
      )}
      {(!collapsible || open) && (
        <div className="report-section-body">
          {body}
          {chapter.aside?.(ctx)}
        </div>
      )}
    </div>
  )
}
