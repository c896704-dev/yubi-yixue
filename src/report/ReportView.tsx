import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Card } from '../components/ui/Card'
import { ChevronDown } from '../components/ui/Icon'
import { ReportMarkdown } from './ReportMarkdown'
import { normalizeChapterMarkdown } from './chapterMarkdown'
import { AiInsightCard } from './AiInsightCard'
import { ReportNav, type NavChapter } from './ReportNav'
import { resolveChapters, type ReportChapter, type ReportContext, type ReportSpec } from './types'

/**
 * 报告统一渲染器 —— 报告骨架的呈现层。
 *
 * 全站只实现一次的东西都在这里：**章节序号、锚点、吸顶导航、折叠、AI 承载、打印前展开**。
 * 各板块只负责构造 `ReportSpec`（数据），不再关心这些。
 *
 * 设计约束：
 *  - 「有哪些章节」由 `resolveChapters` 唯一决定（屏幕 / Word / 打印共用同一答案）
 *  - `kind:'ai'` 的章节自动套用 AI 承载，页面不重复实现
 *  - 折叠只改变 CSS，**正文始终在 DOM 里**，因此打印能完整还原（见下方注释）
 */
export function ReportView<R>({ spec, ctx }: { spec: ReportSpec<R>; ctx: ReportContext<R> }) {
  const chapters = resolveChapters(spec, ctx)
  const navChapters: NavChapter[] = chapters.map(({ chapter, title, num }) => ({
    id: chapter.id,
    num,
    title,
  }))

  const rootRef = useRef<HTMLDivElement>(null)

  /**
   * 打印前把页内所有 `<details>` 展开。
   *
   * 方法论披露、晚子时口径对照都是原生 `<details>`（默认收起）：CSS 无法强制展开
   * 一个收起状态的 details，不处理的话它们会**整段从 PDF 里消失**。
   * 这里在 beforeprint 里同步展开、afterprint 还原，屏幕观感不受影响。
   *
   * 顺带把 document.title 换成报告名 —— Chrome「另存为 PDF」默认拿它当文件名，
   * 否则导出的一律叫「御笔易学」。
   */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let collapsed: HTMLDetailsElement[] = []
    let prevTitle = ''
    const onBeforePrint = () => {
      collapsed = Array.from(root.querySelectorAll('details')).filter((d) => !d.open)
      collapsed.forEach((d) => { d.open = true })
      prevTitle = document.title
      document.title = spec.title
    }
    const onAfterPrint = () => {
      collapsed.forEach((d) => { d.open = false })
      collapsed = []
      if (prevTitle) document.title = prevTitle
    }
    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [spec.title])

  return (
    <div className="report-view" ref={rootRef}>
      <ReportNav chapters={navChapters} />
      <Card title={spec.title}>
        {spec.subtitle && <p className="report-view-subtitle">{spec.subtitle}</p>}
        {chapters.map(({ chapter, title, num }) => (
          <ChapterView key={chapter.id} chapter={chapter} title={title} num={num} ctx={ctx} />
        ))}
      </Card>
    </div>
  )
}

/** 单章渲染。AI 章节与非 AI 章节在这里分道，页面无需再判断。 */
function ChapterView<R>({ chapter, title, num, ctx }: {
  chapter: ReportChapter<R>
  /** 已解析的标题（spec 里可以是函数，由 ReportView 统一求值） */
  title: string
  num: string
  ctx: ReportContext<R>
}) {
  const collapsible = chapter.collapsible ?? true
  const [open, setOpen] = useState(chapter.defaultOpen ?? true)

  // ── AI 章节：统一套用 AI 承载；正文由 ctx.ai 在运行时提供 ──
  if (chapter.kind === 'ai') {
    const slot = ctx.ai?.[chapter.id]
    if (!slot) return null
    return (
      <>
        {chapter.note && <p className="report-view-note">{chapter.note}</p>}
        <AiInsightCard
          id={chapter.id}
          title={title}
          insight={slot.text}
          loading={slot.loading}
          error={slot.error}
          action={slot.action}
          collapsible
        />
      </>
    )
  }

  // ── 引擎 / 数据章节：统一章节卡 ──
  // body 返回字符串时一律按 Markdown 渲染，并做一次显示侧规范化
  // （去掉与卡头同名的首行标题、去掉标题行 emoji，见 chapterMarkdown.ts）。
  // 这样各板块不必各自包一层 <ReportMarkdown>，也就不会有人漏掉规范化。
  //
  // ⚠️ `.report` 这个类**必须留着**：report.css 里全部正文排版（字号/行距/表格边框与内边距/
  // 引用块样式）都挂在 `.report` 下面。P2-1 迁移时旧 BaziReport / CompatReport 上的
  // `<div className="report">` 被一起删掉了，结果是八字与合婚的正文退回浏览器默认样式
  // ——表格没有边框、没有内边距，看起来"表格没了、样式没了"。
  // 只有 Markdown 正文走这个容器；识人 / 算卦 / 风水 的章节自带容器，不受影响。
  const raw = typeof chapter.body === 'function' ? chapter.body(ctx) : chapter.body
  const body: ReactNode = typeof raw === 'string'
    ? (
      <div className="report">
        <ReportMarkdown>{normalizeChapterMarkdown(raw, title)}</ReportMarkdown>
      </div>
    )
    : raw

  const header = (
    <>
      <span className="report-section-num">{num}</span>
      {chapter.icon && <span className="report-section-icon">{chapter.icon}</span>}
      <span className="report-section-title">{title}</span>
      {chapter.headerExtra?.(ctx)}
      {collapsible && (
        <span className={`report-section-toggle ${open ? 'open' : ''}`}><ChevronDown size={14} /></span>
      )}
    </>
  )

  const collapsed = collapsible && !open

  return (
    <div
      className={`report-section${chapter.variant ? ` ${chapter.variant}` : ''}${collapsed ? ' is-collapsed' : ''}`}
      id={chapter.id}
    >
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
      {/*
        正文**始终留在 DOM 里**，折叠只由 CSS（.is-collapsed）隐藏。
        原因：打印 / 存 PDF 时必须能还原全文，而 `@media print` 无法让一段
        根本没被 React 渲染的内容出现。此前写成 `{(open) && <div …>}`，
        结果是「用户收起过的章节在 PDF 里整章消失」，且屏幕上看不出任何异常。
        代价仅是被折叠章节的组件仍会挂载（数量很少，只在附录类章节）。
      */}
      <div className="report-section-body">
        {body}
        {chapter.aside?.(ctx)}
      </div>
    </div>
  )
}
