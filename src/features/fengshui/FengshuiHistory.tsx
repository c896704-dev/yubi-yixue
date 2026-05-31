import { useEffect, useState } from 'react'
import { useFengshuiHistory } from '../../hooks/useFengshui'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Loading } from '../../components/ui/Loading'
import { Empty } from '../../components/ui/Empty'

const typeLabels: Record<string, string> = { layout: '户型图', location: '楼盘', comprehensive: '综合' }

function scoreCircleColor(s: number): string {
  if (s >= 80) return '#7A9A7A'
  if (s >= 60) return '#4A9E9E'
  return '#C4664A'
}

interface FengshuiHistoryProps {
  onViewDetail: (id: string) => void
}

export function FengshuiHistory({ onViewDetail }: FengshuiHistoryProps) {
  const { records, total, loading, fetchRecords, removeRecord } = useFengshuiHistory()
  const [page, setPage] = useState(0)
  const limit = 10
  // 登录/登出时重新加载（让服务端重新按权限过滤）
  const authToken = localStorage.getItem('auth_token')

  useEffect(() => {
    fetchRecords({ limit, offset: page * limit })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, fetchRecords, authToken])

  return (
    <div className="flex flex-col gap-5">
      <Card title="历史记录">
        {loading ? (
          <Loading text="加载中..." />
        ) : records.length === 0 ? (
          <Empty message="暂无分析记录" />
        ) : (
          <div className="flex flex-col gap-2">
            {records.map((r: any) => (
              <div
                key={r.id}
                onClick={() => onViewDetail(r.id)}
                className="flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--bg)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-[family-name:var(--font-title)] text-[15px] font-bold shrink-0 text-white" style={{ backgroundColor: scoreCircleColor(r.overall_score) }}>
                    {r.overall_score ?? '—'}
                  </div>
                  <div>
                    <Badge variant="mist">{typeLabels[r.type] || r.type}</Badge>
                    <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{r.summary?.slice(0, 60) || '—'}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
                <Button variant="clear" size="sm" onClick={(e) => { e.stopPropagation(); removeRecord(r.id) }}>删除</Button>
              </div>
            ))}
          </div>
        )}

        {total > limit && (
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="clear" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>上一页</Button>
            <span className="text-sm py-1.5" style={{ color: 'var(--muted)' }}>{page + 1} / {Math.ceil(total / limit)}</span>
            <Button variant="clear" size="sm" disabled={(page + 1) * limit >= total} onClick={() => setPage((p) => p + 1)}>下一页</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
