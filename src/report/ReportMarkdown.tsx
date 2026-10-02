import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** hast 节点（仅取本组件需要的字段），用于在渲染层按内容分类引用块 */
interface HastNode {
  type?: string
  value?: string
  children?: HastNode[]
}

/** 从 hast 子树提取纯文本 */
function hastText(node?: HastNode): string {
  if (!node) return ''
  if (node.type === 'text') return node.value || ''
  return (node.children || []).map(hastText).join('')
}

/** 「判官…」开头的引用块需要单独描边——CSS 无法按文本选择，只能渲染时打标 */
const JUDGE_PREFIX = /^(判官批语|判官总批|判官终裁|批语)/

/**
 * 报告 Markdown 渲染器。
 *
 * 与直接使用 `<ReactMarkdown remarkPlugins={[remarkGfm]}>` 的唯一差别：
 * 识别以「判官…」开头的引用块并加 `.md-judge` 类，让 CSS 能命中。
 * **不改变任何文本内容**，只影响引用块的类名。
 */
export function ReportMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        blockquote({ node, ...props }: { node?: HastNode } & React.HTMLAttributes<HTMLQuoteElement>) {
          const isJudge = JUDGE_PREFIX.test(hastText(node).trim())
          return <blockquote className={isJudge ? 'md-judge' : undefined} {...props} />
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
