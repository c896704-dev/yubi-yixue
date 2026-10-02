import type { ReactNode } from 'react'
import { Loading } from '../components/ui/Loading'
import { AiBody } from './AiBody'

interface AiInsightCardProps {
  insight: string | null
  loading?: boolean
  error?: string | null
  /** 卡片标题。默认「AI 总评」；传 null 表示不渲染标题（外层卡片已给出标题时用） */
  title?: string | null
  /** 锚点 id，便于目录/外链直达 */
  id?: string
  /** 标题右侧操作位（如「重新解读」），由调用方传入，避免按钮游离在卡片之外 */
  action?: ReactNode
  /** 是否提供手动折叠（默认展开，折叠只是给读者的出口；打印时强制全展开） */
  collapsible?: boolean
}

/**
 * AI 区块的统一承载 —— 报告级组件，八字 / 合婚 / 识人共用。
 *
 * 只负责承载与呈现（标题、标识、错误态、折叠），**不触碰正文一个字**。
 * 正文由调用方以 `insight` 传入，渲染交给 AiBody。
 */
export function AiInsightCard({ insight, loading, error, title = 'AI 总评', id, action, collapsible }: AiInsightCardProps) {
  return (
    <div className="ai-insight" id={id}>
      {/* 固定副标题：让读者一眼分清「引擎结论」与「模型叙事」。属组件固定文案，非 AI 输出 */}
      <div className="ai-insight-head">
        <div className="ai-insight-heading">
          {title && <h3 className="ai-insight-title">{title}</h3>}
          <span className="ai-insight-note">AI 生成 · 仅供参考</span>
        </div>
        {action}
      </div>
      {loading && <Loading text="AI 正在分析中..." />}
      {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
      {insight && <AiBody text={insight} collapsible={collapsible} />}
    </div>
  )
}
