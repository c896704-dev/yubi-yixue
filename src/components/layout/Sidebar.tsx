import { useAuth } from '../../hooks/useAuth'

type Tab = 'bazi' | 'compat' | 'fengshui' | 'divination'

interface SidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onLoginClick: () => void
  onLogout: () => void
}

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'bazi', label: '八字排盘', icon: '☰' },
  { key: 'compat', label: '双人合盘', icon: '☯' },
  { key: 'fengshui', label: '风水分析', icon: '⛰' },
  { key: 'divination', label: '算卦', icon: '䷀' },
]

export function Sidebar({ activeTab, onTabChange, onLoginClick, onLogout }: SidebarProps) {
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="ink-seal-mark">御</span>
        <span className="sidebar-brand-text">御笔易学</span>
      </div>

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`sidebar-nav-item ${tab.key === activeTab ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            <span className="sidebar-nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="sidebar-user">
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {user.username}
            </span>
            <button className="sidebar-user-btn" onClick={onLogout}>
              退出登录
            </button>
          </div>
        ) : (
          <button className="sidebar-user-btn" onClick={onLoginClick}>
            登录 / 注册
          </button>
        )}
      </div>
    </aside>
  )
}
