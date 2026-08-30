import { useCallback, useEffect, useRef, useState } from 'react'
import { BaziInput } from '../bazi/BaziInput'
import { AiInsightCard } from '../bazi/BaziReport'
import { Button } from '../../components/ui/Button'
import { ToolHeader } from '../../components/layout/ToolHeader'
import { Download, Printer, RefreshCw } from '../../components/ui/Icon'
import { analyzeSixiang, type SixiangResult } from '../../utils/sixiang'
import { generateSixiangInsight } from '../../utils/ai'
import { exportRenshiDocx } from '../../utils/docxExport'
import {
  saveRenshiRecord, getRenshiRecords, getRenshiRecordById,
  updateRenshiAi, deleteRenshiRecord, type RenshiRecord,
} from '../../utils/db'
import type { PersonInfo } from '../../types'
import { RenshiReport } from './RenshiReport'

interface Analysis {
  result: SixiangResult
  person: PersonInfo
  id?: string
}

function RecordList({ records, showRecords, onToggle, onLoad, onDelete }: {
  records: RenshiRecord[]
  showRecords: boolean
  onToggle: () => void
  onLoad: (r: RenshiRecord) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--dai-qing)' }}>识人记录</h3>
        <button className="fold-trigger" onClick={onToggle}>
          {showRecords ? '收起' : `展开 (${records.length})`}
        </button>
      </div>
      {showRecords && (
        <div className="ds-card" style={{ padding: '4px 0' }}>
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

export function RenshiPage() {
  const [records, setRecords] = useState<RenshiRecord[]>([])
  const [showRecords, setShowRecords] = useState(true)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [exporting, setExporting] = useState(false)
  // AI 请求序号：切换视图/加载历史时作废在途请求，防止旧结果污染当前视图
  const aiSeqRef = useRef(0)

  const loadRecords = useCallback(() => {
    getRenshiRecords().then(setRecords).catch(() => setRecords([]))
  }, [])

  useEffect(() => { loadRecords() }, [loadRecords])

  const fetchAi = useCallback(async (result: SixiangResult, person: PersonInfo, id?: string) => {
    const seq = ++aiSeqRef.current
    setAiLoading(true)
    setAiError('')
    try {
      const info = `${person.name}（${person.gender}，${person.birthYear}-${person.birthMonth}-${person.birthDay} ${person.birthHour}:${String(person.birthMinute).padStart(2, '0')}，${person.birthPlace}）`
      const text = await generateSixiangInsight(result, info)
      if (seq !== aiSeqRef.current) return
      setAiText(text)
      if (id) await updateRenshiAi(id, text).catch(() => {})
    } catch (e) {
      if (seq !== aiSeqRef.current) return
      setAiError(e instanceof Error ? e.message : 'AI 解读失败，请稍后重试')
    } finally {
      if (seq === aiSeqRef.current) setAiLoading(false)
    }
  }, [])

  const handleAnalyze = useCallback(async (person: PersonInfo) => {
    const result = analyzeSixiang(person)
    let id: string | undefined
    try {
      id = await saveRenshiRecord(person, result)
    } catch {
      id = undefined
    }
    setAiText('')
    setAiError('')
    setAnalysis({ result, person, id })
    loadRecords()
    window.scrollTo({ top: 0, behavior: 'auto' })
    fetchAi(result, person, id)
  }, [fetchAi, loadRecords])

  const handleLoadRecord = useCallback(async (r: RenshiRecord) => {
    aiSeqRef.current++
    let result: SixiangResult | null = r.resultData ?? null
    if (!result) {
      try { result = analyzeSixiang(r.person) } catch { result = null }
    }
    if (!result) return
    const fresh = r.id ? await getRenshiRecordById(r.id).catch(() => null) : null
    setAiText(fresh?.aiInsight ?? r.aiInsight ?? '')
    setAiError('')
    setAnalysis({ result, person: r.person, id: r.id })
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const handleDeleteRecord = useCallback(async (id: string) => {
    await deleteRenshiRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleReset = useCallback(() => {
    aiSeqRef.current++
    setAnalysis(null)
    setAiText('')
    setAiError('')
    loadRecords()
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [loadRecords])

  const handleExport = useCallback(async () => {
    if (!analysis) return
    setExporting(true)
    try {
      await exportRenshiDocx(analysis.result, aiText, analysis.person)
    } finally {
      setExporting(false)
    }
  }, [analysis, aiText])

  const handleRetryAi = useCallback(() => {
    if (analysis) fetchAi(analysis.result, analysis.person, analysis.id)
  }, [analysis, fetchAi])

  const p = analysis?.person

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ToolHeader
        eyebrow="SIXIANG READING"
        title="四象三垣胎息 · 识人术"
        desc="以《三命通会》纳音取象、《兰台妙选》胎息古法为骨：四柱纳音观人生四段，尊卑生克观阶段衔接，三垣观先天禀赋，胎息元神对标人生终点。"
      />

      {!analysis && (
        <>
          <BaziInput onSubmit={handleAnalyze} submitLabel="开始识人" />
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

      {analysis && p && (
        <>
          <div className="person-info-strip">
            <span className="person-info-name">{p.name || '命主'}</span>
            <span className="person-info-sep">|</span>
            <span>{p.gender}</span>
            <span className="person-info-sep">|</span>
            <span>{p.birthYear}-{String(p.birthMonth).padStart(2, '0')}-{String(p.birthDay).padStart(2, '0')} {String(p.birthHour).padStart(2, '0')}:{String(p.birthMinute).padStart(2, '0')}</span>
            <span className="person-info-sep">|</span>
            <span>{p.birthPlace}</span>
          </div>

          <RenshiReport r={analysis.result} />

          <AiInsightCard insight={aiText} loading={aiLoading} error={aiError} />
          {aiError && !aiLoading && (
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" onClick={handleRetryAi}>
                <RefreshCw size={13} style={{ marginRight: 6 }} />重试解读
              </Button>
            </div>
          )}

          <div className="actions">
            <Button variant="secondary" onClick={handleReset}>重新识人</Button>
            <Button variant="primary" loading={exporting} onClick={handleExport}>
              <Download size={14} style={{ marginRight: 4 }} />导出 Word 报告
            </Button>
            <Button variant="ghost" onClick={() => window.print()}>
              <Printer size={14} style={{ marginRight: 4 }} />打印 / 存 PDF
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
