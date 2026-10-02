import { useEffect, useState } from 'react'
import { ReportNav, type NavChapter } from './ReportNav'

/** 取标题自身的文字：遇到首个元素（图标 SVG、内嵌 chip）就停止拼接，
 *  否则「换日口径披露 · 晚子时出生 + <span>两口径结论存在实质翻转</span>」会被连成一长串。 */
function headingLabel(h: HTMLElement): string {
  let out = ''
  for (const n of Array.from(h.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? ''
    else if (out.trim()) break
  }
  const label = (out.trim() || h.textContent?.trim() || '').replace(/\s+/g, ' ')
  return label.length > 28 ? `${label.slice(0, 27)}…` : label
}

/**
 * 自动章节导航：从指定容器里扫描标题元素生成章节表。
 *
 * 适用于正文是一整块 Markdown、章节没有结构化数据的板块（合婚等）。
 * 渲染后才发现章节，因此首次渲染返回 null，扫描完成后再挂上导航。
 *
 * 会在缺 id 的标题上补一个锚点 id —— 只加 id，不改任何文案。
 */
export function AutoReportNav({
  containerIds,
  selector = 'h2',
  skip,
}: {
  /** 扫描哪些容器里的标题（可传多个，按数组顺序拼接成一条目录） */
  containerIds: string[]
  selector?: string
  /** 不入目录的标题正则**源串**（如 "方法论说明|轨迹口径说明"）。
   *  传字符串而非 RegExp：正则字面量每次渲染都是新对象，会让 effect 依赖失效并触发无限重渲染。 */
  skip?: string
}) {
  const [chapters, setChapters] = useState<NavChapter[]>([])
  const key = containerIds.join('|')

  useEffect(() => {
    const skipRe = skip ? new RegExp(skip) : null
    const list: NavChapter[] = []
    const roots = containerIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))
    const heads = roots.flatMap((root) => Array.from(root.querySelectorAll<HTMLElement>(selector)))
    heads.forEach((h, i) => {
      const raw = headingLabel(h)
      if (!raw || (skipRe && skipRe.test(raw))) return
      // 「一、双方命盘概览」这类自带序号的标题：序号提到 chip 上，标题去掉序号避免重复
      const m = raw.match(/^([一二三四五六七八九十]+)、\s*(.+)$/)
      const num = m ? m[1]! : String(list.length + 1)
      const title = m ? m[2]! : raw
      if (!h.id) h.id = `autosec-${i}`
      list.push({ id: h.id, num, title })
    })
    // 内容没变就复用旧数组，避免无谓的重渲染
    setChapters((prev) =>
      prev.length === list.length && prev.every((c, i) => c.id === list[i]!.id && c.title === list[i]!.title)
        ? prev
        : list,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, selector, skip])

  if (chapters.length === 0) return null
  return <ReportNav chapters={chapters} />
}
