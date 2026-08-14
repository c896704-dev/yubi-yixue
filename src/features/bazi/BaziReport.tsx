import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '../../components/ui/Card'
import { ChevronDown, Orbit, User, Compass, Sparkles, Users, Heart, TrendingUp, Shield, Star } from '../../components/ui/Icon'
import { Loading } from '../../components/ui/Loading'
import type { AnalysisResult } from '../../types'
import type { ReportSection, PillarTableData, LiuNianItem } from '../../utils/analysis'
import { buildPillarTableData, buildFortuneYears } from '../../utils/analysis'
import { STEM_ELEMENT } from '../../constants'
import type { FiveElement, HeavenlyStem } from '../../constants'

interface BaziReportProps {
  markdown?: string
  sections?: ReportSection[]
  result?: AnalysisResult | null
  /** 运程长卷章节内嵌的时间轴组件（可选） */
  fortuneTimeline?: React.ReactNode
}

/** 五行配色（对齐 design-showcase 古籍美学：木苍翠/火朱砂/土琥珀/金淡金/水黛青） */
const ELEM_COLORS: Record<FiveElement, string> = {
  '木': '#2d6a4f',
  '火': '#9c3d54',
  '土': '#b8960f',
  '金': '#8a8072',
  '水': '#006666',
}

/** 章节图标（按 id 映射 lucide 图标，替换旧 emoji） */
const SECTION_ICONS: Record<string, React.ReactNode> = {
  fundamental: <Orbit size={15} />,
  personality: <Sparkles size={15} />,
  career: <Compass size={15} />,
  intelligence: <Star size={15} />,
  family: <Users size={15} />,
  health: <Heart size={15} />,
  lifestages: <TrendingUp size={15} />,
  risk: <Shield size={15} />,
  appearance: <User size={15} />,
}

