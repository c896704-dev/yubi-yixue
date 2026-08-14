import { useEffect, useMemo, useRef, useState } from 'react'
import { Solar } from 'lunar-typescript'
import {
  Calendar, ChevronRight, Compass, Coins, Mountain, Orbit, Quote, Sparkles, Star, Users,
} from '../ui/Icon'
import { Reveal } from './Reveal'
import type { AppTab } from '../../context/NavContext'

interface HomeLandingProps {
  onNavigate: (tab: AppTab) => void
}

/* ── Hero 打字机文案 ── */
const TYPING_LINES = [
  '古籍锚定，可溯源 · 可验证',
  '宣纸为底，黛青为骨，琥珀为金',
  '以古籍为骨 · 以 AI 为笔 · 以数据为墨',
  '每一句解读，皆有古籍为证',
]

const GLYPHS = [
  { char: '乾', left: 8, top: 16, size: 2 }, { char: '坤', left: 91, top: 12, size: 1.6 },
  { char: '震', left: 12, top: 48, size: 2 }, { char: '巽', left: 82, top: 72, size: 1.7 },
  { char: '坎', left: 20, top: 90, size: 1.6 }, { char: '离', left: 70, top: 8, size: 2.2 },
  { char: '艮', left: 48, top: 88, size: 1.7 }, { char: '兑', left: 94, top: 50, size: 1.9 },
]

const MARQUEE_QUOTES = [
  { text: '天行健，君子以自强不息', src: '《周易·乾卦》' },
  { text: '地势坤，君子以厚德载物', src: '《周易·坤卦》' },
  { text: '积善之家，必有余庆', src: '《周易·文言》' },
  { text: '穷则变，变则通，通则久', src: '《周易·系辞》' },
  { text: '一阴一阳之谓道', src: '《周易·系辞》' },
  { text: '形而上者谓之道，形而下者谓之器', src: '《周易·系辞》' },
]

interface Feature {
  key: AppTab
  title: string
  en: string
  desc: string
  tag: string
  accent: string
  Icon: React.ComponentType<{ size?: number }>
}

const FEATURES: Feature[] = [
  {
    key: 'bazi', title: '八字排盘', en: 'BAZI CHART', accent: '#004d4d',
    desc: '四柱八字免费排盘，十神分析、大运流年、用神取法、神煞详解，AI 解读引经据典。', tag: '免费',
    Icon: Compass,
  },
  {
    key: 'compat', title: '双人合盘', en: 'COMPATIBILITY', accent: '#9c3d54',
    desc: '两命相合，五行生克、十神呼应、缘分深浅一窥便知，AI 合参给出相处之道。', tag: '合参',
    Icon: Users,
  },
  {
    key: 'fengshui', title: '风水分析', en: 'FENG SHUI', accent: '#2d6a4f',
    desc: '户型图、楼盘位置 · 环境吉凶分析，理气格局逐一剖解，附化解建议。', tag: '宅吉',
    Icon: Mountain,
  },
  {
    key: 'divination', title: '算卦', en: 'DIVINATION', accent: '#b8960f',
    desc: '六爻摇卦、梅花易数，64 卦多维断语库，AI 解卦引《增删卜易》。', tag: '含梅花',
    Icon: Coins,
  },
  {
    key: 'almanac', title: '万年历', en: 'ALMANAC', accent: '#006666',
    desc: '农历、干支、节气、宜忌、五行日主，每日吉凶通览，高留存入口。', tag: '高留存',
    Icon: Calendar,
  },
  {
    key: 'shensha', title: '神煞速查', en: 'SHENSHA REF', accent: '#d4af37',
    desc: '天乙文昌、桃花驿马、空亡孤辰……神煞词典速查，命盘神煞逐柱尽览。', tag: '速查',
    Icon: Star,
  },
]

/* ── 每日时令（实时计算） ── */
function useDailyAlmanac() {
  return useMemo(() => {
    const now = new Date()
    const solar = Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate())
    const lunar = solar.getLunar()
    return {
      lunarDate: lunar.toString().replace('农历', ''),
      yearGanZhi: lunar.getYearInGanZhi(),
      monthGanZhi: lunar.getMonthInGanZhi(),
      dayGanZhi: lunar.getDayInGanZhi(),
      shengXiao: lunar.getYearShengXiao(),
      jieQi: lunar.getJieQi(),
      yi: lunar.getDayYi().slice(0, 6),
      ji: lunar.getDayJi().slice(0, 4),
      dayMaster: lunar.getDayGan() + '日主',
      week: ['日', '一', '二', '三', '四', '五', '六'][now.getDay()],
    }
  }, [])
}

