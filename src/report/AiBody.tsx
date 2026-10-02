import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * AI 正文容器：统一渲染 + 可选手动折叠。
 *
 * 默认**展开**（产品决定：AI 解读是卖点，不做默认收起），折叠只是给读者一个
 * 「这段太长，先收起来」的出口。打印时强制展开。
 *
 * 只控制承载与折叠状态，**不改动正文一个字**。
 */
export function AiBody({ text, collapsible }: { text: string; collapsible?: boolean }) {
  const [open, setOpen] = useState(true)
  const collapsed = Boolean(collapsible) && !open

  return (
    <>
      <div className={`report ai-body${collapsed ? ' is-collapsed' : ''}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
      {collapsible && (
        <button
          type="button"
          className="ai-toggle no-print"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? '收起正文' : '展开全文'}
        </button>
      )}
    </>
  )
}
