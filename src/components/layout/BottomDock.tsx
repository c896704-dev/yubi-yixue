import { useEffect, useState } from 'react'
import { Calendar, Home, Compass, Star, Users, Mountain, Sparkles, Menu, X } from '../ui/Icon'
import type { AppTab } from '../../context/NavContext'

interface BottomDockProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

const DOCK_ITEMS: { key: AppTab | 'more'; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'home', label: '首页', Icon: Home },
  { key: 'bazi', label: '八字', Icon: Compass },
  { key: 'compat', label: '合盘', Icon: Users },
  { key: 'divination', label: '算卦', Icon: Star },
  { key: 'more', label: '其他', Icon: Menu },
]

const MORE_ITEMS: { key: AppTab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'fengshui', label: '风水', Icon: Mountain },
  { key: 'almanac', label: '万年历', Icon: Calendar },
  { key: 'shensha', label: '神煞', Icon: Sparkles },
]

export function BottomDock({ activeTab, onTabChange }: BottomDockProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  const isMoreActive = MORE_ITEMS.some((item) => item.key === activeTab)

  return (
    <>
      {moreOpen && (
        <div
          className="dock-more-overlay"
          onClick={() => setMoreOpen(false)}
          role="presentation"
        />
      )}
      {moreOpen && (
        <div className="dock-more-sheet" role="dialog" aria-label="更多功能">
          <div className="dock-more-head">
            <span>更多功能</span>
            <button type="button" className="dock-more-close" onClick={() => setMoreOpen(false)} aria-label="关闭">
              <X size={16} />
            </button>
          </div>
          <div className="dock-more-list">
            {MORE_ITEMS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                className={`dock-more-item ${activeTab === key ? 'active' : ''}`}
                onClick={() => { onTabChange(key); setMoreOpen(false) }}
              >
                <span className="dock-more-icon"><Icon size={18} /></span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="site-dock" aria-label="移动端导航">
        {DOCK_ITEMS.map(({ key, label, Icon }) => {
          if (key === 'more') {
            return (
              <button
                key={key}
                type="button"
                className={`dock-item ${isMoreActive ? 'active' : ''}`}
                onClick={() => setMoreOpen((v) => !v)}
              >
                <span className="dock-icon"><Icon size={17} /></span>
                <span>{label}</span>
              </button>
            )
          }
          return (
            <button
              key={key}
              type="button"
              className={`dock-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => onTabChange(key)}
            >
              <span className="dock-icon"><Icon size={17} /></span>
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
