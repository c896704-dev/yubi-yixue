import { Moon, Sun, User } from '../ui/Icon'
import type { AppTab } from '../../context/NavContext'

interface TopNavProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export const NAV_ITEMS: { key: AppTab; label: string }[] = [
  { key: 'home', label: '首页' },
  { key: 'bazi', label: '八字' },
  { key: 'compat', label: '合盘' },
  { key: 'fengshui', label: '风水' },
  { key: 'divination', label: '算卦' },
  { key: 'renshi', label: '识人' },
  { key: 'almanac', label: '万年历' },
  { key: 'shensha', label: '神煞' },
  { key: 'me', label: '我的' },
]

export function TopNav({ activeTab, onTabChange, theme, onToggleTheme }: TopNavProps) {
  return (
    <header className="site-topnav">
      <div className="site-container">
        <div className="site-topnav-inner">
          <button className="topnav-brand" onClick={() => onTabChange('home')} aria-label="回首页">
            <span className="yb-seal" style={{ width: 34, height: 34, fontSize: 17 }}>御</span>
            <span className="topnav-brand-text">
              <span className="topnav-brand-name">御笔易学</span>
              <span className="topnav-brand-sub">YUBI · YIXUE</span>
            </span>
          </button>

          <nav className="topnav-links" aria-label="主导航">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                className={`topnav-link ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => onTabChange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="topnav-actions">
            <button
              className="topnav-icon-btn"
              onClick={onToggleTheme}
              aria-label="切换主题"
              title="切换主题"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              className="topnav-me-btn"
              onClick={() => onTabChange('me')}
              aria-label="我的"
            >
              <User size={14} />
              <span>我的</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
