import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PersonInfo } from '../../types'
import { useBazi } from '../../hooks/useBazi'
import { getAllRecords, deleteRecord, type SavedRecord } from '../../utils/db'
import {
  renderFundamentalReport, renderLifeStagesReport, renderRiskReport, renderCompatibilityPreview,
  renderPersonalityReport, renderHealthReport, renderAppearanceReport, renderIntelligenceReport,
  renderFamilyDeepReport, renderCareerReport,
} from '../../utils/analysis'
import { BaziInput } from './BaziInput'
import { BaziResult } from './BaziResult'
import { BaziReport, AiInsightCard } from './BaziReport'
import { BaziChat } from './BaziChat'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/Loading'

function RecordList({ records, showRecords, onToggle, onLoad, onDelete }: {
  records: SavedRecord[]
  showRecords: boolean
  onToggle: () => void
  onLoad: (r: SavedRecord) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>历史记录</h3>
        <button className="fold-trigger" onClick={onToggle}>
          {showRecords ? '收起' : `展开 (${records.length})`}
        </button>
      </div>
      {showRecords && (
        <div className="card" style={{ padding: '4px 0' }}>
          {records.map((r) => (
            <div key={r.id} className="history-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="history-row-label">{r.label}</div>
                <div className="history-row-meta">
                  {r.person.gender === '男' ? '♂' : '♀'} {r.person.birthYear}年 · {r.person.birthPlace}
                </div>
              </div>
              <div className="history-row-actions">
                <Button variant="ghost" size="sm" onClick={() => onLoad(r)}>加载</Button>
                <Button variant="danger-ghost" size="sm" onClick={() => onDelete(r.id)}>删除</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BaziPage() {
  const { loading, result, aiInsight, aiLoading, aiError, analyze, fetchAiInsight, reset } = useBazi()
  const [records, setRecords] = useState<SavedRecord[]>([])
  const [showRecords, setShowRecords] = useState(true)

  useEffect(() => {
    getAllRecords().then(setRecords).catch(() => setRecords([]))
  }, [result])

  const fullReport = useMemo(() => {
    if (!result) return null
    const p = result.person
    const header = `# 命理全卷\n\n> **受判人：** ${p.name} | ${p.gender} | ${p.birthYear}年${String(p.birthMonth).padStart(2, '0')}月${String(p.birthDay).padStart(2, '0')}日 ${String(p.birthHour).padStart(2, '0')}:${String(p.birthMinute).padStart(2, '0')} | ${p.birthPlace}\n\n---\n\n`
    return (
      header +
      renderFundamentalReport(result) + '\n\n---\n\n' +
      renderPersonalityReport(result) + '\n\n---\n\n' +
      renderHealthReport(result) + '\n\n---\n\n' +
      renderAppearanceReport(result) + '\n\n---\n\n' +
      renderIntelligenceReport(result) + '\n\n---\n\n' +
      renderFamilyDeepReport(result) + '\n\n---\n\n' +
      renderCareerReport(result) + '\n\n---\n\n' +
      renderLifeStagesReport(result) + '\n\n---\n\n' +
      renderRiskReport(result) + '\n\n---\n\n' +
      renderCompatibilityPreview(result)
    )
  }, [result])

  const handleAnalyze = useCallback(async (person: PersonInfo) => {
    const res = await analyze(person)
    const reportText = renderFundamentalReport(res)
    fetchAiInsight(reportText, person)
  }, [analyze, fetchAiInsight])

  const handleLoadRecord = useCallback(async (record: SavedRecord) => {
    setShowRecords(false)
    // Skip AI regeneration — just run local analysis
    await analyze(record.person)
  }, [analyze])

  const handleDeleteRecord = useCallback(async (id: string) => {
    await deleteRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleReset = useCallback(() => { reset() }, [reset])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {!result && !loading && (
        <>
          <BaziInput onSubmit={handleAnalyze} loading={loading} />
          {records.length > 0 && (
            <RecordList
              records={records}
              showRecords={showRecords}
              onToggle={() => setShowRecords(!showRecords)}
              onLoad={handleLoadRecord}
              onDelete={handleDeleteRecord}
            />
          )}
        </>
      )}

      {loading && (
        <Loading text="正在排盘中，请稍候..." />
      )}

      {result && !loading && (
        <>
          <AiInsightCard insight={aiInsight} loading={aiLoading} error={aiError} />
          <BaziResult result={result} />
          {fullReport && <BaziReport markdown={fullReport} />}
          <div className="actions">
            <Button variant="secondary" onClick={handleReset}>重新排盘</Button>
            <Button variant="ghost" onClick={() => window.print()}>打印报告</Button>
          </div>
          <BaziChat result={result} />
        </>
      )}
    </div>
  )
}
