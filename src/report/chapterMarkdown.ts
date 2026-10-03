/**
 * 章节 Markdown 的**显示侧规范化**。
 *
 * 只作用在报告页的渲染路径上——AI 上下文用的是模板函数的原始输出，不经过这里，
 * 所以「显示可以整顿、AI 输入一字不动」这条纪律在这里同样成立。
 *
 * 做两件事：
 *
 * 1. **去掉与章节卡头同名的首行标题。**
 *    模板函数都以 `## 乾坤定盘 (Fundamental Analysis)` 开头，而 ReportView 的卡头
 *    已经写着「二 乾坤定盘」——两行紧挨着出现，就是同一个标题说两遍。
 *    （审计 P-13 记录的是同一类问题的合婚版：卡片标题 + 正文 H1。）
 *
 * 2. **去掉标题行里的 emoji。**
 *    审计 P-09：此前目录用 emoji、章节头用 lucide 图标、正文又用 emoji，三套图标语言并存。
 *    现在章节图标统一由 spec 里的 lucide 承担，正文标题不该再自带一套。
 *    正文内部的 ⚠️/✨ 等**行内**提示不动——那是文案，不是章节图标。
 */

/** emoji 与变体选择符的覆盖区间 */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu

/** 归一化标题用于比较：去掉 emoji、括注、标点与空白 */
function comparable(s: string): string {
  return s
    .replace(EMOJI, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[\s、，,．.。·:：|｜—–\-]/g, '')
    .trim()
}

const HEADING = /^(#{1,6})\s+(.*)$/

export function normalizeChapterMarkdown(md: string, chapterTitle: string): string {
  const lines = md.split('\n')

  // ① 首行标题与卡头同名 → 整行去掉（连同后面的空行）
  const first = lines.findIndex((l) => l.trim() !== '')
  if (first >= 0) {
    const m = lines[first]!.match(HEADING)
    if (m) {
      const head = comparable(m[2]!)
      const title = comparable(chapterTitle)
      if (head && title && (head === title || head.startsWith(title) || title.startsWith(head))) {
        lines.splice(first, 1)
        while (lines[first] !== undefined && lines[first]!.trim() === '') lines.splice(first, 1)
      }
    }
  }

  // ② 标题行去 emoji
  return lines.map((l) => (HEADING.test(l) ? l.replace(EMOJI, '').replace(/\s+$/, '') : l)).join('\n')
}
