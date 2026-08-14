import { ArrowLeft } from '../ui/Icon'
import { useNav } from '../../context/NavContext'

interface ToolHeaderProps {
  eyebrow: string
  title: string
  desc?: string
}

/** 工具页统一页头：返回首页 + 金眉题 + serif 大标题 + 描述 */
export function ToolHeader({ eyebrow, title, desc }: ToolHeaderProps) {
  const go = useNav()
  return (
    <div className="tool-header">
      <button className="tool-back" onClick={() => go('home')}>
        <ArrowLeft size={14} />
        返回首页
      </button>
      <div className="tool-eyebrow">{eyebrow}</div>
      <h1 className="tool-title">{title}</h1>
      {desc && <p className="tool-desc">{desc}</p>}
    </div>
  )
}
