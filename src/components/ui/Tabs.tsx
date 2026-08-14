import type { ReactNode } from 'react'

interface TabItem {
  key: string
  label: ReactNode
  badge?: number | string
}

interface TabsProps {
  tabs: TabItem[]
  activeKey: string
  onChange: (key: string) => void
  className?: string
}

export function Tabs({ tabs, activeKey, onChange, className = '' }: TabsProps) {
  return (
    <div className={`ds-segmented ${className}`} role="tablist">
      {tabs.map((tab) => {
        const active = tab.key === activeKey
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`ds-seg-item ${active ? 'active' : ''}`}
            role="tab"
            aria-selected={active}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-1.5 px-1.5 py-px rounded-full bg-hu-po-jin/15 text-hu-po-jin-dark text-[10px] font-semibold">
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
