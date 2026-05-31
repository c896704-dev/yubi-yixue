import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { LiuyaoPage } from './liuyao/LiuyaoPage'
import { MeihuaPage } from './meihua/MeihuaPage'
import { getAllDivinationRecordsMerged, deleteDivinationRecord, type DivinationRecord } from '../../utils/db'

type View = 'hub' | 'liuyao' | 'meihua'

export function DivinationPage() {
  const [view, setView] = useState<View>('hub')
  const [history, setHistory] = useState<DivinationRecord[]>([])
  const [showHistory, setShowHistory] = useState(true)
  const [viewingRecord, setViewingRecord] = useState<DivinationRecord | null>(null)

  const loadHistory = () => getAllDivinationRecordsMerged().then(setHistory).catch(() => setHistory([]))
  // 登录/登出时重新加载
  const authToken = localStorage.getItem('auth_token')
  useEffect(() => { loadHistory() }, [authToken])

  const goHub = () => { setView('hub'); setViewingRecord(null); loadHistory() }

  const handleViewRecord = (r: DivinationRecord) => { setViewingRecord(r); setView(r.type) }

  if (view === 'liuyao') return <LiuyaoPage onBack={goHub} viewingRecord={viewingRecord?.type === 'liuyao' ? viewingRecord : undefined} />
  if (view === 'meihua') return <MeihuaPage onBack={goHub} viewingRecord={viewingRecord?.type === 'meihua' ? viewingRecord : undefined} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Hub — method selection */}
      <div className="hub-grid">
        <div className="hub-card" onClick={() => setView('liuyao')}>
          <div className="hub-icon">🪙</div>
          <h3 className="hub-name">六爻</h3>
          <p className="hub-desc">三钱起卦，六爻成象。源自《增删卜易》，以摇卦之法问事之吉凶。</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginTop: 14 }}>
            <span className="badge badge-muted">摇卦</span>
            <span className="badge badge-muted">数字</span>
            <span className="badge badge-muted">随机</span>
          </div>
        </div>

        <div className="hub-card" onClick={() => setView('meihua')}>
          <div className="hub-icon">🌸</div>
          <h3 className="hub-name">梅花易数</h3>
          <p className="hub-desc">象数理占，体用生克。源自邵雍《梅花易数》，以数理推演万物之机。</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginTop: 14 }}>
            <span className="badge badge-muted">数字</span>
            <span className="badge badge-muted">时间</span>
            <span className="badge badge-muted">文字</span>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>算卦记录</h3>
          <button className="fold-trigger" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '收起' : `展开 (${history.length})`}
          </button>
        </div>

        {history.length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--tertiary)', padding: '8px 0' }}>
            暂无算卦记录，完成一次六爻或梅花易数后会自动保存在这里。
          </p>
        )}

        {history.length > 0 && showHistory && (
          <div className="card" style={{ padding: '4px 0' }}>
            {history.map((r) => (
              <div key={r.id} className="history-row" onClick={() => handleViewRecord(r)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="history-row-label">{r.label}</div>
                  {r.question && (
                    <div className="history-row-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      问：{r.question}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                    <span className="badge badge-primary">{r.type === 'liuyao' ? '六爻' : '梅花易数'}</span>
                    <span style={{ fontSize: 11, color: 'var(--tertiary)' }}>{new Date(r.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                <div className="history-row-actions" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => handleViewRecord(r)}>查看</Button>
                  <Button variant="danger-ghost" size="sm" onClick={() => deleteDivinationRecord(r.id).then(loadHistory)}>删除</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notice */}
      <div style={{ fontSize: 13, color: 'var(--tertiary)', lineHeight: 1.8 }}>
        <p style={{ fontWeight: 500, color: 'var(--secondary)', marginBottom: 6 }}>起卦须知</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>心诚则灵，起卦前请静心凝神，默念所问之事</li>
          <li>一事一问，不可同时问多事，亦不可反复占问同一事</li>
          <li>卦象仅供参考，人生决策仍需理性判断</li>
        </ul>
      </div>
    </div>
  )
}
