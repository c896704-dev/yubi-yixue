import { Button } from '../ui/Button'

type Tab = 'bazi' | 'compat' | 'fengshui' | 'divination'

interface TopNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  isLoggedIn?: boolean
  username?: string
  onLoginClick?: () => void
  onLogout?: () => void
}

const tabs: { key: Tab; label: string }[] = [
  { key: 'bazi', label: '八字排盘' },
  { key: 'compat', label: '双人合盘' },
  { key: 'fengshui', label: '风水分析' },
  { key: 'divination', label: '算卦' },
]

export function TopNav({
  activeTab,
  onTabChange,
  isLoggedIn = false,
  username,
  onLoginClick,
  onLogout,
}: TopNavProps) {
  return (
    <header className="ink-nav">
      <div className="ink-nav-inner">
        <div className="ink-nav-brand">
          <span className="ink-seal-mark">御笔</span>
          御笔易学
        </div>
        <nav className="ink-nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`ink-nav-tab ${tab.key === activeTab ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="ink-nav-user">
          {isLoggedIn ? (
            <>
              <span className="ink-nav-username">{username}</span>
              <Button variant="clear" size="sm" onClick={onLogout}>退出</Button>
            </>
          ) : (
            <Button variant="clear" size="sm" onClick={onLoginClick}>登录</Button>
          )}
        </div>
      </div>
    </header>
  )
}
