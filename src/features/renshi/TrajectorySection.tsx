/**
 * 人生轨迹板块（识人页内独立区域）
 *
 * 与上方"人品性格"报告显示隔离：只谈节奏、引动与年龄窗口，不评人品。
 * 数据全部来自 trajectory 引擎（代码为辅），AI 解读为独立输出流（页面注入 props）。
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, BookOpen, Compass, Feather, Quote, RefreshCw, Sparkles, Star, User } from '../../components/ui/Icon'
import { AiInsightCard } from '../bazi/BaziReport'
import { Button } from '../../components/ui/Button'
import type { PersonInfo } from '../../types'
import type { SixiangResult } from '../../utils/sixiang'
import { buildLiunianTracks, type DayunTrack, type LiunianTrack, type TrajectoryResult } from '../../utils/trajectory'
import type { Fact as RelationFact } from '../../utils/relation'

function factTone(f: RelationFact): string {
  if (f.kind === '六合' || f.kind === '三合' || f.kind === '半合' || f.kind === '双合') return 'ds-chip-gold'
  if (f.weight >= 7) return 'ds-chip-xiong'
  return 'ds-chip-zhong'
}

/** 关系事实列表（同纳音恒象等披露文案由 desc 自带） */
function FactList({ facts, max }: { facts: RelationFact[]; max?: number }) {
  if (!facts || facts.length === 0) {
    return <p className="tj-none">与原局四柱、三垣均无显著干支作用——这一层底色安静，不因岁运起伏而撕扯。</p>
  }
  const shown = max ? facts.slice(0, max) : facts
  return (
    <ul className="tj-facts">
      {shown.map((f, i) => (
        <li key={`${f.kind}-${f.targets.join(',')}-${i}`} className="tj-fact">
          <span className={`ds-chip ${factTone(f)}`} style={{ flexShrink: 0 }}>{f.kind}</span>
          <span className="tj-fact-text">{f.desc}</span>
        </li>
      ))}
      {max && facts.length > max && (
        <li className="tj-fact-more">另有 {facts.length - max} 处轻于上列的作用关系，点开本运流年可见</li>
      )}
    </ul>
  )
}

/** 限运四段卡（人格演化轴） */
function StageCardTj({ s, first }: { s: TrajectoryResult['stages'][number]; first: boolean }) {
  return (
    <div className="tj-stage">
      <div className="tj-stage-head">
        <span className="ds-chip ds-chip-gold">{s.label} · {s.stageName}</span>
        <span className="tj-stage-age">{s.ageRange}</span>
        <span className="tj-stage-years">{s.yearRange[0]}–{s.yearRange[1]}年{first ? '（约）' : ''}</span>
      </div>
      <div className="tj-stage-body">
        <div className="tj-stage-nayin">
          <span className="tj-gz font-serif">{s.ganzhi}</span>
          <span className="tj-nayin rs-gold">{s.naYin}</span>
        </div>
        <div className="tj-stage-main">
          {s.xiang && (
            <p className="tj-source font-serif">
              <Quote size={12} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--hu-po-jin-dark)' }} />
              {s.xiang}{s.xi ? `——原文喜${s.xi.replace(/^喜/, '')}` : ''}
            </p>
          )}
          <p className="tj-domain">所主：{s.palaceDomain}</p>
          {s.dayunCoverage.length > 0
            ? <p className="tj-cover">该段行运：{s.dayunCoverage.map(c => `${c.ganzhi}（${c.overlap}）`).join('、')}</p>
            : <p className="tj-cover">该段未交大运（童限），以原局年月为运程底。</p>}
        </div>
      </div>
    </div>
  )
}

