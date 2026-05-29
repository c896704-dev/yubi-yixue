import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

interface RegisterModalProps {
  open: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

export function RegisterModal({ open, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !username || !password || !confirm) { setError('请填写所有字段'); return }
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 6) { setError('密码至少6位'); return }
    setError(''); setLoading(true)
    try { await register(email, username, password); onClose() }
    catch (err: any) { setError(err.message || '注册失败') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="注册">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" />
        <Input label="用户名" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" />
        <Input label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少6位密码" />
        <Input label="确认密码" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="再次输入密码" />
        {error && <span className="text-xs" style={{ color: 'var(--danger)' }}>{error}</span>}
        <Button type="submit" loading={loading} className="w-full !mt-2">注册</Button>
        <div className="text-center text-sm" style={{ color: 'var(--muted)' }}>
          已有账号？
          <button type="button" onClick={onSwitchToLogin} className="bg-transparent border-none cursor-pointer font-semibold ml-1" style={{ color: 'var(--primary)' }}>
            立即登录
          </button>
        </div>
      </form>
    </Modal>
  )
}
