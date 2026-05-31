import { useState, useCallback, useEffect, useRef } from 'react'
import type { PersonInfo, AnalysisResult } from '../../types'
import { analyzePerson } from '../../utils/analysis'
import { renderEnhancedCompatibilityReport } from '../../utils/compatibility'
import { useCompat } from '../../hooks/useBazi'
import { getAllRecordsMerged, type SavedRecord, saveCompatRecord, getAllCompatRecords, deleteCompatRecord, type CompatRecord } from '../../utils/db'
import { buildCompatQASystemPrompt } from '../../utils/ai'
import { deleteServerCompatRecord, getServerCompatRecords, saveServerCompatRecord } from '../../services/compatApi'
import { ChatPanel } from '../../components/ui/ChatPanel'
import { DualInput } from './DualInput'
import { CompatScore } from './CompatScore'
import { CompatReport } from './CompatReport'
import { BaziChart } from '../../components/viz/BaziChart'
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
  const { loading, result, aiInsight, aiLoading, aiError, analyze: runCompat, fetchAiInsight, reset, restoreAiInsight } = useCompat()
  const [report, setReport] = useState<string | null>(null)
  const [records, setRecords] = useState<SavedRecord[]>([])
  const [compatRecords, setCompatRecords] = useState<CompatRecord[]>([])
  const [showCompatHistory, setShowCompatHistory] = useState(true)
  const pendingAiRef = useRef<string | null>(null)

  // 从历史记录恢复 AI 报告
  useEffect(() => {
    if (pendingAiRef.current && result && !loading) {
      restoreAiInsight(pendingAiRef.current)
      pendingAiRef.current = null
    }
  }, [result, loading, restoreAiInsight])

  const refreshCompatRecords = useCallback(async () => {
    const hasToken = !!localStorage.getItem('auth_token')
    // 登录后只从服务端取（服务端负责权限隔离）
    const localRecords = hasToken ? [] : await getAllCompatRecords()
    let serverRecords: CompatRecord[] = []
    try {
      const res = await getServerCompatRecords()
      serverRecords = res.records.map((r: any) => ({
        id: r.id, malePerson: r.maleData, femalePerson: r.femaleData,
        result: r.resultData as CompatRecord['result'], aiInsight: r.aiInsight,
        label: r.label, createdAt: new Date(r.createdAt).getTime(),
      }))
    } catch { serverRecords = [] }
    const merged = new Map<string, CompatRecord>()
    for (const record of [...serverRecords, ...localRecords]) merged.set(record.id, record)
    setCompatRecords([...merged.values()].sort((a, b) => b.createdAt - a.createdAt))
  }, [])

  const authTokenCompat = localStorage.getItem('auth_token')
  useEffect(() => {
    getAllRecordsMerged().then(setRecords).catch(() => setRecords([]));
    refreshCompatRecords()
  }, [refreshCompatRecords, authTokenCompat])

  // Track the compat record that's waiting for AI insight
  const pendingRecordRef = useRef<CompatRecord | null>(null)

  useEffect(() => {
    if (aiInsight && pendingRecordRef.current) {
      const rec = pendingRecordRef.current
      pendingRecordRef.current = null
      // Patch the record with AI insight
      saveCompatRecord({ ...rec, aiInsight }).then(refreshCompatRecords)
      if (localStorage.getItem('auth_token')) {
        saveServerCompatRecord({ id: rec.id, maleData: rec.malePerson, femaleData: rec.femalePerson, resultData: rec.result, aiInsight, label: rec.label }).catch(() => {})
      }
    }
  }, [aiInsight, refreshCompatRecords])

  const handleAnalyze1 = useCallback(async (person: PersonInfo) => { setPerson1(person); setAnalyzing1(true); setResult1(analyzePerson(person)); setAnalyzing1(false) }, [])
  const handleAnalyze2 = useCallback(async (person: PersonInfo) => { setPerson2(person); setAnalyzing2(true); setResult2(analyzePerson(person)); setAnalyzing2(false) }, [])

  const handleCompat = useCallback(async () => {
    if (!result1 || !result2) return
    const compatResult = await runCompat(result1, result2)
    setReport(renderEnhancedCompatibilityReport(compatResult))
    setHasRunCompat(true)
    fetchAiInsight(result1, result2)
    const label = `${person1!.name} & ${person2!.name} · 合盘`
    const record: CompatRecord = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), malePerson: person1!, femalePerson: person2!, result: compatResult, aiInsight: null, label, createdAt: Date.now() }
    pendingRecordRef.current = record
    saveCompatRecord(record).then(refreshCompatRecords)
    if (localStorage.getItem('auth_token')) { saveServerCompatRecord({ id: record.id, maleData: record.malePerson, femaleData: record.femalePerson, resultData: record.result, aiInsight: null, label: record.label }).catch(() => {}) }
  }, [result1, result2, person1, person2, runCompat, fetchAiInsight, refreshCompatRecords])

  const handleLoadCompatRecord = useCallback(async (record: CompatRecord) => {
    const male = record.result?.male || analyzePerson(record.malePerson)
    const female = record.result?.female || analyzePerson(record.femalePerson)
    setPerson1(record.malePerson); setPerson2(record.femalePerson); setResult1(male); setResult2(female)
    pendingAiRef.current = record.aiInsight || null
    const compatResult = await runCompat(male, female)
    setReport(renderEnhancedCompatibilityReport(compatResult))
    setHasRunCompat(true); setShowCompatHistory(false)
  }, [runCompat])

  const handleDeleteCompatRecord = useCallback(async (id: string) => {
    await deleteCompatRecord(id)
    if (localStorage.getItem('auth_token')) await deleteServerCompatRecord(id).catch(() => {})
    refreshCompatRecords()
  }, [refreshCompatRecords])

  const handleReset = useCallback(() => {
    setPerson1(null); setPerson2(null); setResult1(null); setResult2(null); setReport(null); setHasRunCompat(false); reset()
  }, [reset])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {!hasRunCompat && (
        <>
          {/* Dual input with inline profile picker */}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
            <DualInput label="男方" records={records} onSubmit={handleAnalyze1} loading={analyzing1} analyzed={!!result1} person={person1} />
            <DualInput label="女方" records={records} onSubmit={handleAnalyze2} loading={analyzing2} analyzed={!!result2} person={person2} />
          </div>

          {result1 && result2 && !loading && (
            <div style={{ textAlign: 'center' }}>
              <Button size="lg" onClick={handleCompat}>开始合盘分析</Button>
            </div>
          )}
        </>
      )}

      {loading && <Loading text="正在合盘分析中，请稍候..." />}

      {result && (
        <>
          <CompatScore result={result} />
          {report && <CompatReport reportMarkdown={report} aiInsight={aiInsight} aiLoading={aiLoading} aiError={aiError} />}

          {result1 && result2 && (
            <div className="section">
              <h3 className="section-title">双方八字详情</h3>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
                <div className="card"><BaziChart bazi={result1.bazi} person={result1.person} /></div>
                <div className="card"><BaziChart bazi={result2.bazi} person={result2.person} /></div>
              </div>
            </div>
          )}

          <div className="actions">
            <Button variant="secondary" onClick={handleReset}>重新合盘</Button>
            <Button variant="ghost" onClick={() => window.print()}>打印报告</Button>
          </div>

          {result1 && result2 && (() => {
            const ctx1 = `八字：${result1.bazi.year.stem}${result1.bazi.year.branch} ${result1.bazi.month.stem}${result1.bazi.month.branch} ${result1.bazi.day.stem}${result1.bazi.day.branch} ${result1.bazi.hour.stem}${result1.bazi.hour.branch}，日主${result1.bazi.dayMaster}（${result1.bazi.dayMasterElement}），${result1.bodyStrength || ''}，格局${result1.geJu || ''}`
            const ctx2 = `八字：${result2.bazi.year.stem}${result2.bazi.year.branch} ${result2.bazi.month.stem}${result2.bazi.month.branch} ${result2.bazi.day.stem}${result2.bazi.day.branch} ${result2.bazi.hour.stem}${result2.bazi.hour.branch}，日主${result2.bazi.dayMaster}（${result2.bazi.dayMasterElement}），${result2.bodyStrength || ''}，格局${result2.geJu || ''}`
            const scoresCtx = result ? `总分${result.scores.total}，吸引力${result.scores.attraction}，稳定性${result.scores.stability}，互补性${result.scores.complement}` : ''
            return <ChatPanel mode="合盘问答" systemPrompt={buildCompatQASystemPrompt(ctx1, ctx2, scoresCtx)} suggestions={['我们两人适合结婚吗？', '一起创业投资前景如何？', '财运方面是谁旺谁？', '两人性格怎么磨合更好？', '需要特别注意什么矛盾？', '何时结婚或要孩子比较好？']} />
          })()}
        </>
      )}

      {/* History — always visible */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>合盘历史</h3>
          {compatRecords.length > 0 && (
            <button className="fold-trigger" onClick={() => setShowCompatHistory(!showCompatHistory)}>
              {showCompatHistory ? '收起' : `展开 (${compatRecords.length})`}
            </button>
          )}
        </div>
        {showCompatHistory && compatRecords.length > 0 && (
          <div className="card" style={{ padding: '4px 0', maxHeight: 280, overflowY: 'auto' }}>
            {compatRecords.map((cr) => (
              <div key={cr.id} className="history-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="history-row-label">{cr.label}</div>
                  <div className="history-row-meta">{new Date(cr.createdAt).toLocaleDateString('zh-CN')}</div>
                </div>
                <div className="history-row-actions">
                  <Button variant="ghost" size="sm" onClick={() => handleLoadCompatRecord(cr)}>查看</Button>
                  <Button variant="danger-ghost" size="sm" onClick={() => handleDeleteCompatRecord(cr.id)}>删除</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {showCompatHistory && compatRecords.length === 0 && (
          <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', padding: '8px 0' }}>
            完成合盘分析后，记录将自动保存在此。
          </p>
        )}
      </div>
    </div>
  )
}
