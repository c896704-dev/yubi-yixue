import { BookOpen, Quote, Sparkles, Star, User } from '../../components/ui/Icon'
import type { SixiangResult, SixiangStage, YuanInfo, ZunBeiPair, CrossPair } from '../../utils/sixiang'

/** 尊卑关系徽记配色 */
const ZUN_BEI_TONE: Record<string, { chip: string; text: string }> = {
  '尊克卑': { chip: 'ds-chip-ji', text: 'var(--dai-qing)' },
  '卑生尊': { chip: 'ds-chip-gold', text: 'var(--hu-po-jin-dark)' },
  '尊生卑': { chip: 'ds-chip-gold', text: 'var(--hu-po-jin-dark)' },
  '卑克尊': { chip: 'ds-chip-xiong', text: 'var(--zhu-sha)' },
  '比和': { chip: 'ds-chip-zhong', text: 'var(--dai-qing)' },
}

function tone(kind: string) {
  return ZUN_BEI_TONE[kind] ?? ZUN_BEI_TONE['比和']!
}

/** 八信息总览盘 */
function OverviewBoard({ r }: { r: SixiangResult }) {
  return (
    <div className="rs-board ds-card">
      <h2 className="ds-card-head"><Sparkles size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />提取八信息</h2>
      <div className="rs-board-grid">
        {r.stages.map((s) => (
          <div key={s.label} className="rs-board-cell">
            <span className="rs-board-label">{s.label} · {s.stageName}</span>
            <span className="rs-board-ganzhi">{s.ganzhi}</span>
            <span className="rs-board-nayin rs-gold">{s.naYin}</span>
          </div>
        ))}
        {[r.sanyuan.taiYuan, r.sanyuan.mingGong, r.sanyuan.shenGong].map((y) => (
          <div key={y.name} className="rs-board-cell rs-board-yuan">
            <span className="rs-board-label">三垣 · {y.name}</span>
            <span className="rs-board-ganzhi">{y.ganzhi}</span>
            <span className="rs-board-nayin rs-gold">{y.naYin}</span>
          </div>
        ))}
        <div className="rs-board-cell rs-board-taixi">
          <span className="rs-board-label">胎息 · 元神</span>
          <span className="rs-board-ganzhi">{r.taiXi.ganzhi}</span>
          <span className="rs-board-nayin rs-gold">{r.taiXi.naYin}</span>
        </div>
      </div>
    </div>
  )
}

/** 四象时间轴单段 */
function StageCard({ s }: { s: SixiangStage }) {
  return (
    <div className="rs-stage">
      <div className="rs-stage-head">
        <span className="ds-chip ds-chip-gold">{s.label} · {s.stageName}</span>
        <span className="rs-stage-ganzhi font-serif">{s.ganzhi}</span>
        <span className="rs-stage-nayin rs-gold">{s.naYin}</span>
      </div>
      <p className="rs-stage-source font-serif">
        <Quote size={12} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--hu-po-jin-dark)' }} />
        {s.xiang.source}
      </p>
      <p className="rs-stage-image">{s.xiang.image}。{s.stageDesc}。</p>
      <div className="flex flex-wrap gap-1.5">
        {s.xiang.traits.map((t) => (
          <span key={t} className="ds-chip ds-chip-zhong">{t}</span>
        ))}
      </div>
    </div>
  )
}

/** 尊卑连线 */
function ZunBeiLink({ z }: { z: ZunBeiPair }) {
  const t = tone(z.kind)
  return (
    <div className="rs-zunbei">
      <span className={`ds-chip ${t.chip}`}>{z.kind}</span>
      <span className="rs-zunbei-text">{z.from} → {z.to}：{z.desc}</span>
    </div>
  )
}

/** 三垣卡 */
function YuanCard({ y }: { y: YuanInfo }) {
  return (
    <div className="rs-yuan-card">
      <div className="rs-yuan-head">
        <span className="rs-yuan-name">{y.name}</span>
        <span className="rs-yuan-gz font-serif">{y.ganzhi}</span>
        <span className="rs-yuan-nayin rs-gold">{y.naYin}</span>
      </div>
      <p className="rs-yuan-role">{y.role}</p>
      <p className="rs-yuan-image">{y.xiang.image}。</p>
      <p className="rs-stage-source font-serif">“{y.xiang.source}”</p>
    </div>
  )
}

/** 四象对三垣行 */
function CrossRow({ c }: { c: CrossPair }) {
  const good = c.kind !== '相克'
  return (
    <div className="rs-cross-row">
      <span className={`ds-chip ${good ? 'ds-chip-ji' : 'ds-chip-xiong'}`} style={{ flexShrink: 0 }}>{c.kind}</span>
      <div className="min-w-0">
        <div className="rs-cross-name">{c.name}</div>
        <div className="rs-cross-desc">{c.desc}</div>
      </div>
    </div>
  )
}

export function RenshiReport({ r }: { r: SixiangResult }) {
  return (
    <div className="rs-report">
      <OverviewBoard r={r} />

      {/* 四象时间轴 */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head"><BookOpen size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />四象 · 人生四段</h2>
        <div className="rs-timeline">
          {r.stages.map((s, i) => (
            <div key={s.label} className="rs-timeline-item">
              {i > 0 && <ZunBeiLink z={r.zunBei[i - 1]!} />}
              <StageCard s={s} />
            </div>
          ))}
        </div>
        <div className={`rs-overall ${r.hasFanShang ? 'rs-overall-warn' : ''}`}>
          {r.overall}
        </div>
      </div>

      {/* 三垣 */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head">
          <Star size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />三垣 · 胎元命宫身宫
          <span className={`ds-chip ${r.sanyuan.lianZhu === '三垣连珠' ? 'ds-chip-ji' : r.sanyuan.lianZhu === '三垣交战' ? 'ds-chip-xiong' : 'ds-chip-zhong'}`} style={{ marginLeft: 'auto' }}>
            {r.sanyuan.lianZhu}
          </span>
        </h2>
        <p className="rs-sanyuan-desc">{r.sanyuan.desc}</p>
        <div className="rs-yuan-grid">
          <YuanCard y={r.sanyuan.taiYuan} />
          <YuanCard y={r.sanyuan.mingGong} />
          <YuanCard y={r.sanyuan.shenGong} />
        </div>
      </div>

      {/* 胎息元神 */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head"><User size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />胎息 · 元神画像</h2>
        <div className="rs-taixi">
          <div className="rs-taixi-head">
            <span className="rs-taixi-gz font-serif">{r.taiXi.ganzhi}</span>
            <span className="rs-taixi-nayin rs-gold">{r.taiXi.naYin}</span>
            <span className="ds-chip ds-chip-gold">对标时柱 · {r.stages[3]!.naYin}</span>
            <span className={`ds-chip ${r.taiXi.duibiao.kind === '卑克尊' ? 'ds-chip-xiong' : 'ds-chip-ji'}`}>契合度 {r.taiXi.duibiao.band}</span>
          </div>
          <p className="rs-taixi-yuanshen font-serif">“{r.taiXi.xiang.yuanshen}”</p>
          <p className="rs-taixi-desc">{r.taiXi.duibiao.desc}</p>
        </div>
      </div>

      {/* 四象对三垣 */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head"><Sparkles size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />四象对三垣 · 禀赋兼容</h2>
        <div className="rs-cross-list">
          {r.cross.map((c) => <CrossRow key={c.name} c={c} />)}
        </div>
      </div>
    </div>
  )
}
