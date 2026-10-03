import type { ComponentType, CSSProperties } from 'react'
import type { PersonInfo } from '../../types'
import type { SixiangResult } from '../../utils/sixiang'
import type { TrajectoryResult, DayunTrack } from '../../utils/trajectory'
import { buildLiunianTracks } from '../../utils/trajectory'
import type { Fact as RelationFact } from '../../utils/relation'
import type { ReportSpec } from '../../report/types'
import type { DocBlock } from '../../report/docModel'
import {
  AlertCircle, BookOpen, Compass, Feather, Sparkles, Star, User,
} from '../../components/ui/Icon'
import {
  AltChartBanner, OverviewBoard, SiXiangTimeline, GanZhiFacts, SanYuanSection, DisclosureFooter,
} from './RenshiReport'
import {
  TrajectoryHeader, LimitStages, SanYuanLanding, TaiXiLanding, DayunExplorer, KeyMoments, TrajectoryDisclosure,
} from './TrajectorySection'

export interface RenshiReportInput {
  person: PersonInfo
  r: SixiangResult
  t: TrajectoryResult
}

/** 「一生重引动节点」实际渲染的条数上限（与 KeyMoments 内的 slice 保持一致） */
const KEY_MOMENTS_LIMIT = 15

type IconComp = ComponentType<{ size?: number; style?: CSSProperties }>
/** 章节头图标：统一尺寸与配色，与旧版各 h2 内的写法一致 */
const ico = (El: IconComp) => <El size={15} style={{ color: 'var(--hu-po-jin-dark)' }} />

/* ══════════════════════════════════════════════════════════════
   Word 投影（doc）—— 每章的屏幕形态在 body，文档形态在 doc。
   两者是同一份内容的两种呈现，改一个就要改另一个；章节的取舍、顺序、
   标题、编号由 resolveChapters 保证一致，这里只负责"每章长什么样"。

   两条通用约定（与打印版一致）：
    1. 屏幕上的**交互态在文档里一律展开**——点选、折叠、截断都不存在，
       否则读者会看到"点开看"这种在纸上无法执行的提示。
    2. 屏幕上的**纯 UI 提示语**（"点选任一步大运…"）不进入文档，
       其余文字与屏幕逐字相同。
   ══════════════════════════════════════════════════════════════ */

/**
 * 关系事实列表 → 文档块。
 * 屏幕上超过上限会截断并附「点开看」提示；静态文档没有"点开"，因此给全量。
 */
function factBlocks(facts: RelationFact[]): DocBlock[] {
  if (!facts || facts.length === 0) {
    return [{
      t: 'p', small: true, tone: 'muted',
      text: '与原局四柱、三垣均无显著干支作用——这一层底色安静，不因岁运起伏而撕扯。',
    }]
  }
  return [{ t: 'list', items: facts.map((f) => `${f.kind}｜${f.desc}`), small: true }]
}

/** 单步大运在屏幕上是可点选的节点；文档里退化为一行表格 */
function dayunRow(d: DayunTrack): string[] {
  const de = [d.deDiYear ? `年命·${d.deDiYear.kind}` : null, d.deDiDay ? `日命·${d.deDiDay.kind}` : null]
    .filter(Boolean).join('；')
  const heavy = d.facts.filter((f) => f.weight >= 7).length
  return [
    d.ganzhi,
    d.naYin,
    `${d.startAge}–${d.endAge}`,
    `${d.startYear}–${d.endYear}${d.isCurrent ? ' · 现行' : ''}`,
    `${d.stemTenGod}运`,
    de || '—',
    heavy > 0 ? `${heavy} 处` : '—',
  ]
}

/**
 * 识人报告章节编排 —— **结构在这里，数据在 ReportContext**。
 *
 * - 顺序 = 数组顺序；序号由 ReportView 派生（本文件不出现任何章节序号）
 * - 两个 AI 章节标 `kind:'ai'`，正文由 `ctx.ai` 在运行时提供；
 *   识人的 AI 输入取自引擎对象（generateSixiangInsight/TrajectoryInsight 的第一个参数），
 *   与报告串无关，所以这里**不需要 aiContext**，也就不存在"改显示会动 AI"的耦合
 * - 两个方法论/口径说明标 `appendix`，不占正文章节号（与八字「附录A 面相身形」同一规则）
 *
 * 静态常量：不随渲染变化，保证 ReportView 的 memo 稳定。
 */
