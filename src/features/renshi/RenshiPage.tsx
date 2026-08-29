import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ToolHeader } from '../../components/layout/ToolHeader'
import { DateTimePicker } from '../../components/form/DateTimePicker'
import { History, User, Printer, Download, Sparkles, RefreshCw, Compass } from '../../components/ui/Icon'
import { analyzeSixiang } from '../../utils/sixiang'
import { generateSixiangInsight } from '../../utils/ai'
import { exportRenshiDocx } from '../../utils/docxExport'
import { getAllRecordsMerged, type SavedRecord } from '../../utils/db'
import { RenshiReport } from './RenshiReport'

export function RenshiPage() {
  const [records, setRecords] = useState<SavedRecord[]>([])
  const [recordId, setRecordId] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'男' | '女'>('男')
  const [year, setYear] = useState<number | ''>('')
  const [month, setMonth] = useState<number | ''>('')
  const [day, setDay] = useState<number | ''>('')
  const [hour, setHour] = useState<number | ''>('')
  const [minute, setMinute] = useState<number | ''>(0)
  const [longitude, setLongitude] = useState<number>(120)
  const [longitudeText, setLongitudeText] = useState('120')

  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const aiKeyRef = useRef('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getAllRecordsMerged().then(setRecords).catch(() => setRecords([]))
  }, [])

  const handleLoadRecord = useCallback((id: string) => {
    setRecordId(id)
    const r = records.find((x) => x.id === id)
    if (!r) return
    setName(r.person.name ?? r.label ?? '')
    setGender(r.person.gender)
    setYear(r.person.birthYear)
    setMonth(r.person.birthMonth)
    setDay(r.person.birthDay)
    setHour(r.person.birthHour)
    setMinute(r.person.birthMinute ?? 0)
    if (r.person.longitude) {
      setLongitude(r.person.longitude)
      setLongitudeText(String(r.person.longitude))
    }
  }, [records])

  const handleLongitudeChange = useCallback((v: string) => {
    setLongitudeText(v)
    const n = Number(v)
    if (Number.isFinite(n) && n > 0 && n < 180) setLongitude(n)
  }, [])

  const person = useMemo(() => ({
    name: name || '未命名',
    gender,
    birthYear: typeof year === 'number' ? year : 0,
    birthMonth: typeof month === 'number' ? month : 0,
    birthDay: typeof day === 'number' ? day : 0,
    birthHour: typeof hour === 'number' ? hour : 0,
    birthMinute: typeof minute === 'number' ? minute : 0,
    birthPlace: `经度${longitude}°E`,
    longitude,
  }), [name, gender, year, month, day, hour, minute, longitude])

  const ready = year !== '' && month !== '' && day !== '' && hour !== '' && person.birthYear > 1900

  const result = useMemo(() => {
    if (!ready) return null
    try {
      return analyzeSixiang(person)
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, year, month, day, hour, minute, gender, longitude])

  const resultKey = useMemo(() => (result ? `${person.birthYear}-${person.birthMonth}-${person.birthDay}-${person.birthHour}-${person.birthMinute}-${gender}-${longitude}` : ''), [result, person, gender])

  const fetchAi = useCallback(async () => {
    if (!result) return
    setAiLoading(true)
    setAiError('')
    try {
      const text = await generateSixiangInsight(result, `${person.name}（${person.gender}，${person.birthYear}-${person.birthMonth}-${person.birthDay} ${person.birthHour}:${String(person.birthMinute).padStart(2, '0')}）`)
      setAiText(text)
      aiKeyRef.current = resultKey
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI 解读失败，请稍后重试')
    } finally {
      setAiLoading(false)
    }
  }, [result, resultKey, person])

  const handleExport = useCallback(async () => {
    if (!result) return
    setExporting(true)
    try {
      await exportRenshiDocx(result, aiText, person)
    } finally {
      setExporting(false)
    }
  }, [result, aiText, person])

  return (
    <div>
      <ToolHeader
        eyebrow="SIXIANG READING"
        title="四象三垣胎息 · 识人术"
        desc="以《三命通会》纳音取象、《兰台妙选》胎息古法为骨：四柱纳音观人生四段，尊卑生克观阶段衔接，三垣观先天禀赋，胎息元神对标人生终点。"
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
        {/* 左：输入 */}
        <div className="ds-card">
          <h2 className="ds-card-head"><User size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />命主信息</h2>
          <div className="flex flex-col gap-4">
            <div>
              <span className="ds-label"><History size={11} style={{ marginRight: 3, verticalAlign: -1 }} />选择档案</span>
              <div className="ds-select-wrap" style={{ marginTop: 4 }}>
                <select className="ds-select" value={recordId} onChange={(e) => handleLoadRecord(e.target.value)}>
                  <option value="">— 从八字排盘记录中选择 —</option>
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} · {r.person.gender}{r.person.birthYear}年{r.person.birthMonth}月{r.person.birthDay}日
                    </option>
                  ))}
                </select>
                <span className="ds-select-arrow" aria-hidden="true" />
              </div>
              {records.length === 0 && (
                <p className="text-xs mt-1.5" style={{ color: 'rgba(0,77,77,0.5)' }}>
                  暂无历史档案，可先在「八字排盘」页排盘生成，或直接填写下方信息。
                </p>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--dan-mo)', paddingTop: 14 }}>
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="ds-label">姓名（选填）</span>
                  <input className="ds-field" style={{ marginTop: 4 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="留空则为「未命名」" />
                </div>
                <div>
                  <span className="ds-label">性别</span>
                  <div className="ds-segmented" style={{ marginTop: 4 }}>
                    <button className={gender === '男' ? 'active' : ''} onClick={() => setGender('男')}>男</button>
                    <button className={gender === '女' ? 'active' : ''} onClick={() => setGender('女')}>女</button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <DateTimePicker
                  label="出生日期与时间"
                  year={year} month={month} day={day} hour={hour} minute={minute}
                  onYearChange={setYear} onMonthChange={setMonth} onDayChange={setDay}
                  onHourChange={setHour} onMinuteChange={setMinute}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <span className="ds-label">出生地经度（真太阳时校准）</span>
                <input
                  className="ds-field" style={{ marginTop: 4 }} type="number" step="0.1" min="73" max="136"
                  value={longitudeText}
                  onChange={(e) => handleLongitudeChange(e.target.value)}
                  placeholder="如 120（东经120°，不用校准）"
                />
                <p className="text-xs mt-1" style={{ color: 'rgba(0,77,77,0.5)' }}>
                  北京 116.4 · 上海 121.5 · 枣庄 117.3 · 乌鲁木齐 87.6
                </p>
              </div>
            </div>

            {result && (
              <button className="ds-btn ds-btn-primary" onClick={fetchAi} disabled={aiLoading} style={{ width: '100%' }}>
                {aiLoading ? (<><RefreshCw size={14} className="animate-spin" style={{ marginRight: 6 }} />判官落笔中…</>)
                  : (<><Sparkles size={14} style={{ marginRight: 6 }} />{aiText ? '重新解读' : '御笔判官 · 深度识人解读'}</>)}
              </button>
            )}
          </div>
        </div>

        {/* 右：报告 */}
        <div className="flex flex-col gap-5 rs-print-area">
          {result ? (
            <>
              <RenshiReport r={result} />

              {aiLoading && (
                <div className="ds-card rs-ai-card">
                  <div className="rs-ai-loading">
                    <Sparkles size={20} style={{ color: 'var(--hu-po-jin-dark)', marginBottom: 10 }} />
                    <p className="text-sm" style={{ color: 'rgba(0,77,77,0.6)' }}>判官观象取画中……</p>
                  </div>
                </div>
              )}
              {aiError && !aiLoading && (
                <div className="ds-card rs-ai-card">
                  <p className="text-sm" style={{ color: 'var(--zhu-sha)' }}>{aiError}</p>
                  <button className="ds-btn ds-btn-primary" style={{ marginTop: 10 }} onClick={fetchAi}>重试</button>
                </div>
              )}
              {aiText && !aiLoading && (
                <div className="ds-card rs-ai-card rs-ai-result">
                  <h2 className="ds-card-head"><Sparkles size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />御笔判官 · 识人解读</h2>
                  <div className="rs-ai-md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiText}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* 导出 */}
              <div className="rs-export no-print">
                <button className="ds-btn ds-btn-primary" onClick={handleExport} disabled={exporting}>
                  <Download size={14} style={{ marginRight: 6 }} />{exporting ? '生成 Word 中…' : '导出 Word 报告'}
                </button>
                <button className="ds-btn" onClick={() => window.print()}>
                  <Printer size={14} style={{ marginRight: 6 }} />打印 / 存 PDF
                </button>
              </div>
            </>
          ) : (
            <div className="ds-card flex items-center justify-center" style={{ minHeight: 260 }}>
              <div className="text-center">
                <Compass size={30} strokeWidth={1.3} style={{ color: 'rgba(0,77,77,0.3)', marginBottom: 10 }} />
                <p className="text-sm" style={{ color: 'rgba(0,77,77,0.5)' }}>选择档案或填写出生时间，四象三垣胎息将在此展开</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
