import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { TopNav } from './components/layout/TopNav'
import { PageContainer } from './components/layout/PageContainer'
import { LoginModal } from './features/auth/LoginModal'
import { RegisterModal } from './features/auth/RegisterModal'
import BaziPage from './features/bazi/BaziPage'
import CompatPage from './features/compat/CompatPage'
import FengshuiPage from './features/fengshui/FengshuiPage'
import { DivinationPage } from './features/divination/DivinationPage'
import { useAuth } from './hooks/useAuth'

type Tab = 'bazi' | 'compat' | 'fengshui' | 'divination'

function AppContent() {
  const [tab, setTab] = useState<Tab>('bazi')
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-paper-100">
      <TopNav
        activeTab={tab}
        onTabChange={setTab}
        isLoggedIn={!!user}
        username={user?.username}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={logout}
      />
      <PageContainer>
        <ErrorBoundary>
          {tab === 'bazi' && <BaziPage />}
          {tab === 'compat' && <CompatPage />}
          {tab === 'fengshui' && <FengshuiPage />}
          {tab === 'divination' && <DivinationPage />}
        </ErrorBoundary>
      </PageContainer>

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
