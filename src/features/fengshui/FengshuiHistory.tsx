import { useEffect, useState } from 'react'
import { useFengshuiHistory } from '../../hooks/useFengshui'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Loading } from '../../components/ui/Loading'
import { Empty } from '../../components/ui/Empty'

const typeLabels: Record<string, string> = { layout: '户型图', location: '楼盘', comprehensive: '综合' }

function scoreCircleColor(s: number): string {
  if (s >= 80) return 'bg-positive-50 text-positive-500'
  if (s >= 60) return 'bg-gold-50 text-gold-500'
  return 'bg-negative-50 text-negative-400'
}

interface FengshuiHistoryProps {
  onViewDetail: (id: string) => void
}

export function FengshuiHistory({ onViewDetail }: FengshuiHistoryProps) {
  const { records, total, loading, fetchRecords, removeRecord } = useFengshuiHistory()
  const [page, setPage] = useState(0)
  const limit = 10

  useEffect(() => {
    fetchRecords({ limit, offset: page * limit })
  }, [page, fetchRecords])

  return (
    <div className="flex flex-col gap-6">
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
                className="flex items-center justify-between py-3 px-4 bg-paper-50 rounded-lg cursor-pointer hover:bg-paper-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-serif text-[15px] font-bold shrink-0 ${scoreCircleColor(r.overall_score)}`}>
                    {r.overall_score ?? '—'}
                  </div>
                  <div>
                    <Badge variant="default">{typeLabels[r.type] || r.type}</Badge>
                    <div className="text-sm text-[#8C8C8C] mt-1">{r.summary?.slice(0, 60) || '—'}</div>
                    <div className="text-[11px] text-[#B8B8B8] mt-0.5">{new Date(r.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeRecord(r.id) }}>删除</Button>
              </div>
            ))}
          </div>
        )}

        {total > limit && (
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>上一页</Button>
            <span className="text-sm text-[#8C8C8C] py-1.5">{page + 1} / {Math.ceil(total / limit)}</span>
            <Button variant="ghost" size="sm" disabled={(page + 1) * limit >= total} onClick={() => setPage((p) => p + 1)}>下一页</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
