import { useMemo, useState } from 'react'
import { RECOMMENDED_CITIES, type RecommendedCity } from '../../utils/cityData'
import { MapPin } from '../ui/Icon'

interface ChinaMapPickerProps {
  value?: RecommendedCity | null
  onSelect: (city: RecommendedCity) => void
  /** 紧凑模式（合盘双栏内使用） */
  compact?: boolean
}

/** 中国示意地图投影范围 */
const LNG_MIN = 73
const LNG_MAX = 136
const LAT_MIN = 17.5
const LAT_MAX = 54.5
const W = 640
const H = 440

/** 经纬度 → SVG 坐标（线性投影） */
function project(lng: number, lat: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H
  return [x, y]
}

/** 简化中国轮廓（经纬度顶点，约 70 点） */
const CN_OUTLINE: [number, number][] = [
  [125.2, 53.4], [127.0, 50.2], [134.7, 48.4], [131.5, 44.8], [129.5, 43.0], [126.6, 41.8],
  [124.0, 40.0], [121.8, 38.9], [120.4, 37.4], [119.2, 35.1], [120.9, 32.0], [121.8, 30.9],
  [122.4, 29.8], [121.5, 27.9], [120.3, 26.4], [118.0, 24.5], [116.5, 23.2], [114.3, 22.0],
  [112.9, 21.5], [111.0, 21.4], [110.2, 20.3], [109.2, 18.9], [108.6, 19.8], [109.8, 21.0],
  [108.0, 21.6], [106.6, 22.4], [105.0, 23.0], [104.0, 22.6], [102.3, 23.4], [101.0, 22.0],
  [99.5, 21.0], [98.0, 22.0], [97.4, 24.3], [97.9, 26.6], [98.8, 28.0], [97.5, 29.2],
  [94.8, 29.2], [92.5, 28.2], [91.6, 27.3], [89.5, 28.2], [87.8, 27.8], [85.8, 28.6],
  [84.5, 29.2], [82.5, 30.0], [80.3, 31.3], [78.8, 32.5], [78.0, 33.8], [74.6, 36.8],
  [74.2, 38.0], [76.5, 39.4], [79.5, 41.2], [81.3, 43.2], [84.0, 44.8], [86.5, 46.5],
  [87.0, 47.6], [89.0, 47.9], [91.2, 47.5], [94.0, 45.5], [96.5, 43.5], [99.5, 42.5],
  [102.5, 42.7], [105.5, 42.0], [108.0, 43.2], [110.5, 44.5], [113.5, 43.7], [115.5, 44.6],
  [117.5, 45.5], [119.5, 47.0], [121.5, 48.2], [123.5, 49.5],
]

/** 台湾 / 海南岛 */
const TAIWAN: [number, number][] = [[121.0, 25.3], [121.9, 24.9], [121.2, 22.5], [120.3, 23.1]]
const HAINAN: [number, number][] = [[110.8, 20.1], [109.6, 18.5], [108.6, 19.4], [109.3, 20.2]]

function toPoints(pts: [number, number][]): string {
  return pts.map(([lng, lat]) => { const [x, y] = project(lng, lat); return `${x.toFixed(1)},${y.toFixed(1)}` }).join(' ')
}

export function ChinaMapPicker({ value, onSelect, compact }: ChinaMapPickerProps) {
  const [hover, setHover] = useState<RecommendedCity | null>(null)

  const outline = useMemo(() => toPoints(CN_OUTLINE), [])
  const taiwan = useMemo(() => toPoints(TAIWAN), [])
  const hainan = useMemo(() => toPoints(HAINAN), [])

  const fontSize = compact ? 10 : 11
  const dotR = compact ? 3.6 : 4.2

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ border: '1px solid var(--dan-mo)', background: 'rgba(251,250,245,0.6)' }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="中国地图 · 点击选择出生城市">
          {/* 经纬网 */}
          {[80, 90, 100, 110, 120, 130].map((lng) => {
            const [x] = project(lng, 36)
            return <line key={lng} x1={x} y1={0} x2={x} y2={H} stroke="rgba(0,77,77,0.06)" strokeWidth="1" />
          })}
          {[25, 30, 35, 40, 45, 50].map((lat) => {
            const [, y] = project(90, lat)
            return <line key={lat} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,77,77,0.06)" strokeWidth="1" />
          })}

          {/* 大陆轮廓 */}
          <polygon points={outline} fill="rgba(0,77,77,0.045)" stroke="rgba(0,77,77,0.4)" strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points={taiwan} fill="rgba(0,77,77,0.05)" stroke="rgba(0,77,77,0.35)" strokeWidth="1" />
          <polygon points={hainan} fill="rgba(0,77,77,0.05)" stroke="rgba(0,77,77,0.35)" strokeWidth="1" />

          {/* 推荐城市标记 */}
          {RECOMMENDED_CITIES.map((c) => {
            const [x, y] = project(c.lng, c.lat)
            const selected = value?.name === c.name
            const isHover = hover?.name === c.name
            return (
              <g
                key={c.name}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelect(c)}
                onMouseEnter={() => setHover(c)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                {selected && (
                  <circle r={dotR + 6} fill="rgba(212,175,55,0.25)" />
                )}
                <circle
                  r={selected ? dotR + 1.6 : isHover ? dotR + 1.2 : dotR}
                  fill={selected ? '#b8960f' : isHover ? '#006666' : '#004d4d'}
                  stroke="#fbfaf5"
                  strokeWidth="1.2"
                  style={{ transition: 'r 0.15s, fill 0.15s' }}
                />
                <title>{c.name}</title>
                {(selected || isHover) && (
                  <text
                    y={-dotR - 5}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight={selected ? 700 : 500}
                    fill={selected ? '#b8960f' : '#004d4d'}
                    style={{ pointerEvents: 'none' }}
                  >
                    {c.name}
                  </text>
                )}
              </g>
            )
          })}

          {/* 图例 */}
          <g fontSize={9} fill="rgba(0,77,77,0.5)">
            <text x={10} y={H - 14}>东经 73° – 136°</text>
            <text x={W - 92} y={H - 14}>示意图 · 点击城市选点</text>
          </g>
        </svg>
      </div>

      {/* 选中城市信息 */}
      <div className="flex items-center justify-between gap-3 mt-2.5" style={{ fontSize: 13 }}>
        <span className="flex items-center gap-2" style={{ color: 'var(--dai-qing)' }}>
          <MapPin size={14} style={{ color: 'var(--hu-po-jin-dark)' }} />
          {value ? (
            <b className="font-serif" style={{ color: 'var(--dai-qing)' }}>{value.name}</b>
          ) : (
            <span style={{ color: 'rgba(0,77,77,0.5)' }}>在地图上点击选择出生城市</span>
          )}
        </span>
        {value && (
          <span style={{ color: 'rgba(0,77,77,0.55)' }}>
            经度 {value.lng.toFixed(2)}°E · 纬度 {value.lat.toFixed(2)}°N
          </span>
        )}
      </div>
    </div>
  )
}