/* ── Hero 打字机 ── */
function useTyping(lines: string[]) {
  const [text, setText] = useState('')
  const [lineIdx, setLineIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = lines[lineIdx % lines.length]
    let delay = deleting ? 34 : 68
    if (!deleting && text === current) delay = 2600
    else if (deleting && text === '') delay = 300
    const t = setTimeout(() => {
      if (!deleting && text === current) {
        setDeleting(true)
      } else if (deleting && text === '') {
        setDeleting(false)
        setLineIdx((i) => (i + 1) % lines.length)
      } else {
        setText(current.slice(0, text.length + (deleting ? -1 : 1)))
      }
    }, delay)
    return () => clearTimeout(t)
  }, [text, deleting, lineIdx, lines])

  return text
}

/* ── Hero ── */
function Hero({ onNavigate }: HomeLandingProps) {
  const typed = useTyping(TYPING_LINES)
  return (
    <section className="land-hero">
      <div className="land-hero-blob1" />
      <div className="land-hero-blob2" />
      {GLYPHS.map((g, i) => (
        <span
          key={g.char}
          className="land-glyph"
          style={{
            left: `${g.left}%`,
            top: `${g.top}%`,
            fontSize: `${g.size}rem`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${6 + i * 0.5}s`,
          }}
        >
          {g.char}
        </span>
      ))}

      <div className="land-hero-inner">
        <Reveal delay={80}>
          <h1 className="land-hero-h1">
            <span className="gold-foil-text">御笔易学</span>
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <p className="land-hero-sub">以古籍为骨 · 以 AI 为笔 · 以数据为墨</p>
        </Reveal>
        <Reveal delay={280}>
          <div className="land-hero-typing">
            <span>{typed}</span>
            <span className="caret" />
          </div>
        </Reveal>
        <Reveal delay={380}>
          <div className="land-cta-row">
            <button className="land-cta-primary" onClick={() => onNavigate('bazi')}>
              <Sparkles size={16} />
              立即排盘
              <span className="btn-sheen-layer" aria-hidden="true"><span /></span>
            </button>
            <button
              className="land-cta-secondary"
              onClick={() => document.getElementById('land-features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Orbit size={16} />
              了解更多
            </button>
          </div>
        </Reveal>
        <Reveal delay={480}>
          <div className="land-stats">
            {[
              { num: '6', label: '术数体系' },
              { num: '1494', label: '断语条目' },
              { num: '64×18', label: '卦象维度' },
            ].map((s) => (
              <div key={s.label} className="land-stat">
                <div className="land-stat-num">{s.num}</div>
                <div className="land-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── 每日时令卡 ── */
function DailyAlmanac() {
  const d = useDailyAlmanac()
  return (
    <section className="site-section" id="land-daily">
      <div className="site-container">
        <Reveal>
          <div className="sec-head">
            <div className="sec-eyebrow">DAILY ALMANAC</div>
            <h2 className="sec-title">每日时令</h2>
            <p className="sec-desc">当日干支、节气、宜忌与五行日主，零成本高留存的每日入口。</p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="land-daily-card ink-border spotlight-card">
            <div className="daily-grid">
              <div className="daily-left">
                <div className="daily-lunar">农历{d.lunarDate}</div>
                <div className="daily-lunar-sub">周{d.week} · {d.jieQi ? `节气：${d.jieQi}` : '无节气'}</div>
                <div className="daily-kv" style={{ marginTop: 14 }}>
                  <div className="daily-kv-row">
                    <span className="daily-kv-label">干支</span>
                    <span className="daily-kv-value">{d.yearGanZhi}年 {d.monthGanZhi}月 {d.dayGanZhi}日</span>
                  </div>
                  <div className="daily-kv-row">
                    <span className="daily-kv-label">生肖</span>
                    <span className="daily-kv-value">{d.shengXiao}</span>
                  </div>
                  <div className="daily-kv-row">
                    <span className="daily-kv-label">日主</span>
                    <span className="daily-kv-value">{d.dayMaster} · 五行日主</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="daily-kv">
                  <div className="daily-kv-row">
                    <span className="daily-kv-label">宜</span>
                    <span className="flex flex-wrap gap-2">
                      {d.yi.map((y) => (
                        <span key={y} className="ds-chip ds-chip-ji">{y}</span>
                      ))}
                    </span>
                  </div>
                  <div className="daily-kv-row">
                    <span className="daily-kv-label">忌</span>
                    <span className="flex flex-wrap gap-2">
                      {d.ji.map((j) => (
                        <span key={j} className="ds-chip ds-chip-xiong">{j}</span>
                      ))}
                    </span>
                  </div>
                </div>
                <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--dan-mo)' }}>
                  <button
                    className="ds-btn ds-btn-secondary ds-btn-sm"
                    onClick={() => document.getElementById('land-daily')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    查看万年历
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── 特性区 ── */
function Features({ onNavigate }: HomeLandingProps) {
  return (
    <section className="site-section" id="land-features" style={{ background: 'var(--xuan-zhi-dark)' }}>
      <div className="site-container">
        <Reveal>
          <div className="sec-head">
            <div className="sec-eyebrow">FEATURE MATRIX</div>
            <h2 className="sec-title">六术合参 · 一站尽览</h2>
            <p className="sec-desc">从四柱到合盘，从六爻到时令，覆盖命理古籍全谱。所有排盘免费，御笔悉数补齐。</p>
          </div>
        </Reveal>
        <div className="land-features">
          {FEATURES.map((f, i) => (
            <Reveal key={f.key} delay={i * 80}>
              <button className="feat-card ink-border spotlight-card" onClick={() => onNavigate(f.key)}>
                <div className="feat-top">
                  <span className="feat-icon" style={{ background: `${f.accent}14`, color: f.accent }}>
                    <f.Icon size={22} />
                  </span>
                  <span className="feat-tag" style={{ background: `${f.accent}14`, color: f.accent }}>{f.tag}</span>
                </div>
                <div className="feat-en">{f.en}</div>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-desc">{f.desc}</p>
                <span className="feat-link">
                  进入
                  <ChevronRight size={14} />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 金句跑马灯 ── */
function MarqueeBand() {
  const doubled = [...MARQUEE_QUOTES, ...MARQUEE_QUOTES]
  return (
    <section className="land-marquee">
      <div className="mq-mask">
        <div className="mq-track">
          {doubled.map((q, i) => (
            <div key={i} className="mq-item">
              <Quote size={16} style={{ color: 'var(--hu-po-jin)', flexShrink: 0 }} />
              <span className="mq-text">{q.text}</span>
              <span className="mq-src">— {q.src}</span>
              <span className="ink-dot" style={{ marginLeft: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── RAG 溯源示范（古籍引用范式） ── */
function RagShowcase() {
  return (
    <section className="site-section">
      <div className="site-container">
        <Reveal>
          <div className="sec-head">
            <div className="sec-eyebrow">RAG ANCHORING</div>
            <h2 className="sec-title">每一句解读 · 皆有古籍为证</h2>
            <p className="sec-desc">AI 每一句推论都引用《滴天髓》《三命通会》《增删卜易》等古籍原文，可溯源、可验证。</p>
          </div>
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal direction="left">
            <div className="ds-card h-full">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="ds-chat-avatar"><Sparkles size={14} /></span>
                <div>
                  <div className="font-serif font-bold text-dai-qing" style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--dai-qing)' }}>AI 解读</div>
                  <div className="text-xs" style={{ color: 'rgba(0,77,77,0.6)' }}>博导模式 · 引经据典</div>
                </div>
              </div>
              <div className="text-sm leading-relaxed space-y-3" style={{ color: 'var(--dai-qing)' }}>
                <p>
                  日主 <mark className="ds-mark">甲木</mark>，生于 <mark className="ds-mark">午月</mark>，
                  火旺木渴，亟需水以济之。
                </p>
                <p>
                  年支见 <mark className="ds-mark">子水</mark> 为印，然子午相冲，水气受损，格局由强转弱。
                </p>
                <p>
                  大运逆行，初走 <mark className="ds-mark">辛未</mark> <mark className="ds-mark">壬申</mark> 金水相生，
                  少年得志；中运 <mark className="ds-mark">癸酉</mark> 印星到位，学业有成。
                </p>
                <p className="text-xs" style={{ color: 'rgba(0,77,77,0.55)' }}>引用 3 部古籍 · 共 5 处锚点</p>
              </div>
            </div>
          </Reveal>
          <Reveal direction="right" delay={120}>
            <div className="flex flex-col gap-4 h-full">
              <div className="ds-quote">
                <div className="ds-quote-head">
                  <Quote size={18} style={{ color: 'var(--zhu-sha)', flexShrink: 0 }} />
                  <div>
                    <div className="ds-quote-title">《滴天髓》</div>
                    <div className="ds-quote-src">[清] 任铁樵 注 · 论木</div>
                  </div>
                </div>
                <p className="ds-quote-body">
                  甲木参天，脱胎要火；春不容金，秋不容土；<br />
                  火炽乘龙，水荡骑虎；地润天和，植立千古。
                </p>
              </div>
              <div className="ds-quote">
                <div className="ds-quote-head">
                  <Quote size={18} style={{ color: 'var(--zhu-sha)', flexShrink: 0 }} />
                  <div>
                    <div className="ds-quote-title">《三命通会》</div>
                    <div className="ds-quote-src">[明] 万民英 · 卷四</div>
                  </div>
                </div>
                <p className="ds-quote-body">
                  甲生午月，木性虚焦，必须有水滋培，<br />
                  若见子水相冲，须察其根之深浅。
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function HomeLanding({ onNavigate }: HomeLandingProps) {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <DailyAlmanac />
      <Features onNavigate={onNavigate} />
      <RagShowcase />
      <MarqueeBand />
    </>
  )
}
