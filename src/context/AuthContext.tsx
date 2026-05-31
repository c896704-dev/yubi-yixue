import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import api from '../services/api'

interface User {
  id: string
  email: string
  username: string
  isAdmin?: boolean
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then((res: any) => setUser(res.data.user))
      .catch(() => { localStorage.removeItem('auth_token') })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res: any = await api.post('/auth/login', { email, password })
    localStorage.setItem('auth_token', res.data.token)
    setUser(res.data.user)
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    const res: any = await api.post('/auth/register', { email, username, password })
    localStorage.setItem('auth_token', res.data.token)
    setUser(res.data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