export const RENSHI_SPEC: ReportSpec<RenshiReportInput> = {
  title: '识人报告',
  chapters: [
    // ── 四象三垣胎息（性格与人品） ──────────────────────────
    {
      id: 'rs-alt-chart', title: '换日口径披露 · 晚子时出生', kind: 'data',
      icon: ico(AlertCircle),
      variant: 'rs-alt-banner',   // 金色左边框强调（原 .rs-alt-banner）
      when: (c) => Boolean(c.result.r.altChart),
      // 状态徽章原先在 h2 内，现由章节头承接
      headerExtra: (c) => c.result.r.altChart?.flipped
        ? <span className="ds-chip ds-chip-xiong">两口径结论存在实质翻转</span>
        : null,
      body: (c) => <AltChartBanner r={c.result.r} />,
      doc: (c) => {
        const r = c.result.r
        const a = r.altChart!
        return [
          {
            t: 'p',
            text: '本命出生于晚子时（23:00–24:00 真太阳时段）。本报告采用**「子初换日」口径**（23:00 起日柱进位为次日，即当前展示的盘）；另一主流「夜子时派」口径（日柱取当天）在学界同样有据。两种口径下关键结论'
              + (a.flipped ? '会发生实质变化，请对照阅读、自行取舍' : '一致，可放心阅读') + '：',
          },
          {
            t: 'table',
            head: ['项目', '口径A · 子初换日（本报告）', '口径B · 夜子时派（日柱当天）'],
            rows: [
              ['日柱', `${r.stages[2]!.ganzhi}（${r.stages[2]!.naYin}）`, `${a.dayGZ}（${a.dayNaYin}）`],
              ['胎息', `${r.taiXi.ganzhi}（${r.taiXi.naYin}）`, `${a.taiXiGZ}（${a.taiXiNaYin}）`],
              ['卑克尊', r.hasFanShang ? '有' : '无', a.hasFanShang ? '有' : '无'],
            ],
          },
          { t: 'note', text: '胎元、命宫、身宫两口径相同；四柱其余柱不变。' },
        ]
      },
    },
    {
      id: 'rs-overview', title: '提取八项信息', kind: 'data',
      icon: ico(Sparkles),
      body: (c) => <OverviewBoard r={c.result.r} />,
      doc: (c) => {
        const r = c.result.r
        return [{
          t: 'grid',
          rows: [
            r.stages.map((s) => ({ label: `${s.label} · ${s.stageName}`, value: s.ganzhi, sub: s.naYin })),
            [
              // 三垣与本命某柱同干支同纳音时带来源标注（与 OverviewBoard 同一规则）
              ...[r.sanyuan.taiYuan, r.sanyuan.mingGong, r.sanyuan.shenGong].map((y) => {
                const same = r.stages.find((s) => s.ganzhi === y.ganzhi && s.naYin === y.naYin)
                return { label: `三垣 · ${y.name}`, value: y.ganzhi, sub: y.naYin, note: same ? `同${same.label}` : undefined }
              }),
              { label: '胎息 · 元神', value: r.taiXi.ganzhi, sub: r.taiXi.naYin },
            ],
          ],
        }]
      },
    },
    {
      id: 'rs-sixiang', title: '四象 · 人生四段', kind: 'data',
      icon: ico(BookOpen),
      body: (c) => <SiXiangTimeline r={c.result.r} />,
      doc: (c) => {
        const r = c.result.r
        const out: DocBlock[] = []
        r.stages.forEach((s, i) => {
          // 段与段之间的尊卑链（屏幕上挂在两卡之间）
          if (i > 0) {
            const z = r.zunBei[i - 1]!
            out.push({
              t: 'p', small: true, bold: true,
              tone: z.kind === '卑克尊' ? 'sha' : 'gold',
              text: `【${z.kind}】${z.from} → ${z.to}：${z.desc}`,
            })
          }
          out.push({ t: 'h', text: `${s.label} · ${s.stageName}　${s.ganzhi}　${s.naYin}`, level: 3 })
          if (s.continuation) out.push({ t: 'p', small: true, tone: 'gold', text: s.continuation })
          out.push({ t: 'cite', text: s.xiang.source })
          out.push({ t: 'p', text: `${s.xiang.image}。${s.stageDesc}。` })
          // 屏幕上性格/暗面是两种配色的 chip；纸上无色可分，补标签区分
          out.push({ t: 'p', small: true, tone: 'gold', text: `性格：${s.xiang.traits.join('、')}` })
          out.push({ t: 'p', small: true, tone: 'sha', text: `暗面：${s.shadow.join('、')}` })
        })
        out.push({ t: 'p', bold: true, tone: r.hasFanShang ? 'sha' : 'qing', text: r.overall })
        return out
      },
    },
    {
      id: 'rs-ganzhi', title: '干支事实层 · 刑冲空亡与五行', kind: 'data',
      icon: ico(Feather),
      body: (c) => <GanZhiFacts r={c.result.r} />,
      doc: (c) => {
        const g = c.result.r.ganZhi
        const kongWang = `${g.kongWang.branches.join('、')}`
          + (g.kongWang.byYear ? `（年柱口径 ${g.kongWang.byYear.join('、')}）` : '')
          + (g.kongWang.fallingInto.length > 0
            ? `——${g.kongWang.fallingInto.join('、')}落空（传统谓落空之力难以尽发，须引动方用）`
            : '——四柱与胎元未落空')
        return [
          {
            t: 'fields',
            rows: [
              { k: '刑冲害', v: g.xingchong.length > 0 ? g.xingchong.join('；') : '无' },
              ...(g.heJu.length > 0 ? [{ k: '合会缓和', v: g.heJu.join('；') }] : []),
              { k: '旬空', v: kongWang, tone: g.kongWang.fallingInto.length > 0 ? 'sha' as const : undefined },
              {
                k: '明干五行',
                v: Object.entries(g.wuxing).map(([k, v]) => `${k}${v}`).join(' ')
                  + (g.missing.length > 0 ? `——明缺${g.missing.join('、')}（仅纳音层有之）` : ''),
                tone: g.missing.length > 0 ? 'sha' as const : undefined,
              },
            ],
          },
          { t: 'note', text: '以上为干支层基本事实，与纳音取象层并行不悖；本报告总评已将两层并置陈述。' },
        ]
      },
    },
    {
      id: 'rs-sanyuan', title: '三垣 · 胎元命宫身宫', kind: 'data',
      icon: ico(Star),
      headerExtra: (c) => {
        const lz = c.result.r.sanyuan.lianZhu
        const tone = lz === '三垣连珠' ? 'ds-chip-ji' : lz === '三垣交战' ? 'ds-chip-xiong' : 'ds-chip-zhong'
        return <span className={`ds-chip ${tone}`}>{lz}</span>
      },
      body: (c) => <SanYuanSection r={c.result.r} />,
      doc: (c) => {
        const y = c.result.r.sanyuan
        return [
          { t: 'p', text: y.desc },
          { t: 'note', text: y.pairs.map((pp) => pp.desc).join('；') },
          ...[y.taiYuan, y.mingGong, y.shenGong].flatMap<DocBlock>((yy) => [
            { t: 'h', text: `${yy.name}　${yy.ganzhi}　${yy.naYin}`, level: 3 },
            { t: 'p', text: yy.role },
            { t: 'p', text: `${yy.xiang.image}。` },
            { t: 'cite', text: `“${yy.xiang.source}”` },
          ]),
        ]
      },
    },
    {
      id: 'rs-method', title: '方法论说明', kind: 'data', appendix: true, defaultOpen: false,
      icon: ico(Feather),
      variant: 'rs-disclosure',
      body: (c) => <DisclosureFooter r={c.result.r} />,
      doc: (c) => [{ t: 'list', items: c.result.r.disclosure, small: true, tone: 'muted' }],
    },

    // ── 人生轨迹（限运与大运流年） ──────────────────────────
    {
      id: 'rs-traj-header', title: '人生轨迹 · 限运与大运流年', kind: 'data',
      icon: ico(Compass),
      body: (c) => <TrajectoryHeader t={c.result.t} />,
      doc: (c) => [
        {
          t: 'p',
          text: '与上方人品性格分析分轨：这里只读**节奏与轨迹**——《三命通会》限运四段（年1-16为根、月17-32为苗、日33-48为花、时49后为果）定四段主题，大运逐年定引动。所有干支作用由引擎按古法算出，点选任一步大运可展开该运十年逐年详情。',
        },
        { t: 'p', tone: 'gold', text: c.result.t.qiYun.note },
      ],
    },
    {
      id: 'rs-traj-stages', title: '限运四段 · 人生节奏', kind: 'data',
      icon: ico(BookOpen),
      body: (c) => <LimitStages t={c.result.t} />,
      doc: (c) => c.result.t.stages.flatMap<DocBlock>((s, i) => [
        {
          t: 'h', level: 3,
          text: `${s.label} · ${s.stageName}　${s.ageRange}　${s.yearRange[0]}–${s.yearRange[1]}年${i === 0 ? '（约）' : ''}`,
        },
        { t: 'p', bold: true, tone: 'qing', text: `${s.ganzhi}　${s.naYin}` },
        ...(s.xiang
          ? [{ t: 'cite' as const, text: `${s.xiang}${s.xi ? `——原文喜${s.xi.replace(/^喜/, '')}` : ''}` }]
          : []),
        { t: 'p', text: `所主：${s.palaceDomain}` },
        {
          t: 'p',
          text: s.dayunCoverage.length > 0
            ? `该段行运：${s.dayunCoverage.map((cc) => `${cc.ganzhi}（${cc.overlap}）`).join('、')}`
            : '该段未交大运（童限），以原局年月为运程底。',
        },
      ]),
    },
    {
      id: 'rs-traj-sanyuan', title: '三垣落地 · 禀赋嵌入轨迹', kind: 'data',
      icon: ico(Star),
      body: (c) => <SanYuanLanding r={c.result.r} t={c.result.t} />,
      doc: (c) => {
        const { r, t } = c.result
        const out: DocBlock[] = []
        for (const y of t.yuanXiang) {
          out.push({ t: 'h', text: `${y.name}　${y.ganzhi}　${y.naYin}`, level: 3 })
          if (y.xiang) out.push({ t: 'cite', text: `“${y.xiang}”${y.xi ? `｜${y.xi}` : ''}` })
          if (y.role) out.push({ t: 'p', text: y.role })
          if (y.landingHits.length > 0) out.push({ t: 'list', items: y.landingHits, small: true })
          out.push(...factBlocks(y.facts))
        }
        out.push({
          t: 'note',
          text: '禀赋与阶段的对应（盲派规矩：三垣不与四柱论五行生克，此处只列实际干支作用）：胎元贴年柱看根基、命宫贴日柱看立身、身宫贴月与时看果实。'
            + (r.cross.length > 0
              ? ` 主引擎并置档：${r.cross.map((x) => `${x.name.split('对')[0]}↔${x.name.split('对')[1]}${x.kind}`).join('；')}。`
              : ''),
        })
        return out
      },
    },
    {
      id: 'rs-traj-taixi', title: '胎息 · 元神如何落在盘上', kind: 'data',
      icon: ico(User),
      body: (c) => <TaiXiLanding r={c.result.r} t={c.result.t} />,
      doc: (c) => {
        const { r, t } = c.result
        return [
          {
            t: 'note',
            text: '「受胎之日那一念先天神识」为本体系对经典胎息（日柱干合支合之柱，《三命通会》）的再创作引申，非古籍原义。此卡不再给空泛档位，直接列元神干支与原局四柱三垣的实际作用。',
          },
          { t: 'h', text: `胎息　${t.taiXiZhu.ganzhi}　${t.taiXiZhu.naYin}`, level: 3 },
          { t: 'cite', text: `“${t.taiXiZhu.xiang}”${t.taiXiZhu.xi ? `｜${t.taiXiZhu.xi}` : ''}` },
          { t: 'p', text: `元神对标时柱（人生终点气质）· ${r.stages[3]!.naYin} · ${r.taiXi.duibiao.label}` },
          ...(r.taiXi.sameNaYinAsHour
            ? [{ t: 'p' as const, text: '（注：胎息与时柱同纳音，为日时干支结构恒象，非个性化推断）' }]
            : []),
          ...factBlocks(t.taiXiZhu.facts),
        ]
      },
    },
    {
      id: 'rs-traj-dayun', title: '大运 × 流年 · 逐步可选', kind: 'data',
      icon: ico(Sparkles),
      body: (c) => <DayunExplorer person={c.result.person} r={c.result.r} t={c.result.t} />,
      doc: (c) => {
        const { person, r, t } = c.result
        const out: DocBlock[] = [{
          t: 'note',
          // 与屏幕逐字相同（含"点选任一步大运…"这句）——文档与屏幕的正文必须一致
          text: '点选任一步大运查看该运十年流年。断语口径为“术语 + 宫位事象 + 年龄区间”，古籍凡冲伏皆须合喜忌定方向——引擎只列作用，不代下吉凶。',
        }]
        // 屏幕上是一排可点选的节点；文档里铺成一张表（全部大运，不折损）
        out.push({
          t: 'table', small: true,
          head: ['大运', '纳音', '虚岁', '年份', '十神', '年命 / 日命', '重引动'],
          rows: t.dayunTracks.map(dayunRow),
        })
        // 屏幕默认选中"现行大运"，文档同此（其余大运的流年由读者按需在网页查看）
        const dy = t.dayunTracks.find((d) => d.isCurrent) ?? t.dayunTracks[0]
        if (dy) {
          out.push({
            t: 'h', level: 3,
            text: `${dy.ganzhi}运　${dy.startAge}–${dy.endAge}虚岁 · 约${dy.startYear}–${dy.endYear}年${dy.isCurrent ? ' · 现行' : ''}`,
          })
          out.push({
            t: 'p',
            text: `${dy.stemTenGod}运，运支藏干 ${dy.hiddenGods.join('、')}。`
              + (dy.deDiYear ? `以年命论：${dy.deDiYear.desc}。` : '')
              + (dy.deDiDay ? `以日柱身命论：${dy.deDiDay.label}。` : '')
              + `日主行${dy.changSheng.stage}——${dy.changSheng.luck}。`
              + (dy.stemBranchForm ? `运柱${dy.stemBranchForm}。` : ''),
          })
          out.push(...factBlocks(dy.facts))

          let liunian: ReturnType<typeof buildLiunianTracks> = []
          try { liunian = buildLiunianTracks(person, r, dy.index) } catch { liunian = [] }
          if (liunian.length > 0) {
            out.push({ t: 'h', level: 3, text: `该运十年逐年（${dy.startYear}–${dy.endYear}）` })
            for (const y of liunian) {
              out.push({ t: 'p', bold: true, tone: 'qing', text: `${y.year}年　${y.ganzhi}　${y.age}岁` })
              out.push({
                t: 'p',
                text: `流年${y.ganzhi.charAt(0)}对日主为${y.stemTenGod}`
                  + (y.kongWangTaiSui ? '；太岁落日柱旬空——古法谓该年虚花少实、吉凶打折扣' : '') + '。',
              })
              out.push(...factBlocks(y.facts))
            }
          }
        }
        return out
      },
    },
    {
      // 标题带上实际渲染条数：旧实现写的是 keyMoments.length，而组件只渲染前 15 条，
      // 条数超过 15 时标题会与内容不符
      id: 'rs-traj-moments',
      title: (c) => `一生重引动节点（引擎按古籍权重取前 ${Math.min(c.result.t.keyMoments.length, KEY_MOMENTS_LIMIT)}）`,
      kind: 'data',
      icon: ico(AlertCircle),
      when: (c) => c.result.t.keyMoments.length > 0,
      body: (c) => <KeyMoments t={c.result.t} />,
      doc: (c) => [{
        t: 'table', small: true,
        head: ['节点', '说明'],
        rows: c.result.t.keyMoments.slice(0, KEY_MOMENTS_LIMIT).map((m) => [m.when, m.text]),
      }],
    },

    // ── AI 解读（承载统一，正文一字不改） ────────────────────
    {
      id: 'ai-trajectory', title: '轨迹解盘师 · 人生轨迹解读', kind: 'ai',
      note: '本文只解读人生节奏与关键节点，与上方人品性格解读互不覆盖。',
    },
    {
      id: 'ai-renshi', title: '深度识人解读', kind: 'ai',
    },

    {
      id: 'rs-traj-disclosure', title: '轨迹口径说明', kind: 'data', appendix: true, defaultOpen: false,
      icon: ico(Feather),
      variant: 'rs-disclosure',
      body: (c) => <TrajectoryDisclosure t={c.result.t} />,
      doc: (c) => [{ t: 'list', items: c.result.t.disclosure, small: true, tone: 'muted' }],
    },
  ],
}
