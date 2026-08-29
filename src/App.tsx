import { useState, useEffect, useCallback } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { NavProvider, type AppTab } from './context/NavContext'
import { LoginModal } from './features/auth/LoginModal'
import { RegisterModal } from './features/auth/RegisterModal'
import { TopNav } from './components/layout/TopNav'
import { BottomDock } from './components/layout/BottomDock'
import { SiteFooter } from './components/layout/SiteFooter'
import { HomeLanding } from './components/layout/HomeLanding'
import BaziPage from './features/bazi/BaziPage'
import CompatPage from './features/compat/CompatPage'
import FengshuiPage from './features/fengshui/FengshuiPage'
import { DivinationPage } from './features/divination/DivinationPage'
import WannianliPage from './features/almanac/WannianliPage'
import { ShenShaPage } from './features/shensha/ShenShaPage'
import { RenshiPage } from './features/renshi/RenshiPage'
import { MePage } from './features/me/MePage'
import { useAuth } from './hooks/useAuth'
import { migrateAllRecords } from './services/migrateService'

function AppContent() {
  const [tab, setTab] = useState<AppTab>('home')
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const { user } = useAuth()

  // 主题（含本地持久化）
  useEffect(() => {
    const saved = localStorage.getItem('yubi_theme')
    if (saved === 'dark' || saved === 'light') setTheme(saved)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('yubi_theme', theme)
  }, [theme])

  // 管理员登录后，自动触发一次数据迁移
  const [migrateResult, setMigrateResult] = useState<string | null>(null)
  useEffect(() => {
    if (user?.isAdmin) {
      migrateAllRecords()
        .then(r => {
          const total = r.bazi + r.divination + r.compat
          if (total > 0) setMigrateResult(`已迁移 ${total} 条记录到数据库`)
        })
        .catch(() => {})
    }
  }, [user?.isAdmin])

  // 追光效果：为卡片类元素设置鼠标位置 CSS 变量
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const targets = document.querySelectorAll<HTMLElement>('.spotlight-card, .hub-card, .feat-card, .ai-insight')
      for (const el of targets) {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
        el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
      }
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  const go = useCallback((t: AppTab) => {
    setTab(t)
    window.scrollTo({ top: 0 })
  }, [])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  return (
    <NavProvider value={go}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopNav
          activeTab={tab}
          onTabChange={go}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main style={{ flex: 1 }}>
          {tab === 'home' && (
            <ErrorBoundary>
              <HomeLanding onNavigate={go} />
            </ErrorBoundary>
          )}
          {tab !== 'home' && (
            <div className="site-container" style={{ paddingBottom: 96 }}>
              {migrateResult && tab === 'me' && (
                <div className="ds-chip ds-chip-ink" style={{ marginBottom: 12 }}>{migrateResult}</div>
              )}
              <ErrorBoundary>
                <div className="fade-in" key={tab}>
                  {tab === 'bazi' && <BaziPage />}
                  {tab === 'compat' && <CompatPage />}
                  {tab === 'fengshui' && <FengshuiPage />}
                  {tab === 'divination' && <DivinationPage />}
                  {tab === 'almanac' && <WannianliPage />}
                  {tab === 'shensha' && <ShenShaPage />}
                  {tab === 'renshi' && <RenshiPage />}
                  {tab === 'me' && <MePage onOpenLogin={() => setLoginOpen(true)} />}
                </div>
              </ErrorBoundary>
            </div>
          )}
        </main>

        <SiteFooter onNavigate={go} />
        <BottomDock
          activeTab={tab}
          onTabChange={go}
        />

        <LoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true) }}
        />
        <RegisterModal
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true) }}
        />
      </div>
    </NavProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}
