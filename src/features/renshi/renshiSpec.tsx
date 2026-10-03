import type { ComponentType, CSSProperties } from 'react'
import type { PersonInfo } from '../../types'
import type { SixiangResult } from '../../utils/sixiang'
import type { TrajectoryResult } from '../../utils/trajectory'
import type { ReportSpec } from '../../report/types'
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
    },
    {
      id: 'rs-overview', title: '提取八项信息', kind: 'data',
      icon: ico(Sparkles),
      body: (c) => <OverviewBoard r={c.result.r} />,
    },
    {
      id: 'rs-sixiang', title: '四象 · 人生四段', kind: 'data',
      icon: ico(BookOpen),
      body: (c) => <SiXiangTimeline r={c.result.r} />,
    },
    {
      id: 'rs-ganzhi', title: '干支事实层 · 刑冲空亡与五行', kind: 'data',
      icon: ico(Feather),
      body: (c) => <GanZhiFacts r={c.result.r} />,
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
    },
    {
      id: 'rs-method', title: '方法论说明', kind: 'data', appendix: true, defaultOpen: false,
      icon: ico(Feather),
      variant: 'rs-disclosure',
      body: (c) => <DisclosureFooter r={c.result.r} />,
    },

    // ── 人生轨迹（限运与大运流年） ──────────────────────────
    {
      id: 'rs-traj-header', title: '人生轨迹 · 限运与大运流年', kind: 'data',
      icon: ico(Compass),
      body: (c) => <TrajectoryHeader t={c.result.t} />,
    },
    {
      id: 'rs-traj-stages', title: '限运四段 · 人生节奏', kind: 'data',
      icon: ico(BookOpen),
      body: (c) => <LimitStages t={c.result.t} />,
    },
    {
      id: 'rs-traj-sanyuan', title: '三垣落地 · 禀赋嵌入轨迹', kind: 'data',
      icon: ico(Star),
      body: (c) => <SanYuanLanding r={c.result.r} t={c.result.t} />,
    },
    {
      id: 'rs-traj-taixi', title: '胎息 · 元神如何落在盘上', kind: 'data',
      icon: ico(User),
      body: (c) => <TaiXiLanding r={c.result.r} t={c.result.t} />,
    },
    {
      id: 'rs-traj-dayun', title: '大运 × 流年 · 逐步可选', kind: 'data',
      icon: ico(Sparkles),
      body: (c) => <DayunExplorer person={c.result.person} r={c.result.r} t={c.result.t} />,
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
    },
  ],
}
