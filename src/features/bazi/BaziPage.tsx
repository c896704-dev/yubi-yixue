import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { PersonInfo } from '../../types'
import { useBazi } from '../../hooks/useBazi'
import { getAllRecordsMerged, deleteRecord, getRecordById, type SavedRecord } from '../../utils/db'
import {
  renderFundamentalReport, renderLifeStagesReport,
  buildReportSections,
} from '../../utils/analysis'
import { BaziInput } from './BaziInput'
import { BaziResult } from './BaziResult'
import {
  BaziReport, AiInsightCard, ElementBars, PillarTable,
  ShenShaGrid, YongShenBadges, FortuneTimelineV2,
} from './BaziReport'
import { BaziChat } from './BaziChat'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ToolHeader } from '../../components/layout/ToolHeader'
import { Orbit } from '../../components/ui/Icon'
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
        <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--dai-qing)' }}>历史记录</h3>
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

export default function BaziPage() {
  const { loading, result, aiInsight, aiLoading, aiError, analyze, fetchAiInsight, reset, restoreAiInsight } = useBazi()
  const [records, setRecords] = useState<SavedRecord[]>([])
  const [showRecords, setShowRecords] = useState(true)
  const pendingAiRef = useRef<string | null>(null)

  // 从历史记录恢复 AI 报告（等 analyze 完成、loading 结束、aiInsight 被清空后再恢复）
  useEffect(() => {
    if (pendingAiRef.current && result && !loading) {
      restoreAiInsight(pendingAiRef.current)
      pendingAiRef.current = null
    }
  }, [result, loading, restoreAiInsight])

  // 登录/登出时重新加载记录列表
  const authToken = localStorage.getItem('auth_token')

  useEffect(() => {
    getAllRecordsMerged().then(setRecords).catch(() => setRecords([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, aiInsight, authToken])

  const reportSections = useMemo(() => buildReportSections(), [])

  const handleAnalyze = useCallback(async (person: PersonInfo) => {
    const res = await analyze(person)
    // AI 输入精简为"定盘 + 运程"两章，避免 AI 复述与正文重复
    const reportText = renderFundamentalReport(res) + '\n\n---\n\n' + renderLifeStagesReport(res)
    fetchAiInsight(reportText, person)
  }, [analyze, fetchAiInsight])

  const handleLoadRecord = useCallback(async (record: SavedRecord) => {
    setShowRecords(false)
    // 先把 AI 存到 ref 里（analyze 会清空 aiInsight）
    const fresh = record.id ? await getRecordById(record.id) : null
    pendingAiRef.current = fresh?.aiInsight || record.aiInsight || null
    await analyze(record.person)
    // 从历史记录进入报告时，必须回到页面顶部（此前会停留在历史列表中上部）
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [analyze])

  const handleDeleteRecord = useCallback(async (id: string) => {
    await deleteRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleReset = useCallback(() => { reset() }, [reset])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ToolHeader
        eyebrow="BAZI CHART"
        title="八字排盘"
        desc="输入出生信息，四柱排盘、十神分析、大运流年、神煞与古籍溯源解读一应俱全。"
      />
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
          {/* 紧凑信息条（受判人基本信息） */}
          <div className="person-info-strip">
            <span className="person-info-name">{result.person.name || '命主'}</span>
            <span className="person-info-sep">|</span>
            <span>{result.person.gender}</span>
            <span className="person-info-sep">|</span>
            <span>{result.person.birthYear}-{String(result.person.birthMonth).padStart(2, '0')}-{String(result.person.birthDay).padStart(2, '0')} {String(result.person.birthHour).padStart(2, '0')}:{String(result.person.birthMinute).padStart(2, '0')}</span>
            <span className="person-info-sep">|</span>
            <span>{result.person.birthPlace}</span>
          </div>

          {/* 命盘基础信息：字段为行、四柱为列的纵向大表 */}
          <Card title="命盘基础信息">
            <PillarTable result={result} />
          </Card>

          {/* 身强弱 + 格局大卡（基础信息正下方） */}
          <BaziResult result={result} />

          {/* 一、乾坤定盘（文字部分 + 五行能量条形图 + 神煞/用神徽章） */}
          {reportSections[0] && (
            <div className="report-section" id="section-fundamental">
              <div className="report-section-header">
                <span className="report-section-num">一</span>
                <span className="report-section-icon"><Orbit size={15} /></span>
                <span className="report-section-title">乾坤定盘</span>
              </div>
              <div className="report-section-body">
                <div className="report">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {reportSections[0].render(result)}
                  </ReactMarkdown>
                </div>
                <ElementBars result={result} />
                <h4 className="comp-subtitle">用神体系</h4>
                <YongShenBadges result={result} />
                <h4 className="comp-subtitle">神煞一览</h4>
                <ShenShaGrid result={result} />
              </div>
            </div>
          )}
          {/* AI 总评（紧随定盘之后） */}
          <AiInsightCard insight={aiInsight} loading={aiLoading} error={aiError} />
          {/* 深度报告（内部从一编号）+ 附录A；运程长卷内嵌时间轴 */}
          <BaziReport
            sections={reportSections.slice(1)}
            result={result}
            fortuneTimeline={<FortuneTimelineV2 result={result} />}
          />
          <div className="actions">
            <Button variant="secondary" onClick={handleReset}>重新排盘</Button>
            <Button variant="ghost" onClick={() => window.print()}>打印报告</Button>
          </div>
          {/* 浮动 AI 解惑助手（fixed 定位，脱离文档流） */}
          <BaziChat result={result} />
        </>
      )}
    </div>
  )
}
