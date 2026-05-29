type Tab = 'bazi' | 'compat' | 'fengshui' | 'divination'

interface BottomTabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onLoginClick: () => void
}

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'bazi', label: '八字', icon: '☰' },
  { key: 'compat', label: '合盘', icon: '☯' },
  { key: 'fengshui', label: '风水', icon: '⛰' },
  { key: 'divination', label: '算卦', icon: '䷀' },
]

export function BottomTabBar({ activeTab, onTabChange, onLoginClick }: BottomTabBarProps) {
  return (
    <nav className="bottom-bar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`bottom-bar-item ${tab.key === activeTab ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          <span className="icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
      <button className="bottom-bar-item" onClick={onLoginClick}>
        <span className="icon">👤</span>
        <span>我的</span>
      </button>
    </nav>
  )
}
