import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PersonInfo } from '../../types'
import { useBazi } from '../../hooks/useBazi'
import { getAllRecords, deleteRecord, type SavedRecord } from '../../utils/db'
import {
  renderFundamentalReport,
  renderLifeStagesReport,
  renderRiskReport,
  renderCompatibilityPreview,
  renderPersonalityReport,
  renderHealthReport,
  renderAppearanceReport,
  renderIntelligenceReport,
  renderFamilyDeepReport,
  renderCareerReport,
} from '../../utils/analysis'
import { BaziInput } from './BaziInput'
import { BaziResult } from './BaziResult'
import { BaziReport, AiInsightCard } from './BaziReport'
import { BaziChat } from './BaziChat'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/Loading'

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
    await handleAnalyze(record.person)
  }, [handleAnalyze])

  const handleDeleteRecord = useCallback(async (id: string) => {
    await deleteRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleReset = useCallback(() => {
    reset()
  }, [reset])

  return (
    <div className="flex flex-col gap-8">
      {!result && !loading && (
        <>
          <Card>
            <div className="flex justify-between items-center">
              <span className="font-serif text-lg font-semibold text-[#2C2C2C]">历史记录</span>
              <Button variant="ghost" size="sm" onClick={() => setShowRecords(!showRecords)}>
                {showRecords ? '收起' : `历史 (${records.length})`}
              </Button>
            </div>
            {records.length === 0 && (
              <p className="text-sm text-[#8C8C8C] mt-4">暂无排盘记录，完成一次八字分析后会自动保存在这里。</p>
            )}
            {records.length > 0 && showRecords && (
              <div className="mt-4 flex flex-col gap-1.5">
                {records.map((r) => (
                  <div key={r.id} className="flex justify-between items-center py-2.5 px-3.5 bg-paper-50 rounded-lg">
                    <span className="text-sm font-semibold text-[#2C2C2C]">{r.label}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleLoadRecord(r)}>加载</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteRecord(r.id)}>删除</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <BaziInput onSubmit={handleAnalyze} loading={loading} />
        </>
      )}

      {loading && (
        <Card>
          <Loading size={40} text="正在排盘中，请稍候..." />
        </Card>
      )}

      {result && !loading && (
        <>
          <AiInsightCard insight={aiInsight} loading={aiLoading} error={aiError} />
          <BaziResult result={result} />
          {fullReport && <BaziReport markdown={fullReport} />}
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={handleReset}>重新排盘</Button>
            <Button variant="ghost" onClick={() => window.print()}>打印报告</Button>
          </div>
          <BaziChat result={result} />
        </>
      )}
    </div>
  )
}
