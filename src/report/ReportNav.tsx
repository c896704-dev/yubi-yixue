import { useEffect, useState } from 'react'

export interface NavChapter {
  /** 目标元素的 DOM id（跳转锚点） */
  id: string
  /** 章节序号（已由编排层统一产生，此处只用于展示） */
  num: string
  title: string
}

/**
 * 报告章节导航：吸顶条 + 当前章节跟随 + 展开式目录。
 *
 * 解决的问题：长报告（八字约 17 屏）原有的目录是一次性 chip 行，滚过之后就没有
 * 任何回到目录/跳章的手段。这里把目录做成吸顶条，随时可跳，并实时显示所在章节。
 *
 * 不改变报告结构，只增加一层导航。
 */
export function ReportNav({ chapters }: { chapters: NavChapter[] }) {
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (chapters.length === 0) return
    const onScroll = () => {
      // 吸顶条下沿 + 余量；取最后一个已越过该线的章节作为「当前章节」
      const line = 150
      let cur = chapters[0]!.id
      for (const c of chapters) {
        const el = document.getElementById(c.id)
        if (el && el.getBoundingClientRect().top <= line) cur = c.id
      }
      setActiveId(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [chapters])

  if (chapters.length === 0) return null
  const active = chapters.find((c) => c.id === activeId) ?? chapters[0]!

  return (
    <nav className={`report-nav no-print${open ? ' is-open' : ''}`} aria-label="报告章节导航">
      <button
        type="button"
        className="report-nav-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="report-nav-current">
          {/* AI 章节不占正文序号，此时不渲染序号位（见 deriveChapterNums 规则） */}
          {active.num && <span className="report-nav-num">{active.num}</span>}
          <span className="report-nav-title">{active.title}</span>
        </span>
        <span className="report-nav-caret">{open ? '收起' : `目录 · 共 ${chapters.length} 章`}</span>
      </button>
      <div className="report-nav-list">
        {chapters.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className={`report-nav-item${c.id === activeId ? ' is-active' : ''}`}
            onClick={(e) => {
              // 不能只依赖 href：URL hash 已是同一个值时浏览器不会再滚动（点第二次没反应）。
              // 也不能用 scrollIntoView：在本项目里实测无效（原因未定），改为按偏移量滚动，
              // 偏移 120px = 顶部导航(60) + 吸顶条(46) + 余量，与 CSS 的 scroll-margin-top 保持一致。
              e.preventDefault()
              const el = document.getElementById(c.id)
              if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 120
                window.scrollTo({ top, behavior: 'smooth' })
              }
              history.replaceState(null, '', `#${c.id}`)
              setOpen(false)
            }}
          >
            {c.num && <span className="report-nav-num">{c.num}</span>}
            {c.title}
          </a>
        ))}
      </div>
    </nav>
  )
}
