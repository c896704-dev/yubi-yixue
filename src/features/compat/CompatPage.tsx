import { useState, useCallback, useEffect } from 'react'
import type { PersonInfo, AnalysisResult } from '../../types'
import { analyzePerson } from '../../utils/analysis'
import { renderEnhancedCompatibilityReport } from '../../utils/compatibility'
import { useCompat } from '../../hooks/useBazi'
import { getAllRecords, deleteRecord, type SavedRecord, saveCompatRecord, getAllCompatRecords, deleteCompatRecord, type CompatRecord } from '../../utils/db'
import { buildCompatQASystemPrompt } from '../../utils/ai'
import { ChatPanel } from '../../components/ui/ChatPanel'
import { DualInput } from './DualInput'
import { CompatScore } from './CompatScore'
import { CompatReport } from './CompatReport'
import { BaziChart } from '../../components/viz/BaziChart'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/Loading'

export default function CompatPage() {
  const [person1, setPerson1] = useState<PersonInfo | null>(null)
  const [person2, setPerson2] = useState<PersonInfo | null>(null)
  const [result1, setResult1] = useState<AnalysisResult | null>(null)
  const [result2, setResult2] = useState<AnalysisResult | null>(null)
  const [analyzing1, setAnalyzing1] = useState(false)
  const [analyzing2, setAnalyzing2] = useState(false)
  const [hasRunCompat, setHasRunCompat] = useState(false)
  const { loading, result, aiInsight, aiLoading, aiError, analyze: runCompat, fetchAiInsight, reset } = useCompat()
  const [report, setReport] = useState<string | null>(null)
  const [records, setRecords] = useState<SavedRecord[]>([])
  const [showRecords, setShowRecords] = useState(false)
  const [compatRecords, setCompatRecords] = useState<CompatRecord[]>([])
  const [showCompatHistory, setShowCompatHistory] = useState(false)

  useEffect(() => {
    getAllRecords().then(setRecords)
    getAllCompatRecords().then(setCompatRecords)
  }, [])

  // aiInsight 异步返回后更新已保存的合盘记录
  useEffect(() => {
    if (aiInsight && result) {
      getAllCompatRecords().then(records => {
        const latest = records[0]
        if (latest && !latest.aiInsight) {
          saveCompatRecord({ ...latest, aiInsight }).then(() => getAllCompatRecords().then(setCompatRecords))
        }
      })
    }
  }, [aiInsight, result])

  const loadPerson = useCallback((record: SavedRecord, side: 1 | 2) => {
    setShowRecords(false)
    if (side === 1) {
      setPerson1(record.person)
      setAnalyzing1(true)
      setResult1(analyzePerson(record.person))
      setAnalyzing1(false)
    } else {
      setPerson2(record.person)
      setAnalyzing2(true)
      setResult2(analyzePerson(record.person))
      setAnalyzing2(false)
    }
  }, [])

  const handleAnalyze1 = useCallback(async (person: PersonInfo) => {
    setPerson1(person); setAnalyzing1(true)
    setResult1(analyzePerson(person))
    setAnalyzing1(false)
  }, [])

  const handleAnalyze2 = useCallback(async (person: PersonInfo) => {
    setPerson2(person); setAnalyzing2(true)
    setResult2(analyzePerson(person))
    setAnalyzing2(false)
  }, [])

  const handleCompat = useCallback(async () => {
    if (!result1 || !result2) return
    const compatResult = await runCompat(result1, result2)
    setReport(renderEnhancedCompatibilityReport(compatResult))
    setHasRunCompat(true)
    fetchAiInsight(result1, result2)
    // 自动保存合盘记录
    const label = `${person1!.name} & ${person2!.name} · 合盘`
    saveCompatRecord({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      malePerson: person1!,
      femalePerson: person2!,
      result: compatResult,
      aiInsight: null,
      label,
      createdAt: Date.now(),
    }).then(() => getAllCompatRecords().then(setCompatRecords))
  }, [result1, result2, person1, person2, runCompat, fetchAiInsight])

  const handleReset = useCallback(() => {
    setPerson1(null); setPerson2(null)
    setResult1(null); setResult2(null)
    setReport(null); setHasRunCompat(false)
    reset()
  }, [reset])

  return (
    <div className="flex flex-col gap-8">
      {/* 合盘历史记录 — 始终可见 */}
      <Card>
        <div className="flex justify-between items-center">
          <span className="font-serif text-lg font-semibold text-[#2C2C2C]">合盘历史</span>
          {compatRecords.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowCompatHistory(!showCompatHistory)}>
              {showCompatHistory ? '收起' : `展开 (${compatRecords.length})`}
            </Button>
          )}
        </div>
        {compatRecords.length === 0 && (
          <p className="text-sm text-[#8C8C8C] mt-4">完成合盘分析后，记录将自动保存在此，方便随时查看。</p>
        )}
        {compatRecords.length > 0 && showCompatHistory && (
          <div className="mt-4 flex flex-col gap-1.5">
            {compatRecords.map((cr) => (
              <div key={cr.id} className="flex justify-between items-center py-2.5 px-3.5 bg-paper-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-semibold text-[#2C2C2C]">{cr.label}</span>
                  <span className="text-[#8C8C8C] ml-2 text-xs">
                    {new Date(cr.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteCompatRecord(cr.id).then(() => getAllCompatRecords().then(setCompatRecords))}>
                  删除
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!hasRunCompat && (
        <>
          {records.length > 0 && (
            <Card>
              <div className="flex justify-between items-center">
                <span className="font-serif text-lg font-semibold text-[#2C2C2C]">选择档案</span>
                <Button variant="ghost" size="sm" onClick={() => setShowRecords(!showRecords)}>
                  {showRecords ? '收起' : `展开 (${records.length})`}
                </Button>
              </div>
              {showRecords && (
                <div className="mt-4 flex flex-col gap-1.5">
                  {records.map((r) => (
                    <div key={r.id} className="flex justify-between items-center py-2.5 px-3.5 bg-paper-50 rounded-lg">
                      <span className="text-sm font-semibold text-[#2C2C2C]">{r.label}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => loadPerson(r, 1)}>男方</Button>
                        <Button variant="ghost" size="sm" onClick={() => loadPerson(r, 2)}>女方</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <div className="grid grid-cols-2 gap-6">
            <DualInput label="男方" onSubmit={handleAnalyze1} loading={analyzing1} analyzed={!!result1} person={person1} />
            <DualInput label="女方" onSubmit={handleAnalyze2} loading={analyzing2} analyzed={!!result2} person={person2} />
          </div>

          {result1 && result2 && !loading && (
            <div className="text-center">
              <Button size="lg" onClick={handleCompat}>开始合盘分析</Button>
            </div>
          )}
        </>
      )}

      {loading && (
        <Card><Loading size={40} text="正在合盘分析中，请稍候..." /></Card>
      )}

      {result && (
        <>
          <CompatScore result={result} />
          {report && <CompatReport reportMarkdown={report} aiInsight={aiInsight} aiLoading={aiLoading} aiError={aiError} />}
          {result1 && result2 && (
            <Card title="双方八字详情">
              <div className="grid grid-cols-2 gap-6">
                <BaziChart bazi={result1.bazi} person={result1.person} />
                <BaziChart bazi={result2.bazi} person={result2.person} />
              </div>
            </Card>
          )}
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={handleReset}>重新合盘</Button>
            <Button variant="secondary" onClick={() => window.print()}>打印报告</Button>
          </div>

          {result1 && result2 && (() => {
            const ctx1 = `八字：${result1.bazi.year.stem}${result1.bazi.year.branch} ${result1.bazi.month.stem}${result1.bazi.month.branch} ${result1.bazi.day.stem}${result1.bazi.day.branch} ${result1.bazi.hour.stem}${result1.bazi.hour.branch}，日主${result1.bazi.dayMaster}（${result1.bazi.dayMasterElement}），${result1.bodyStrength || ''}，格局${result1.geJu || ''}`
            const ctx2 = `八字：${result2.bazi.year.stem}${result2.bazi.year.branch} ${result2.bazi.month.stem}${result2.bazi.month.branch} ${result2.bazi.day.stem}${result2.bazi.day.branch} ${result2.bazi.hour.stem}${result2.bazi.hour.branch}，日主${result2.bazi.dayMaster}（${result2.bazi.dayMasterElement}），${result2.bodyStrength || ''}，格局${result2.geJu || ''}`
            const scoresCtx = result ? `总分${result.scores.total}，吸引力${result.scores.attraction}，稳定性${result.scores.stability}，互补性${result.scores.complement}` : ''
            return (
              <ChatPanel
                mode="合盘问答"
                systemPrompt={buildCompatQASystemPrompt(ctx1, ctx2, scoresCtx)}
                suggestions={[
                  '我们两人适合结婚吗？',
                  '一起创业投资前景如何？',
                  '财运方面是谁旺谁？',
                  '两人性格怎么磨合更好？',
                  '需要特别注意什么矛盾？',
                  '何时结婚或要孩子比较好？',
                ]}
              />
            )
          })()}
        </>
      )}
    </div>
  )
}