/** 折叠章节卡片：桌面默认按 defaultOpen，打印时强制展开 */
function ReportSectionCard({ section, result, index, children }: {
  section: ReportSection
  result: AnalysisResult
  index: number
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(section.defaultOpen)
  const md = section.render(result)

  return (
    <div className="report-section" id={`section-${section.id}`}>
      <button
        className="report-section-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="report-section-num">{section.num}</span>
        <span className="report-section-icon">{SECTION_ICONS[section.id] || section.icon}</span>
        <span className="report-section-title">{section.title}</span>
        <span className={`report-section-toggle ${open ? 'open' : ''}`}><ChevronDown size={14} /></span>
      </button>
      {open && (
        <div className="report-section-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          {children}
        </div>
      )}
    </div>
  )
}

/** 五行能量可视化条形图 */
export function ElementBars({ result }: { result: AnalysisResult }) {
  const dist = result.fiveElementDistribution
  const maxVal = Math.max(...Object.values(dist), 1)
  return (
    <div className="element-bars">
      {(['木', '火', '土', '金', '水'] as const).map((el) => {
        const val = dist[el] || 0
        const pct = Math.max(4, Math.round((val / maxVal) * 100))
        const isFav = result.favorableElements.includes(el)
        const isUnfav = result.unfavorableElements.includes(el)
        return (
          <div key={el} className="element-bar-row">
            <span className="element-bar-label" style={{ color: ELEM_COLORS[el] }}>{el}</span>
            <div className="element-bar-track">
              <div className="element-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${ELEM_COLORS[el]}cc, ${ELEM_COLORS[el]})` }} />
            </div>
            <span className="element-bar-value">{val.toFixed(1)}</span>
            <span className={`element-bar-tag ${isFav ? 'fav' : isUnfav ? 'unfav' : ''}`}>
              {isFav ? '喜' : isUnfav ? '忌' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** 命盘基础信息纵向大表：字段为行、四柱为列 */
export function PillarTable({ result }: { result: AnalysisResult }) {
  const data: PillarTableData = buildPillarTableData(result)

  // 神煞 pill 配色
  const shenShaColor = (type: string) =>
    type === '吉' ? 'ss-ji' : type === '凶' ? 'ss-xiong' : 'ss-zhong'

  return (
    <div className="pillar-table-wrap">
      <table className="pillar-table">
        <thead>
          <tr>
            <th className="pt-field-col">命盘</th>
            {data.columns.map(c => (
              <th key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>{c.pillarLabel}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 主星 */}
          <tr>
            <td className="pt-field-label">主星</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                <span className="pt-mainstar">{c.mainStar}</span>
              </td>
            ))}
          </tr>
          {/* 天干（大字号核心视觉） */}
          <tr>
            <td className="pt-field-label">天干</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                <span className="pt-ganzhi" style={{ color: ELEM_COLORS[STEM_ELEMENT_OF(c.stem)] }}>{c.stem}</span>
              </td>
            ))}
          </tr>
          {/* 地支 */}
          <tr>
            <td className="pt-field-label">地支</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                <span className="pt-ganzhi">{c.branch}</span>
              </td>
            ))}
          </tr>
          {/* 藏干 */}
          <tr>
            <td className="pt-field-label">藏干</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                <div className="pt-chip-row">
                  {c.hiddenStems.map((hs, i) => (
                    <span key={i} className="pt-chip" style={{ background: `${ELEM_COLORS[STEM_ELEMENT_OF(hs)]}1a`, color: ELEM_COLORS[STEM_ELEMENT_OF(hs)] }}>{hs}</span>
                  ))}
                </div>
              </td>
            ))}
          </tr>
          {/* 副星 */}
          <tr>
            <td className="pt-field-label">副星</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                <div className="pt-chip-row">
                  {c.subStars.map((s, i) => (
                    <span key={i} className="pt-chip pt-chip-plain">{s.stem}·{s.god}</span>
                  ))}
                </div>
              </td>
            ))}
          </tr>
          {/* 星运 */}
          <tr>
            <td className="pt-field-label">星运</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                <span className="pt-text">{c.xingYun}</span>
              </td>
            ))}
          </tr>
          {/* 自坐 */}
          <tr>
            <td className="pt-field-label">自坐</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                <span className="pt-text">{c.ziZuo}</span>
              </td>
            ))}
          </tr>
          {/* 空亡 */}
          <tr>
            <td className="pt-field-label">空亡</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                {c.isKongWang ? <span className="pt-kongwang">空</span> : <span className="pt-muted">—</span>}
              </td>
            ))}
          </tr>
          {/* 纳音 */}
          <tr>
            <td className="pt-field-label">纳音</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                <span className="pt-text">{c.naYin}</span>
              </td>
            ))}
          </tr>
          {/* 神煞 */}
          <tr>
            <td className="pt-field-label">神煞</td>
            {data.columns.map(c => (
              <td key={c.pillarKey} className={c.pillarKey === '日柱' ? 'pt-day-col' : ''}>
                {c.shenSha.length > 0 ? (
                  <div className="pt-shensha-cell">
                    {c.shenSha.map((s, i) => (
                      <span key={i} className={`pt-chip ss-pill ${shenShaColor(s.type)}`}>{s.name}</span>
                    ))}
                  </div>
                ) : (
                  <span className="pt-muted">—</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {/* 旬空说明 + 全局神煞 */}
      <div className="pt-footnote">
        <span>旬空：{data.kongWangBranches.join('、')}</span>
        {data.globalShenSha.length > 0 && (
          <span className="pt-global">
            全局神煞：{data.globalShenSha.map(s => s.name).join('、')}
          </span>
        )}
      </div>
    </div>
  )
}

/** 从 HeavenlyStem 取五行（PillarTable 内部用） */
function STEM_ELEMENT_OF(stem: string): FiveElement {
  return (STEM_ELEMENT as Record<string, FiveElement>)[stem] || '土'
}

/** 神煞徽章网格（乾坤定盘内的神煞一览，替代平铺表格） */
export function ShenShaGrid({ result }: { result: AnalysisResult }) {
  const all = result.shenSha.all
  if (all.length === 0) return <p className="pt-muted">命局无明显神煞配置。</p>
  return (
    <div className="ss-grid">
      {all.map((s, i) => (
        <span key={i} className={`ss-pill ${s.type === '吉' ? 'ss-ji' : s.type === '凶' ? 'ss-xiong' : 'ss-zhong'}`} title={`${s.pillar} · ${s.description}`}>
          {s.name}
          <em className="ss-pillar-tag">{s.pillar}</em>
        </span>
      ))}
    </div>
  )
}

/** 用神四维徽章卡 */
export function YongShenBadges({ result }: { result: AnalysisResult }) {
  const ys = result.yongShen
  const items = [
    { label: '扶抑用神', value: ys.fuYi.join('、') || '无' },
    { label: '调候用神', value: `${ys.tiaoHou.join('、')}${ys.tiaoHouStems.length > 0 ? `（天干：${ys.tiaoHouStems.join('、')}）` : ''}` || '无' },
    { label: '通关用神', value: ys.tongGuan.join('、') || '无' },
    { label: '病药用神', value: ys.bingYao.join('、') || '无' },
  ]
  return (
    <div className="ys-badges">
      {items.map(it => (
        <div key={it.label} className="ys-badge">
          <span className="ys-label">{it.label}</span>
          <span className="ys-value">{it.value}</span>
        </div>
      ))}
    </div>
  )
}

/** 大运流年两级时间轴：点大运展开流年、点流年显示逐年分析 */
export function FortuneTimelineV2({ result }: { result: AnalysisResult }) {
  const fortunes = result.bigFortunes || []
  const current = result.currentFortune
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    () => current ? fortunes.findIndex(f => f.startAge === current.startAge) : null,
  )
  const [selectedYear, setSelectedYear] = useState<LiuNianItem | null>(null)
  const currentYear = new Date().getFullYear()

  if (fortunes.length === 0) return null

  // 当前大运的流年
  const currentYears: LiuNianItem[] = buildFortuneYears(result)
  // 展开大运的流年（仅当前大运有流年数据）
  const selectedFortune = expandedIndex !== null ? fortunes[expandedIndex] : null
  const showYears = selectedFortune && current && selectedFortune.startAge === current.startAge

  return (
    <div className="ft2">
      {/* 第一级：大运节点 */}
      <div className="ft2-days">
        {fortunes.map((f, i) => {
          const isCurrent = current && f.startAge === current.startAge
          const isExpanded = expandedIndex === i
          const isFav = result.favorableElements.includes(f.element)
          const isUnfav = result.unfavorableElements.includes(f.element)
          return (
            <button
              key={i}
              className={`ft2-day-node ${isCurrent ? 'current' : ''} ${isExpanded ? 'expanded' : ''} ${isFav ? 'fav' : isUnfav ? 'unfav' : ''}`}
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
              title={`${f.stem}${f.branch} ${f.tenGod}运`}
            >
              <span className="ft2-age">{f.startAge}-{f.endAge}</span>
              <span className="ft2-ganzhi">{f.stem}{f.branch}</span>
              <span className="ft2-tenGod">{f.tenGod}</span>
            </button>
          )
        })}
      </div>

      {/* 第二级：当前大运的流年微时间轴 */}
      {showYears && currentYears.length > 0 && (
        <div className="ft2-years">
          <div className="ft2-years-label">流年</div>
          <div className="ft2-year-nodes">
            {currentYears.map(y => {
              const isNow = y.year === currentYear
              return (
                <button
                  key={y.year}
                  className={`ft2-year-node luck-${y.luck} ${isNow ? 'now' : ''} ${selectedYear?.year === y.year ? 'selected' : ''}`}
                  onClick={() => setSelectedYear(selectedYear?.year === y.year ? null : y)}
                  title={`${y.year}年 ${y.ganZhi}`}
                >
                  <span className="ft2-year-dot" />
                  <span className="ft2-year-text">{y.year}</span>
                </button>
              )
            })}
          </div>

          {/* 流年分析卡 */}
          {selectedYear && (
            <div className={`ft2-year-card luck-${selectedYear.luck}`}>
              <div className="ft2-year-card-head">
                <span className="ft2-year-ganzhi">{selectedYear.ganZhi}</span>
                <span className="ft2-year-meta">{selectedYear.year}年 · {selectedYear.age}岁</span>
                <span className={`ft2-year-badge luck-${selectedYear.luck}`}>
                  {selectedYear.luck === '吉' ? '吉' : selectedYear.luck === '凶' ? '凶' : '平'}
                </span>
              </div>
              <div className="ft2-year-body">
                <span className="ft2-year-tenGod">{selectedYear.tenGod}</span>
                <span className="ft2-year-note">{selectedYear.note}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 展开大运的分析卡（非当前大运只显示大运简述） */}
      {selectedFortune && !showYears && (
        <div className="ft2-fortune-card">
          <span className="ft2-ganzhi">{selectedFortune.stem}{selectedFortune.branch}</span>
          <span className="ft2-tenGod">{selectedFortune.tenGod}运</span>
          <span className="ft2-nayin">{selectedFortune.naYin}</span>
        </div>
      )}
    </div>
  )
}

export function BaziReport({ markdown, sections, result, fortuneTimeline }: BaziReportProps) {
  // 新式：sections 驱动（含折叠/目录），旧式 markdown 兜底
  if (sections && result) {
    return (
      <Card title="深度分析报告">
        <div className="report">
          {/* 目录导航 */}
          <nav className="report-toc" aria-label="报告目录">
            {sections.map((s) => (
              <a key={s.id} href={`#section-${s.id}`} className="report-toc-item">
                <span className="report-toc-num">{s.num}</span>
                <span className="report-toc-icon">{s.icon}</span>
                <span>{s.title}</span>
              </a>
            ))}
          </nav>

          {sections.map((s, i) => (
            <ReportSectionCard key={s.id} section={s} result={result} index={i}>
              {/* 运程长卷章节内嵌大运流年时间轴 */}
              {s.id === 'lifestages' && fortuneTimeline}
            </ReportSectionCard>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card title="深度分析报告">
      <div className="report">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </Card>
  )
}

interface AiInsightCardProps {
  insight: string | null
  loading?: boolean
  error?: string | null
}

export function AiInsightCard({ insight, loading, error }: AiInsightCardProps) {
  return (
    <div className="ai-insight">
      <h3 className="ai-insight-title">AI 总评</h3>
      {loading && <Loading text="AI 正在分析中..." />}
      {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
      {insight && (
        <div className="report">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{insight}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
