import { useCallback, useEffect, useState } from 'react'
import { ToolHeader } from '../../components/layout/ToolHeader'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import {
  getAllRecordsMerged, deleteRecord, getRecordCount,
  getAllDivinationRecordsMerged, deleteDivinationRecord,
  getAllCompatRecords, deleteCompatRecord, type CompatRecord,
  getStorageDiagnostics, type StorageDiagnostics,
} from '../../utils/db'
import { migrateAllRecords } from '../../services/migrateService'
import { useToast } from '../../components/ui/Toast'
import {
  Coins, Compass, History, RefreshCw, ShieldCheck, Trash2, User, Users,
} from '../../components/ui/Icon'

interface MePageProps {
  onOpenLogin: () => void
}

export function MePage({ onOpenLogin }: MePageProps) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [baziRecords, setBaziRecords] = useState<Awaited<ReturnType<typeof getAllRecordsMerged>>>([])
  const [divRecords, setDivRecords] = useState<Awaited<ReturnType<typeof getAllDivinationRecordsMerged>>>([])
  const [compatRecords, setCompatRecords] = useState<CompatRecord[]>([])
  const [count, setCount] = useState(0)
  const [diag, setDiag] = useState<StorageDiagnostics | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrateMsg, setMigrateMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [br, dr, cr, c, d] = await Promise.all([
      getAllRecordsMerged().catch(() => []),
      getAllDivinationRecordsMerged().catch(() => []),
      getAllCompatRecords().catch(() => []),
      getRecordCount().catch(() => 0),
      getStorageDiagnostics().catch(() => null),
    ])
    setBaziRecords(br)
    setDivRecords(dr)
    setCompatRecords(cr)
    setCount(c)
    setDiag(d)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleDelete = useCallback(async (id: string) => {
    await deleteRecord(id)
    toast('info', '已删除八字记录')
    refresh()
  }, [refresh, toast])

  const handleDeleteDiv = useCallback(async (id: string) => {
    await deleteDivinationRecord(id)
    toast('info', '已删除算卦记录')
    refresh()
  }, [refresh, toast])

  const handleMigrate = useCallback(async () => {
    setMigrating(true)
    setMigrateMsg(null)
    try {
      const r = await migrateAllRecords()
      setMigrateMsg(`迁移完成：八字 ${r.bazi} 条、算卦 ${r.divination} 条、合盘 ${r.compat} 条（跳过 ${r.skipped} 条重复）`)
      toast('success', '数据迁移完成')
      refresh()
    } catch (e: any) {
      setMigrateMsg(`迁移失败：${e?.message || e}`)
      toast('error', '数据迁移失败')
    } finally {
      setMigrating(false)
    }
  }, [refresh, toast])



  const handleDeleteCompat = useCallback(async (id: string) => {
    await deleteCompatRecord(id)
    toast('info', '已删除合盘记录')
    refresh()
  }, [refresh, toast])

  return (
    <div>
      <ToolHeader eyebrow="MY ACCOUNT" title="我的" desc={user ? `${user.username}，欢迎回来。此处汇聚你的全部命理记录。` : '本地排盘、起卦与合盘记录，皆汇聚于此。'} />

      {/* 账户卡 / 未登录引导 */}
      {user ? (
        <div className="ds-card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span
              className="font-serif flex items-center justify-center rounded-lg"
              style={{
                width: 52, height: 52, fontSize: 22, fontWeight: 700,
                background: 'var(--dai-qing)', color: 'var(--xuan-zhi)',
              }}
            >
              {user.username.slice(0, 1)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-serif text-lg font-bold" style={{ color: 'var(--dai-qing)' }}>{user.username}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(0,77,77,0.55)' }}>
                {user.email} · 记录总数 {count} 条
              </div>
            </div>
            {user.isAdmin && (
              <span className="ds-chip ds-chip-gold"><ShieldCheck size={12} /> 管理员</span>
            )}
            <Button variant="secondary" size="sm" onClick={() => { logout(); toast('info', '已退出登录') }}>退出登录</Button>
          </div>
        </div>
      ) : (
        <div className="ds-card mb-6 flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-4">
            <span style={{ color: 'rgba(0,77,77,0.35)' }}><User size={34} strokeWidth={1.2} /></span>
            <div>
              <div className="font-serif text-base font-bold" style={{ color: 'var(--dai-qing)' }}>尚未登录</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(0,77,77,0.55)' }}>本地记录照常可用；登录后可跨设备同步。</div>
            </div>
          </div>
          <Button onClick={onOpenLogin}>登录 / 注册</Button>
        </div>
      )}

      {/* 记录聚合 */}
      <div className="grid gap-5 md:grid-cols-3 mb-6">
        <div className="ds-card">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: 'rgba(0,77,77,0.08)', color: 'var(--dai-qing)' }}>
              <Compass size={18} />
            </span>
            <h3 className="font-serif font-bold" style={{ color: 'var(--dai-qing)' }}>八字排盘</h3>
          </div>
          <div className="font-serif text-3xl font-bold mb-2" style={{ color: 'var(--hu-po-jin-dark)' }}>
            {baziRecords.length}
          </div>
          <div className="flex flex-col max-h-40 overflow-y-auto">
            {baziRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-1.5 border-t" style={{ borderColor: 'var(--dan-mo)' }}>
                <span className="text-xs truncate" style={{ color: 'var(--dai-qing)' }}>
                  {r.label} · {r.person.gender}{r.person.birthYear}年
                </span>
                <button
                  className="p-1 rounded transition-colors hover:bg-red-50"
                  style={{ color: 'rgba(156,61,84,0.7)' }}
                  onClick={() => handleDelete(r.id)}
                  title="删除"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {baziRecords.length === 0 && <span className="text-xs py-2" style={{ color: 'rgba(0,77,77,0.45)' }}>暂无记录</span>}
          </div>
        </div>

        <div className="ds-card">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: 'rgba(156,61,84,0.08)', color: 'var(--zhu-sha)' }}>
              <Users size={18} />
            </span>
            <h3 className="font-serif font-bold" style={{ color: 'var(--dai-qing)' }}>双人合盘</h3>
          </div>
          <div className="font-serif text-3xl font-bold mb-2" style={{ color: 'var(--hu-po-jin-dark)' }}>
            {compatRecords.length}
          </div>
          <div className="flex flex-col max-h-40 overflow-y-auto">
            {compatRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-1.5 border-t" style={{ borderColor: 'var(--dan-mo)' }}>
                <span className="text-xs truncate" style={{ color: 'var(--dai-qing)' }}>{r.label}</span>
                <button
                  className="p-1 rounded"
                  style={{ color: 'rgba(156,61,84,0.7)' }}
                  onClick={() => handleDeleteCompat(r.id)}
                  title="删除"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {compatRecords.length === 0 && <span className="text-xs py-2" style={{ color: 'rgba(0,77,77,0.45)' }}>暂无记录</span>}
          </div>
        </div>

        <div className="ds-card">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: 'rgba(184,150,15,0.12)', color: 'var(--hu-po-jin-dark)' }}>
              <Coins size={18} />
            </span>
            <h3 className="font-serif font-bold" style={{ color: 'var(--dai-qing)' }}>算卦记录</h3>
          </div>
          <div className="font-serif text-3xl font-bold mb-2" style={{ color: 'var(--hu-po-jin-dark)' }}>
            {divRecords.length}
          </div>
          <div className="flex flex-col max-h-40 overflow-y-auto">
            {divRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-1.5 border-t" style={{ borderColor: 'var(--dan-mo)' }}>
                <span className="text-xs truncate" style={{ color: 'var(--dai-qing)' }}>
                  {r.type === 'liuyao' ? '六爻' : '梅花'} · {r.label}
                </span>
                <button
                  className="p-1 rounded transition-colors"
                  style={{ color: 'rgba(156,61,84,0.7)' }}
                  onClick={() => handleDeleteDiv(r.id)}
                  title="删除"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {divRecords.length === 0 && <span className="text-xs py-2" style={{ color: 'rgba(0,77,77,0.45)' }}>暂无记录</span>}
          </div>
        </div>
      </div>

      {/* 存储诊断 */}
      {diag && (
        <div className="ds-card mb-6">
          <h3 className="ds-card-head"><History size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />存储诊断</h3>
          <div className="grid gap-2 text-sm">
            {diag.databases.map((db) => (
              <div key={db.name} className="p-3 rounded-lg" style={{ background: 'var(--xuan-zhi-dark)' }}>
                <div className="text-xs mb-1" style={{ color: 'rgba(0,77,77,0.55)' }}>{db.name}</div>
                <div className="flex flex-wrap gap-2">
                  {db.stores.map((st) => (
                    <span key={st} className="ds-chip ds-chip-ink">
                      {st} · {db.counts[st] ?? 0} 条
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="p-3 rounded-lg" style={{ background: 'var(--xuan-zhi-dark)' }}>
              <div className="text-xs mb-1" style={{ color: 'rgba(0,77,77,0.55)' }}>localStorage</div>
              <div className="flex flex-wrap gap-2">
                {diag.localStorageKeys.map((k) => (
                  <span key={k} className="ds-chip ds-chip-ink">{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 后台管理（管理员） */}
      {user?.isAdmin && (
        <div className="ds-card" style={{ borderColor: 'rgba(212,175,55,0.35)' }}>
          <h3 className="ds-card-head"><ShieldCheck size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />后台管理</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button onClick={handleMigrate} loading={migrating} disabled={migrating}>
              <RefreshCw size={14} />
              {migrating ? '迁移中…' : '迁移浏览器数据到服务端'}
            </Button>
            {migrateMsg && (
              <span className="text-xs leading-relaxed" style={{ color: 'rgba(0,77,77,0.65)' }}>{migrateMsg}</span>
            )}
          </div>
          <p className="text-xs mt-3" style={{ color: 'rgba(0,77,77,0.5)' }}>
            将本地 localStorage 中的历史记录同步至服务端数据库，登录状态下自动执行。
          </p>
        </div>
      )}
    </div>
  )
}