/** 三垣/胎息 关系卡 */
function RelationCard({ title, ganzhi, naYin, xiang, xi, domain, facts, extra }: {
  title: string; ganzhi: string; naYin: string; xiang: string; xi: string; domain: string; facts: RelationFact[]; extra?: ReactNode
}) {
  return (
    <div className="tj-rel-card">
      <div className="tj-rel-head">
        <span className="tj-rel-title">{title}</span>
        <span className="tj-gz font-serif">{ganzhi}</span>
        <span className="tj-nayin rs-gold">{naYin}</span>
      </div>
      {xiang && <p className="tj-source font-serif">“{xiang}”{xi ? `｜${xi}` : ''}</p>}
      {domain && <p className="tj-domain">{domain}</p>}
      {extra}
      <FactList facts={facts} max={5} />
    </div>
  )
}

/** 单步大运条目（可选中） */
function DayunItem({ d, selected, onSelect }: { d: DayunTrack; selected: boolean; onSelect: () => void }) {
  const toneOf = (k?: string) => (k === '受克不吉' || k === '泄气' ? 'ds-chip-xiong' : k === '同类上吉' || k === '得地' ? 'ds-chip-ji' : 'ds-chip-gold')
  const heavy = d.facts.filter(f => f.weight >= 7).length
  return (
    <button
      type="button"
      className={`tj-dayun-node ${selected ? 'selected' : ''} ${d.isCurrent ? 'current' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="tj-dayun-age">{d.startAge}–{d.endAge}岁</span>
      <span className="tj-dayun-gz font-serif">{d.ganzhi}</span>
      <span className="tj-dayun-nayin">{d.naYin}</span>
      <span className="tj-dayun-meta">{d.stemTenGod}运 · {d.startYear}–{d.endYear}{d.isCurrent ? ' · 现行' : ''}</span>
      {(d.deDiYear || d.deDiDay) && (
        <span className="tj-dayun-chips">
          {d.deDiYear && <span className={`ds-chip ${toneOf(d.deDiYear.kind)}`}>年命·{d.deDiYear.kind}</span>}
          {d.deDiDay && <span className={`ds-chip ${toneOf(d.deDiDay.kind)}`}>日命·{d.deDiDay.kind}</span>}
        </span>
      )}
      {heavy > 0 && <span className="tj-dayun-heavy">重引动 {heavy} 处</span>}
    </button>
  )
}

/** 流年条目（选中展开全量事实） */
function LiunianCard({ y, selected, onSelect }: { y: LiunianTrack; selected: boolean; onSelect: () => void }) {
  const maxW = y.facts[0]?.weight ?? 0
  const tone = maxW >= 8 ? 'ds-chip-xiong' : maxW >= 6 ? 'ds-chip-gold' : 'ds-chip-zhong'
  return (
    <div className={`tj-ln ${selected ? 'selected' : ''} ${maxW >= 8 ? 'hot' : ''}`}>
      <button type="button" className="tj-ln-row" onClick={onSelect} aria-expanded={selected}>
        <span className="tj-ln-year">{y.year}</span>
        <span className="tj-ln-gz font-serif">{y.ganzhi}</span>
        <span className="tj-ln-age">{y.age}岁</span>
        <span className="tj-ln-sum">
          {y.facts.length === 0
            ? '平稳少引动'
            : <><span className={`ds-chip ${tone}`} style={{ marginRight: 6 }}>{y.facts[0]!.kind}</span>{y.facts.length > 1 ? `另${y.facts.length - 1}处作用，点开看` : y.facts[0]!.desc}</>}
        </span>
      </button>
      {selected && (
        <div className="tj-ln-detail">
          <p className="tj-ln-ten">流年{y.ganzhi.charAt(0)}对日主为<strong>{y.stemTenGod}</strong>{y.kongWangTaiSui ? '；太岁落日柱旬空——古法谓该年虚花少实、吉凶打折扣' : ''}。</p>
          <FactList facts={y.facts} />
        </div>
      )}
    </div>
  )
}

export interface TrajectorySectionProps {
  person: PersonInfo
  r: SixiangResult
  t: TrajectoryResult
  aiText: string
  aiLoading: boolean
  aiError: string
  onGenerate: () => void
}

export function TrajectorySection({ person, r, t, aiText, aiLoading, aiError, onGenerate }: TrajectorySectionProps) {
  const [selDy, setSelDy] = useState<number>(() => {
    const i = t.dayunTracks.findIndex(d => d.isCurrent)
    return i >= 0 ? i : 0
  })
  const [selYear, setSelYear] = useState<number | null>(null)
  useEffect(() => { setSelYear(null) }, [selDy])

  // 流年只在选中大运时构建（派生数据不落库、不进性格区）
  const liunian = useMemo<LiunianTrack[]>(() => {
    try { return buildLiunianTracks(person, r, selDy) } catch { return [] }
  }, [person, r, selDy])

  const dy = t.dayunTracks[selDy] ?? null

  return (
    <section className="tj-report" aria-label="人生轨迹">
      <div className="tj-header ds-card">
        <h2 className="ds-card-head"><Compass size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />人生轨迹 · 限运与大运流年</h2>
        <p className="tj-lead">
          与上方人品性格分析分轨：这里只读<strong>节奏与轨迹</strong>——《三命通会》限运四段（年1-16为根、月17-32为苗、日33-48为花、时49后为果）定四段主题，
          大运逐年定引动。所有干支作用由引擎按古法算出，点选任一步大运可展开该运十年逐年详情。
        </p>
        <p className="tj-qiyun">{t.qiYun.note}</p>
      </div>

      {/* 限运四段（人格演化轴） */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head"><BookOpen size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />限运四段 · 人生节奏</h2>
        <div className="tj-stages">
          {t.stages.map((s, i) => <StageCardTj key={s.label} s={s} first={i === 0} />)}
        </div>
      </div>

      {/* 三垣落地 */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head"><Star size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />三垣落地 · 禀赋嵌入轨迹</h2>
        <div className="tj-rel-grid">
          {t.yuanXiang.map(y => (
            <RelationCard
              key={y.name}
              title={`${y.name} ${y.ganzhi}`}
              ganzhi={y.ganzhi}
              naYin={y.naYin}
              xiang={y.xiang}
              xi={y.xi}
              domain={y.role}
              facts={y.facts}
              extra={y.landingHits.length > 0
                ? <ul className="tj-hits">{y.landingHits.map(h => <li key={h}>{h}</li>)}</ul>
                : undefined}
            />
          ))}
        </div>
        <p className="tj-cross-note">
          禀赋与阶段的对应（盲派规矩：三垣不与四柱论五行生克，此处只列实际干支作用）：胎元贴年柱看根基、命宫贴日柱看立身、身宫贴月与时看果实。
          {r.cross.length > 0 && ` 主引擎并置档：${r.cross.map(c => `${c.name.split('对')[0]}↔${c.name.split('对')[1]}${c.kind}`).join('；')}。`}
        </p>
      </div>

      {/* 胎息·元神（实作） */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head"><User size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />胎息 · 元神如何落在盘上</h2>
        <p className="tj-fact-note" style={{ marginTop: 0 }}>
          「受胎之日那一念先天神识」为本体系对经典胎息（日柱干合支合之柱，《三命通会》）的再创作引申，非古籍原义。此卡不再给空泛档位，直接列元神干支与原局四柱三垣的实际作用。
        </p>
        <div className="tj-rel-grid">
          <RelationCard
            title={`胎息 ${t.taiXiZhu.ganzhi}`}
            ganzhi={t.taiXiZhu.ganzhi}
            naYin={t.taiXiZhu.naYin}
            xiang={t.taiXiZhu.xiang}
            xi={t.taiXiZhu.xi}
            domain={`元神对标时柱（人生终点气质）· ${r.stages[3]!.naYin} · ${r.taiXi.duibiao.label}`}
            facts={t.taiXiZhu.facts}
            extra={r.taiXi.sameNaYinAsHour
              ? <p className="tj-domain">（注：胎息与时柱同纳音，为日时干支结构恒象，非个性化推断）</p>
              : undefined}
          />
        </div>
      </div>

      {/* 大运轴：全列可选 */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head"><Sparkles size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />大运 × 流年 · 逐步可选</h2>
        <p className="tj-fact-note" style={{ marginTop: 0 }}>
          点选任一步大运查看该运十年流年。断语口径为"术语 + 宫位事象 + 年龄区间"，古籍凡冲伏皆须合喜忌定方向——引擎只列作用，不代下吉凶。
        </p>
        <div className="tj-dayun-row" role="tablist">
          {t.dayunTracks.map(d => (
            <DayunItem key={d.index} d={d} selected={d.index === selDy} onSelect={() => setSelDy(d.index)} />
          ))}
        </div>

        {dy && (
          <div className="tj-dy-detail">
            <div className="tj-dy-head">
              <span className="tj-dy-gz font-serif">{dy.ganzhi}运</span>
              <span className="tj-dy-meta">{dy.startAge}–{dy.endAge}虚岁 · 约{dy.startYear}–{dy.endYear}年{dy.isCurrent ? ' · 现行' : ''}</span>
            </div>
            <p className="tj-dy-lines">
              {dy.stemTenGod}运，运支藏干 {dy.hiddenGods.join('、')}。
              {dy.deDiYear && `以年命论：${dy.deDiYear.desc}。`}
              {dy.deDiDay && `以日柱身命论：${dy.deDiDay.label}。`}
              日主行{dy.changSheng.stage}——{dy.changSheng.luck}。
              {dy.stemBranchForm && `运柱${dy.stemBranchForm}。`}
            </p>
            <FactList facts={dy.facts} max={6} />
          </div>
        )}

        {liunian.length > 0 && (
          <div className="tj-ln-list">
            <div className="tj-ln-title">该运十年逐年（点开看全量作用）</div>
            {liunian.map(y => (
              <LiunianCard key={y.year} y={y} selected={selYear === y.year} onSelect={() => setSelYear(selYear === y.year ? null : y.year)} />
            ))}
          </div>
        )}
      </div>

      {/* 关键节点一览 */}
      {t.keyMoments.length > 0 && (
        <div className="ds-card rs-section">
          <h2 className="ds-card-head"><AlertCircle size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />一生重引动节点（引擎按古籍权重取前 {t.keyMoments.length}）</h2>
          <ul className="tj-moments">
            {t.keyMoments.slice(0, 15).map((m, i) => (
              <li key={i} className="tj-moment"><b>{m.when}</b><span>{m.text}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* 轨迹 AI 解读（独立输出流） */}
      <div className="ds-card rs-section tj-ai">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <h2 className="ds-card-head" style={{ margin: 0 }}><Compass size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />轨迹解盘师 · 人生轨迹解读</h2>
          {!aiLoading && (
            <Button variant="ghost" size="sm" onClick={onGenerate}>
              <RefreshCw size={13} style={{ marginRight: 6 }} />{aiText ? '重新生成轨迹解读' : '生成轨迹解读'}
            </Button>
          )}
        </div>
        <p className="tj-ai-sep">此解读与上方"深度识人解读"各走独立请求：那篇评人品，这篇只解节奏与节点。未生成时上方解读不受影响。</p>
        {aiText || aiLoading || aiError
          ? <AiInsightCard insight={aiText} loading={aiLoading} error={aiError} />
          : <p className="tj-none">（尚未生成。点击右上角按钮，基于上方引擎事实撰写 1100-1600 字轨迹解读。）</p>}
      </div>

      {/* 方法论披露 */}
      <div className="ds-card rs-section rs-disclosure">
        <h2 className="ds-card-head"><Feather size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />轨迹口径说明</h2>
        <details className="rs-disclosure-details">
          <summary>展开限运分段、大运流年取法与古法为今用的说明（{t.disclosure.length} 条）</summary>
          <ul className="rs-disclosure-list">
            {t.disclosure.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </details>
      </div>
    </section>
  )
}
