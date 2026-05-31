import { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LoginModal } from './features/auth/LoginModal'
import { RegisterModal } from './features/auth/RegisterModal'
import BaziPage from './features/bazi/BaziPage'
import CompatPage from './features/compat/CompatPage'
import FengshuiPage from './features/fengshui/FengshuiPage'
import { DivinationPage } from './features/divination/DivinationPage'
import { useAuth } from './hooks/useAuth'

type Tab = 'bazi' | 'compat' | 'fengshui' | 'divination'

const pageMeta: Record<Tab, { title: string; desc: string }> = {
  bazi: { title: '八字排盘', desc: '输入出生信息，解读命理格局' },
  compat: { title: '双人合盘', desc: '两命相合，缘分之深浅一窥便知' },
  fengshui: { title: '风水分析', desc: '户型图、楼盘位置 · 环境吉凶分析' },
  divination: { title: '算卦', desc: '六爻 · 梅花易数 · 诚心所至，卦象自明' },
}

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'bazi', label: '八字排盘', icon: '☰' },
  { key: 'compat', label: '双人合盘', icon: '☯' },
  { key: 'fengshui', label: '风水分析', icon: '⛰' },
  { key: 'divination', label: '算卦', icon: '䷀' },
]

function AppContent() {
  const [tab, setTab] = useState<Tab>('bazi')
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const meta = pageMeta[tab]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-window)' }}>
      {/* Sidebar — desktop */}
      {!isMobile && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--label)', letterSpacing: '-0.01em' }}>
              御笔易学
            </div>
          </div>

          <div className="sidebar-title">功能</div>
          <nav className="sidebar-nav">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`sidebar-item ${t.key === tab ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                <span className="sidebar-item-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            {user ? (
              <>
                <div className="sidebar-user" onClick={logout}>
                  <span style={{ fontSize: 13, color: 'var(--secondary)' }}>
                    {user.username} {user.isAdmin && '(管理员)'}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--tertiary)' }}>
                    退出
                  </span>
                </div>
              </>
            ) : (
              <button className="sidebar-user" onClick={() => setLoginOpen(true)}>
                登录 / 注册
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1 }}>
        <div className="page-wrap">
          <div className="page-header">
            <h1 className="page-header-title">{meta.title}</h1>
            {meta.desc && <p className="page-header-desc">{meta.desc}</p>}
          </div>

          <ErrorBoundary>
            <div className="fade-in" key={tab}>
              {tab === 'bazi' && <BaziPage />}
              {tab === 'compat' && <CompatPage />}
              {tab === 'fengshui' && <FengshuiPage />}
              {tab === 'divination' && <DivinationPage />}
            </div>
          </ErrorBoundary>

          <div className="page-footer">御笔易学 · 命理参详</div>
        </div>
      </main>

      {/* Bottom Tab Bar — mobile */}
      {isMobile && (
        <nav className="bottom-bar">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`bottom-bar-item ${t.key === tab ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span className="icon">{t.icon}</span>
              <span>{t.label.slice(0, 2)}</span>
            </button>
          ))}
          {user ? (
            <button className="bottom-bar-item" onClick={logout}>
              <span className="icon">👤</span>
              <span>退出</span>
            </button>
          ) : (
            <button className="bottom-bar-item" onClick={() => setLoginOpen(true)}>
              <span className="icon">👤</span>
              <span>我的</span>
            </button>
          )}
        </nav>
      )}

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
