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
    <header className="sticky top-0 z-40 border-b border-[#E8E0D8] bg-white/85 backdrop-blur-md">
      <div className="max-w-[1100px] mx-auto px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <span className="font-serif text-lg font-bold text-[#2C2C2C] tracking-wider">
            御笔易学
          </span>
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const active = tab.key === activeTab
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                    active
                      ? 'font-semibold text-[#2C2C2C] bg-paper-200'
                      : 'font-normal text-[#8C8C8C] hover:text-[#2C2C2C]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
        <div>
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#8C8C8C]">{username}</span>
              <Button variant="ghost" size="sm" onClick={onLogout}>退出</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={onLoginClick}>登录</Button>
          )}
        </div>
      </div>
    </header>
  )
}
