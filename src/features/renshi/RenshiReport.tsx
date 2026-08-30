import { AlertCircle, BookOpen, Compass, Feather, Quote, Sparkles, Star, User } from '../../components/ui/Icon'
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
      <h2 className="ds-card-head"><Sparkles size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />提取八项信息</h2>
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
      {s.continuation && <p className="rs-continuation">{s.continuation}</p>}
      <p className="rs-stage-source font-serif">
        <Quote size={12} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--hu-po-jin-dark)' }} />
        {s.xiang.source}
      </p>
      <p className="rs-stage-image">{s.xiang.image}。{s.stageDesc}。</p>
      <div className="flex flex-wrap gap-1.5">
        {s.xiang.traits.map((t) => (
          <span key={t} className="ds-chip ds-chip-zhong">{t}</span>
        ))}
        {s.shadow.map((t) => (
          <span key={t} className="ds-chip ds-chip-xiong">{t}</span>
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

/** 晚子时换日口径对照（F-1：口径披露 + 双盘） */
function AltChartBanner({ r }: { r: SixiangResult }) {
  if (!r.altChart) return null
  const a = r.altChart
  return (
    <div className="ds-card rs-section rs-alt-banner">
      <h2 className="ds-card-head">
        <AlertCircle size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />换日口径披露 · 晚子时出生
        {a.flipped && <span className="ds-chip ds-chip-xiong" style={{ marginLeft: 'auto' }}>两口径结论存在实质翻转</span>}
      </h2>
      <p className="rs-alt-desc">
        本命出生于晚子时（23:00–24:00 真太阳时段）。本报告采用<strong>「子初换日」口径</strong>（23:00 起日柱进位为次日，即当前展示的盘）；另一主流「夜子时派」口径（日柱取当天）在学界同样有据。两种口径下关键结论
        {a.flipped ? '会发生实质变化，请对照阅读、自行取舍' : '一致，可放心阅读'}：
      </p>
      <details className="rs-alt-details">
        <summary>展开另一口径对照（{a.dayGZ} 盘）</summary>
        <div className="rs-alt-grid">
          <div className="rs-alt-col">
            <span className="rs-board-label">口径A · 子初换日（本报告）</span>
            <span className="rs-alt-item">日柱 <b className="font-serif">{r.stages[2]!.ganzhi}</b>（{r.stages[2]!.naYin}）</span>
            <span className="rs-alt-item">胎息 <b className="font-serif">{r.taiXi.ganzhi}</b>（{r.taiXi.naYin}）</span>
            <span className="rs-alt-item">卑克尊 {r.hasFanShang ? '有' : '无'}</span>
          </div>
          <div className="rs-alt-col">
            <span className="rs-board-label">口径B · 夜子时派（日柱当天）</span>
            <span className="rs-alt-item">日柱 <b className="font-serif">{a.dayGZ}</b>（{a.dayNaYin}）</span>
            <span className="rs-alt-item">胎息 <b className="font-serif">{a.taiXiGZ}</b>（{a.taiXiNaYin}）</span>
            <span className="rs-alt-item">卑克尊 {a.hasFanShang ? '有' : '无'}</span>
          </div>
        </div>
        <p className="rs-alt-desc" style={{ marginTop: 8 }}>胎元、命宫、身宫两口径相同；四柱其余柱不变。</p>
      </details>
    </div>
  )
}

/** 干支事实层（F-3：刑冲空亡明五行，与纳音层并置） */
function GanZhiFacts({ r }: { r: SixiangResult }) {
  const g = r.ganZhi
  return (
    <div className="ds-card rs-section">
      <h2 className="ds-card-head"><Feather size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />干支事实层 · 刑冲空亡与五行</h2>
      <div className="rs-facts">
        <div className="rs-fact-row">
          <span className="rs-fact-label">刑冲害</span>
          <span className="rs-fact-value">{g.xingchong.length > 0 ? g.xingchong.join('；') : '无'}</span>
        </div>
        {g.heJu.length > 0 && (
          <div className="rs-fact-row">
            <span className="rs-fact-label">合会缓和</span>
            <span className="rs-fact-value">{g.heJu.join('；')}</span>
          </div>
        )}
        <div className="rs-fact-row">
          <span className="rs-fact-label">旬空</span>
          <span className="rs-fact-value">
            {g.kongWang.branches.join('、')}{g.kongWang.byYear ? `（年柱口径 ${g.kongWang.byYear.join('、')}）` : ''}
            {g.kongWang.fallingInto.length > 0
              ? <>——<strong style={{ color: 'var(--zhu-sha)' }}>{g.kongWang.fallingInto.join('、')}落空</strong>（传统谓落空之力难以尽发，须引动方用）</>
              : '——四柱与胎元未落空'}
          </span>
        </div>
        <div className="rs-fact-row">
          <span className="rs-fact-label">明干五行</span>
          <span className="rs-fact-value">
            {Object.entries(g.wuxing).map(([k, v]) => `${k}${v}`).join(' ')}
            {g.missing.length > 0 && <>——<strong style={{ color: 'var(--zhu-sha)' }}>明缺{g.missing.join('、')}</strong>（仅纳音层有之）</>}
          </span>
        </div>
      </div>
      <p className="rs-fact-note">以上为干支层基本事实，与纳音取象层并行不悖；本报告总评已将两层并置陈述。</p>
    </div>
  )
}

/** 运程参照（F-6：大运 + 流年） */
function DayunSection({ r }: { r: SixiangResult }) {
  const d = r.dayun
  return (
    <div className="ds-card rs-section">
      <h2 className="ds-card-head"><Compass size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />运程参照 · 大运与流年</h2>
      <p className="rs-fact-note" style={{ marginTop: 0 }}>
        四柱是静态底盘，人生阶段的起伏由大运流年驱动——四段断言须结合现行运程阅读。
        {d.qiYunAge != null && `本命起运虚岁 ${d.qiYunAge}。`}
      </p>
      <div className="rs-dayun-list">
        {d.list.map((f) => (
          <span key={f.startAge} className={`ds-chip ${f.current ? 'ds-chip-ji' : 'ds-chip-zhong'}`}>
            {f.ganzhi} <b className="font-serif" style={{ fontSize: 11 }}>{f.startAge}–{f.endAge}岁</b>{f.current ? ' · 现行' : ''}
          </span>
        ))}
      </div>
      <p className="rs-fact-value" style={{ marginTop: 10 }}>
        当前流年 <b className="font-serif">{d.liunian.year}</b>（{d.liunian.ganzhi}）：{d.liunian.note}。
        {d.current && `现行 ${d.current.ganzhi}（${d.current.naYin}）大运。`}
      </p>
    </div>
  )
}

/** 方法论披露 + 免责声明（F-11 / F-9） */
function DisclosureFooter({ r }: { r: SixiangResult }) {
  return (
    <div className="ds-card rs-section rs-disclosure">
      <h2 className="ds-card-head"><Feather size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />方法论说明</h2>
      <ul className="rs-disclosure-list">
        {r.disclosure.map((d, i) => <li key={i}>{d}</li>)}
      </ul>
      <p className="rs-disclaimer">
        本报告基于传统命理文化的取象类比，属文化视角的人格倾向参考，非科学测评；所有描述均为倾向性推断而非确定性结论，请以审慎态度阅读。
        {r.minor && ' 命主尚未成年，全部内容仅为倾向参考，建议由监护人陪同理解，切勿以报告定性孩子。'}
      </p>
    </div>
  )
}

export function RenshiReport({ r }: { r: SixiangResult }) {
  return (
    <div className="rs-report">
      <AltChartBanner r={r} />
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

      {/* 干支事实层 */}
      <GanZhiFacts r={r} />

      {/* 三垣 */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head">
          <Star size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />三垣 · 胎元命宫身宫
          <span className={`ds-chip ${r.sanyuan.lianZhu === '三垣连珠' ? 'ds-chip-ji' : r.sanyuan.lianZhu === '三垣交战' ? 'ds-chip-xiong' : 'ds-chip-zhong'}`} style={{ marginLeft: 'auto' }}>
            {r.sanyuan.lianZhu}
          </span>
        </h2>
        <p className="rs-sanyuan-desc">{r.sanyuan.desc}</p>
        <p className="rs-fact-note">{r.sanyuan.pairs.map(p => p.desc).join('；')}</p>
        <div className="rs-yuan-grid">
          <YuanCard y={r.sanyuan.taiYuan} />
          <YuanCard y={r.sanyuan.mingGong} />
          <YuanCard y={r.sanyuan.shenGong} />
        </div>
      </div>

      {/* 胎息元神 */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head"><User size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />胎息 · 元神画像</h2>
        <p className="rs-fact-note" style={{ marginTop: 0 }}>
          「受胎之日那一念先天神识」为本体系对经典胎息（日柱干合支合之柱，《三命通会》）的再创作引申，非古籍原义。
        </p>
        <div className="rs-taixi">
          <div className="rs-taixi-head">
            <span className="rs-taixi-gz font-serif">{r.taiXi.ganzhi}</span>
            <span className="rs-taixi-nayin rs-gold">{r.taiXi.naYin}</span>
            <span className="ds-chip ds-chip-gold">对标时柱 · {r.stages[3]!.naYin}</span>
            <span className={`ds-chip ${r.taiXi.duibiao.kind === '卑克尊' ? 'ds-chip-xiong' : 'ds-chip-ji'}`}>{r.taiXi.duibiao.label}</span>
          </div>
          <p className="rs-taixi-yuanshen font-serif">“{r.taiXi.xiang.yuanshen}”</p>
          <p className="rs-taixi-desc">
            {r.taiXi.duibiao.desc}
            {r.taiXi.sameNaYinAsHour && '（另注：胎息与时柱同纳音，此为日柱与时柱干支结构的恒象，非个性化推断。）'}
          </p>
        </div>
      </div>

      {/* 四象对三垣 */}
      <div className="ds-card rs-section">
        <h2 className="ds-card-head"><Sparkles size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />四象对三垣 · 禀赋兼容</h2>
        <div className="rs-cross-list">
          {r.cross.map((c) => <CrossRow key={c.name} c={c} />)}
        </div>
      </div>

      {/* 运程参照 */}
      <DayunSection r={r} />

      {/* 方法论披露 */}
      <DisclosureFooter r={r} />
    </div>
  )
}
