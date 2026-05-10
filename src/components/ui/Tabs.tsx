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
    <div className={`tab-bar ${className}`}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`tab-item ${active ? 'tab-item-active' : ''}`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-1.5 px-1.5 py-px rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold">
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
