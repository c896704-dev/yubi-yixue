import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { getDeviceInfo, updateDeviceInfo } from '../../services/fengshuiApi'

export function FengshuiSettings() {
  const [deviceId, setDeviceId] = useState('')
  const [nickname, setNickname] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDeviceInfo()
      .then((res: any) => { setDeviceId(res.data?.id || ''); setNickname(res.data?.nickname || '') })
      .catch(() => {})
  }, [])

  const handleSaveNickname = async () => {
    try { await updateDeviceInfo(nickname); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    catch {}
  }

  return (
    <div className="flex flex-col gap-5">
      <Card title="API Key 配置">
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            API Key 已通过服务端环境变量 <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg)', color: 'var(--primary-hover)' }}>DASHSCOPE_API_KEY</code> 配置，无需在浏览器中输入。
          </p>
        </div>
      </Card>

      {deviceId && (
        <Card title="设备信息">
          <div className="flex flex-col gap-4">
            <div>
              <span className="field-label">设备 ID</span>
              <code className="block mt-1 py-2 px-3 rounded-lg text-[11px] break-all" style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>{deviceId}</code>
            </div>
            <Input label="设备昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="给设备起个名字" />
            <Button onClick={handleSaveNickname} size="sm" variant="mist">保存昵称</Button>
            {saved && <span className="text-xs" style={{ color: 'var(--success)' }}>已保存</span>}
          </div>
        </Card>
      )}
    </div>
  )
}
