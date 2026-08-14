import { Calendar, Home, User, Compass, Star } from '../ui/Icon'
import type { AppTab } from '../../context/NavContext'

interface BottomDockProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  user: { username: string } | null
  onLoginClick: () => void
}

const DOCK_ITEMS: { key: AppTab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'home', label: '首页', Icon: Home },
  { key: 'bazi', label: '八字', Icon: Compass },
  { key: 'divination', label: '算卦', Icon: Star },
  { key: 'almanac', label: '万年历', Icon: Calendar },
  { key: 'me', label: '我的', Icon: User },
]

export function BottomDock({ activeTab, onTabChange, user, onLoginClick }: BottomDockProps) {
  return (
    <nav className="site-dock" aria-label="移动端导航">
      {DOCK_ITEMS.map(({ key, label, Icon }) => (
        <button
          key={key}
          className={`dock-item ${activeTab === key ? 'active' : ''}`}
          onClick={() => (key === 'me' && !user ? onLoginClick() : onTabChange(key))}
        >
          <span className="dock-icon"><Icon size={17} /></span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
