import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

export function LoginModal({ open, onClose, onSwitchToRegister }: LoginModalProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('请填写所有字段'); return }
    setError(''); setLoading(true)
    try { await login(email, password); onClose() }
    catch (err: any) { setError(err.message || '登录失败') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="登录">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" />
        <Input label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" />
        {error && <span className="input-error-msg">{error}</span>}
        <Button type="submit" loading={loading} className="w-full !mt-2">登录</Button>
        <div className="text-center text-sm text-[#8C8C8C]">
          还没有账号？
          <button type="button" onClick={onSwitchToRegister} className="bg-transparent border-none text-brand-500 cursor-pointer font-semibold ml-1">立即注册</button>
        </div>
      </form>
    </Modal>
  )
}
