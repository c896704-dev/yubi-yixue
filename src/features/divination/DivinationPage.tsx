import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LiuyaoPage } from './liuyao/LiuyaoPage'
import { MeihuaPage } from './meihua/MeihuaPage'
import { getAllDivinationRecords, deleteDivinationRecord, type DivinationRecord } from '../../utils/db'

type View = 'hub' | 'liuyao' | 'meihua'

export function DivinationPage() {
  const [view, setView] = useState<View>('hub')
  const [history, setHistory] = useState<DivinationRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [viewingRecord, setViewingRecord] = useState<DivinationRecord | null>(null)

  const loadHistory = () => getAllDivinationRecords().then(setHistory)
  useEffect(() => { loadHistory() }, [])

  const goHub = () => { setView('hub'); setViewingRecord(null); loadHistory() }

  const handleViewRecord = (r: DivinationRecord) => {
    setViewingRecord(r)
    setView(r.type)
  }

  if (view === 'liuyao') {
    return (
      <LiuyaoPage
        onBack={goHub}
        viewingRecord={viewingRecord?.type === 'liuyao' ? viewingRecord : undefined}
      />
    )
  }

  if (view === 'meihua') {
    return (
      <MeihuaPage
        onBack={goHub}
        viewingRecord={viewingRecord?.type === 'meihua' ? viewingRecord : undefined}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center py-4">
        <h2 className="font-serif text-2xl text-[#2C2C2C]">算卦</h2>
        <p className="text-sm text-[#8C8C8C] mt-1">择一法而问天机，诚心所至，卦象自明</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[700px] mx-auto w-full">
        {/* 六爻入口 */}
        <Card variant="interactive" className="text-center cursor-pointer" onClick={() => setView('liuyao')}>
          <div className="py-6">
            <div className="text-5xl mb-4">🪙</div>
            <h3 className="font-serif text-xl text-[#2C2C2C] mb-2">六爻</h3>
            <p className="text-sm text-[#8C8C8C] leading-relaxed">
              三钱起卦，六爻成象。源自《增删卜易》，以摇卦之法问事之吉凶。
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="badge bg-paper-200 text-[#8C8C8C]">摇卦</span>
              <span className="badge bg-paper-200 text-[#8C8C8C]">数字</span>
              <span className="badge bg-paper-200 text-[#8C8C8C]">随机</span>
            </div>
          </div>
        </Card>

        {/* 梅花易数入口 */}
        <Card variant="interactive" className="text-center cursor-pointer" onClick={() => setView('meihua')}>
          <div className="py-6">
            <div className="text-5xl mb-4">🌸</div>
            <h3 className="font-serif text-xl text-[#2C2C2C] mb-2">梅花易数</h3>
            <p className="text-sm text-[#8C8C8C] leading-relaxed">
              象数理占，体用生克。源自邵雍《梅花易数》，以数理推演万物之机。
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="badge bg-paper-200 text-[#8C8C8C]">数字</span>
              <span className="badge bg-paper-200 text-[#8C8C8C]">时间</span>
              <span className="badge bg-paper-200 text-[#8C8C8C]">文字</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 历史记录 */}
      {history.length > 0 && (
        <Card className="max-w-[700px] mx-auto w-full">
          <div className="flex justify-between items-center">
            <span className="font-serif text-lg font-semibold text-[#2C2C2C]">算卦记录</span>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? '收起' : `展开 (${history.length})`}
            </Button>
          </div>
          {showHistory && (
            <div className="mt-4 flex flex-col gap-1.5 max-h-[300px] overflow-auto">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center py-2.5 px-3.5 bg-paper-50 rounded-lg hover:bg-paper-100 cursor-pointer"
                  onClick={() => handleViewRecord(r)}
                >
                  <div>
                    <span className="text-sm font-semibold text-[#2C2C2C]">{r.label}</span>
                    {r.question && (
                      <div className="text-xs text-[#8C8C8C] mt-0.5 truncate max-w-[300px]">
                        问：{r.question}
                      </div>
                    )}
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${r.type === 'liuyao' ? 'bg-amber-100 text-amber-700' : 'bg-pink-100 text-pink-700'}`}>
                        {r.type === 'liuyao' ? '六爻' : '梅花易数'}
                      </span>
                      <span className="text-xs text-[#8C8C8C]">{new Date(r.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleViewRecord(r)}>查看</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteDivinationRecord(r.id).then(loadHistory)}>删除</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 底部说明 */}
      <Card variant="tinted" className="max-w-[700px] mx-auto w-full">
        <div className="text-sm text-[#8C8C8C] leading-relaxed">
          <p className="font-serif text-[#2C2C2C] mb-2">起卦须知</p>
          <ul className="space-y-1">
            <li>心诚则灵，起卦前请静心凝神，默念所问之事</li>
            <li>一事一问，不可同时问多事，亦不可反复占问同一事</li>
            <li>卦象仅供参考，人生决策仍需理性判断</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
