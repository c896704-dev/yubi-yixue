import type { SVGProps } from 'react'

/**
 * 线性图标集 —— 路径取自 lucide-react v0.460（ISC License，出处注明）
 * https://lucide.dev — 御笔易学内嵌精简集，避免引入运行时依赖
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function make(paths: React.ReactNode, viewBox = '0 0 24 24') {
  return function Icon({ size = 16, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths}
      </svg>
    )
  }
}

const P = (d: string, key: number) => <path key={key} d={d} />
const C = (cx: number, cy: number, r: number, key: number) => <circle key={key} cx={cx} cy={cy} r={r} />
const L = (x1: number, y1: number, x2: number, y2: number, key: number) => <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} />
const R = (x: number, y: number, w: number, h: number, key: number, rx?: number) => <rect key={key} x={x} y={y} width={w} height={h} rx={rx} />

/* —— 常用基础 —— */
export const Sparkles = make([P('M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z', 0), P('M20 3v4', 1), P('M22 5h-4', 2)])
export const Feather = make([P('M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z', 0), P('M16 8 2 22', 1), P('M17.5 15H9', 2)])
export const BookOpen = make([P('M12 7v14', 0), P('M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z', 1)])
export const Quote = make([P('M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z', 0), P('M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z', 1)])
export const Moon = make([P('M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z', 0)])
export const Sun = make([C(12, 12, 4, 0), P('M12 2v2', 1), P('M12 20v2', 2), P('m4.93 4.93 1.41 1.41', 3), P('m17.66 17.66 1.41 1.41', 4), P('M2 12h2', 5), P('M20 12h2', 6), P('m6.34 17.66-1.41 1.41', 7), P('m19.07 4.93-1.41 1.41', 8)])
export const Orbit = make([C(12, 12, 3, 0), C(19, 5, 2, 1), C(5, 19, 2, 2), P('M10.4 21.9a10 10 0 0 0 9.941-15.6', 3), P('M13.6 2.1a10 10 0 0 0-9.941 15.6', 4)])
export const Coins = make([C(8, 8, 6, 0), P('M18.09 10.37A6 6 0 1 1 10.34 18', 1), P('M7 6h1v4', 2), P('m16.71 13.88.7.71-2.82 2.82', 3)])
export const ChevronRight = make([P('m9 18 6-6-6-6', 0)])
export const ChevronDown = make([P('m6 9 6 6 6-6', 0)])
export const ArrowLeft = make([P('m12 19-7-7 7-7', 0), P('M19 12H5', 1)])
export const ArrowRight = make([P('M5 12h14', 0), P('m12 5 7 7-7 7', 1)])
export const X = make([P('M18 6 6 18', 0), P('m6 6 12 12', 1)])
export const Search = make([C(11, 11, 8, 0), P('m21 21-4.3-4.3', 1)])
export const Menu = make([L(4, 12, 20, 12, 0), L(4, 6, 20, 6, 1), L(4, 18, 20, 18, 2)])
export const Home = make([P('m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 0), P('M9 22V12h6v10', 1)])
export const Calendar = make([P('M8 2v4', 0), P('M16 2v4', 1), R(3, 4, 18, 18, 2, 2), P('M3 10h18', 3)])
export const Clock = make([C(12, 12, 10, 0), P('M12 6v6l4 2', 1)])
export const MapPin = make([P('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 0), C(12, 10, 3, 1)])
export const User = make([P('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 0), C(12, 7, 4, 1)])
export const Users = make([P('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 0), C(9, 7, 4, 1), P('M22 21v-2a4 4 0 0 0-3-3.87', 2), P('M16 3.13a4 4 0 0 1 0 7.75', 3)])
export const Settings = make([
  P('M12 20h.01', 0), P('M12 12h.01', 1), P('M12 4h.01', 2),
  P('M4.93 4.93 7.07 7.07', 3), P('M16.93 16.93 19.07 19.07', 4),
  P('M4.93 19.07 7.07 16.93', 5), P('M16.93 7.07 19.07 4.93', 6),
  P('M2 12h2', 7), P('M20 12h2', 8), P('M12 2v2', 9), P('M12 20v2', 10),
])
export const Sliders = make([
  L(21, 4, 14, 4, 0), L(10, 4, 3, 4, 1), L(21, 12, 12, 12, 2), L(8, 12, 3, 12, 3),
  L(21, 20, 16, 20, 4), L(12, 20, 3, 20, 5),
  L(14, 2, 14, 6, 6), L(8, 10, 8, 14, 7), L(16, 18, 16, 22, 8),
])
export const History = make([
  P('M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 0),
  P('M3 3v5h5', 1), P('M12 7v5l4 2', 2),
])
export const Trash2 = make([P('M3 6h18', 0), P('M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 1), P('M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 2), L(10, 11, 10, 17, 3), L(14, 11, 14, 17, 4)])
export const RefreshCw = make([P('M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 0), P('M21 3v5h-5', 1), P('M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 2), P('M8 16H3v5', 3)])
export const Printer = make([P('M6 9V2h12v7', 0), P('M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 1), R(6, 14, 12, 8, 2)])
export const Send = make([P('m22 2-7 20-4-9-9-4Z', 0), P('M22 2 11 13', 1)])
export const MessageSquare = make([P('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', 0)])
export const Shield = make([P('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 0)])
export const ShieldCheck = make([P('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 0), P('m9 12 2 2 4-4', 1)])
export const Copy = make([R(8, 8, 14, 14, 0, 2), P('M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2', 1)])
export const Download = make([P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 0), P('m7 10 5 5 5-5', 1), L(12, 15, 12, 3, 2)])
export const Star = make([P('M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z', 0)])
export const Compass = make([C(12, 12, 10, 0), P('m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z', 1)])
export const Wind = make([P('M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2', 0), P('M9.6 4.6A2 2 0 1 1 11 8H2', 1), P('M12.6 19.4A2 2 0 1 0 14 16H2', 2)])
export const Mountain = make([P('m8 3 4 8 5-5 5 15H2L8 3z', 0)])
export const Landmark = make([L(3, 22, 21, 22, 0), L(6, 18, 6, 11, 1), L(10, 18, 10, 11, 2), L(14, 18, 14, 11, 3), L(18, 18, 18, 11, 4), P('M12 2 20 7H4z', 5)])
export const NotebookPen = make([P('M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4', 0), P('M2 6h4', 1), P('M2 10h4', 2), P('M2 14h4', 3), P('M2 18h4', 4), P('M18.4 2.6a2.1 2.1 0 0 1 3 3L16 11l-4 1 1-4Z', 5)])
export const Check = make([P('M20 6 9 17l-5-5', 0)])
export const Heart = make([P('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z', 0)])
export const TrendingUp = make([P('m22 7-8.5 8.5-5-5L2 17', 0), P('M16 7h6v6', 1)])
export const Info = make([C(12, 12, 10, 0), P('M12 16v-4', 1), P('M12 8h.01', 2)])
export const AlertCircle = make([C(12, 12, 10, 0), L(12, 8, 12, 12, 1), L(12, 16, 12.01, 16, 2)])

/** 图标注册表：按名取图标（动态使用场景） */
export const iconMap: Record<string, React.ComponentType<IconProps>> = {
  sparkles: Sparkles, feather: Feather, 'book-open': BookOpen, quote: Quote, heart: Heart, 'trending-up': TrendingUp,
  moon: Moon, sun: Sun, orbit: Orbit, coins: Coins,
  'chevron-right': ChevronRight, 'chevron-down': ChevronDown,
  'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, x: X, search: Search,
  menu: Menu, home: Home, calendar: Calendar, clock: Clock, 'map-pin': MapPin,
  user: User, users: Users, settings: Settings, sliders: Sliders, history: History,
  'trash-2': Trash2, 'refresh-cw': RefreshCw, printer: Printer, send: Send,
  'message-square': MessageSquare, shield: Shield, 'shield-check': ShieldCheck,
  copy: Copy, download: Download, star: Star, compass: Compass, wind: Wind,
  mountain: Mountain, landmark: Landmark, 'notebook-pen': NotebookPen,
}

export type IconName = keyof typeof iconMap
