import type { CSSProperties } from 'react'
import type { MeihuaResult } from '../types'
import { HexagramDisplay } from '../HexagramDisplay'
import { elementColors } from '../utils/trigrams'
import { ReportMarkdown } from '../../../report/ReportMarkdown'
import { getDuanYu } from '../../../utils/duanyu'
import { getEighteenZhan } from '../../../utils/zhantiduans'

/**
 * 梅花易数报告的各章节片段。
 *
 * 本文件只提供**片段**（各自从 MeihuaCtx 取所需字段）；章节顺序、序号、锚点、
 * 目录与 AI 承载由 meihuaSpec.tsx 描述、ReportView 统一处理。
 */
export interface MeihuaCtx {
  result: MeihuaResult
  meihuaAnalysis: string | null
  interpretation: string | null
  interpreting: boolean
  interpretError: string | null
  activeDuanHex: string
  setActiveDuanHex: (v: string) => void
  autoInterpret: (r: MeihuaResult, q: string) => Promise<void>
  question: string
}

/** MeihuaHexSection */
export function MeihuaHexSection({ p }: { p: MeihuaCtx }) {
  const { result } = p
  return (
    <>
          <div className="hexagram-row">
            <HexagramDisplay
              hexagram={result.originalHexagram}
              label="本卦"
              changingPositions={[result.changingYao]}
            />
            <span className="hex-sep">→</span>
            <HexagramDisplay
              hexagram={result.huHexagram}
              label="互卦"
            />
            <span className="hex-sep">→</span>
            <HexagramDisplay
              hexagram={result.changedHexagram}
              label="变卦"
            />
            {result.cuoHexagram && (
              <>
                <span className="hex-sep">·</span>
                <HexagramDisplay
                  hexagram={result.cuoHexagram}
                  label="错卦"
                />
              </>
            )}
            {result.zongHexagram && (
              <>
                <span className="hex-sep">·</span>
                <HexagramDisplay
                  hexagram={result.zongHexagram}
                  label="综卦"
                />
              </>
            )}
          </div>
          <div className="text-xs text-center mt-3" style={{ color: 'rgba(0,77,77,0.55)' }}>
            本卦为始 → 互卦为过程 → 变卦为终；错卦观对立面 · 综卦换位思考
          </div>
    </>
  )
}

/** MeihuaTiYongSection */
export function MeihuaTiYongSection({ p }: { p: MeihuaCtx }) {
  const { result } = p
  const tyColor = elementColors[result.tiYong.tiElement]
  const yyColor = elementColors[result.tiYong.yongElement]
  const relStyle: CSSProperties = result.tiYong.relation === '体用比和' || result.tiYong.relation === '用生体'
    ? { color: 'var(--success)', backgroundColor: 'var(--positive-bg)', borderColor: 'var(--success)' }
    : result.tiYong.relation === '体克用'
    ? { color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary-light)' }
    : { color: 'var(--danger)', backgroundColor: 'var(--negative-bg)', borderColor: 'var(--danger)' }
  return (
    <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-4 rounded-lg text-center ${tyColor.bg} ${tyColor.border} border`}>
              <div className="text-xs mb-1" style={{ color: 'rgba(0,77,77,0.55)' }}>体卦（我）</div>
              <div className="text-2xl font-[family-name:var(--font-title)] mb-1">{result.tiYong.ti.symbol}</div>
              <div className={`font-semibold ${tyColor.text}`}>{result.tiYong.ti.name} · {result.tiYong.tiElement}</div>
              <div className="text-xs mt-1" style={{ color: 'rgba(0,77,77,0.55)' }}>{result.tiYong.ti.image} · {result.tiYong.ti.direction}</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${yyColor.bg} ${yyColor.border} border`}>
              <div className="text-xs mb-1" style={{ color: 'rgba(0,77,77,0.55)' }}>用卦（事）</div>
              <div className="text-2xl font-[family-name:var(--font-title)] mb-1">{result.tiYong.yong.symbol}</div>
              <div className={`font-semibold ${yyColor.text}`}>{result.tiYong.yong.name} · {result.tiYong.yongElement}</div>
              <div className="text-xs mt-1" style={{ color: 'rgba(0,77,77,0.55)' }}>{result.tiYong.yong.image} · {result.tiYong.yong.direction}</div>
            </div>
          </div>
          <div className="p-3 rounded-lg border text-center" style={relStyle}>
            <span className="font-[family-name:var(--font-title)] font-bold text-lg">{result.tiYong.relation}</span>
            <p className="text-sm mt-1">{result.tiYong.judgment}</p>
          </div>
    </>
  )
}

/** MeihuaAnalysisSection */
export function MeihuaAnalysisSection({ p }: { p: MeihuaCtx }) {
  const { result } = p
  const { meihuaAnalysis } = p
  return (
    <>
          {meihuaAnalysis && (
            <div className="report text-sm leading-relaxed p-4 rounded-lg mb-3"
              style={{ color: 'var(--fg)', backgroundColor: 'var(--bg)' }}>
              <ReportMarkdown>{meihuaAnalysis}</ReportMarkdown>
            </div>
          )}
          {result.yingQi && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-light)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--primary-hover)' }}>应期推算（卦气法 + 卦数法）</div>
              <div className="text-xs"><span className="font-semibold">推算依据：</span>{result.yingQi.description}</div>
              <div className="text-sm font-bold mt-2 rounded p-2.5 text-center"
                style={{ color: 'var(--primary)', backgroundColor: 'var(--surface)' }}>
                {result.yingQi.timeRange}
              </div>
            </div>
          )}
          {!meihuaAnalysis && !result.yingQi && <p className="text-sm text-center py-4" style={{ color: 'rgba(0,77,77,0.55)' }}>等待 AI 解读完成...</p>}
    </>
  )
}

/** MeihuaGuaCiSection */
export function MeihuaGuaCiSection({ p }: { p: MeihuaCtx }) {
  const { result } = p
  return (
    <>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(0,77,77,0.55)' }}>{result.originalHexagram.judgment}</p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--fg)' }}>{result.originalHexagram.meaning}</p>
          <div style={{ borderTop: '1px solid var(--border)' }} className="pt-3">
            {(() => {
              // 同一卦可能兼任多个角色（互卦与变卦同为「天风姤」很常见），释义只渲染一次，标签合并显示
              type Entry = { name: string; meaning: string; labels: string[] }
              const seen = new Map<string, Entry>()
              seen.set(result.originalHexagram.name, {
                name: result.originalHexagram.name,
                meaning: result.originalHexagram.meaning,
                labels: [],
              })
              const list: Entry[] = []
              const add = (label: string, hex?: { name: string; meaning: string } | null) => {
                if (!hex) return
                const exist = seen.get(hex.name)
                if (exist) { exist.labels.push(label); return }
                const entry: Entry = { name: hex.name, meaning: hex.meaning, labels: [label] }
                seen.set(hex.name, entry)
                list.push(entry)
              }
              add('互卦', result.huHexagram)
              add('变卦', result.changedHexagram)
              add('错卦', result.cuoHexagram)
              add('综卦', result.zongHexagram)

              const sameAsOriginal = seen.get(result.originalHexagram.name)!.labels
              return (
                <>
                  {list.map((h, i) => (
                    <div key={h.name} className={i > 0 ? 'mt-3' : ''}>
                      <p className="text-xs mb-1" style={{ color: 'rgba(0,77,77,0.55)' }}>{h.labels.join(' / ')} · {h.name}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{h.meaning}</p>
                    </div>
                  ))}
                  {sameAsOriginal.length > 0 && (
                    <p className="text-xs mt-3" style={{ color: 'rgba(0,77,77,0.55)' }}>
                      {sameAsOriginal.join(' / ')} · {result.originalHexagram.name}（与本卦同，释义见上方）
                    </p>
                  )}
                </>
              )
            })()}
          </div>
    </>
  )
}

/** MeihuaDuanYuSection */
export function MeihuaDuanYuSection({ p }: { p: MeihuaCtx }) {
  const { result } = p
  const { activeDuanHex } = p
  const { setActiveDuanHex } = p
  const hexOpts = [
    { key: 'original', label: '本卦', h: result.originalHexagram },
    { key: 'mutual', label: '互卦', h: result.huHexagram },
    { key: 'changing', label: '变卦', h: result.changedHexagram },
    ...(result.cuoHexagram ? [{ key: 'cuo', label: '错卦', h: result.cuoHexagram }] : []),
    ...(result.zongHexagram ? [{ key: 'zong', label: '综卦', h: result.zongHexagram }] : []),
  ] as { key: string; label: string; h: any }[]
  const active = hexOpts.find(o => o.key === activeDuanHex) || hexOpts[0]
  const dy = getDuanYu(active.h.name)
  return (
    <>
              <div className="flex gap-1 mb-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                {hexOpts.map(opt => (
                  <button key={opt.key} onClick={() => setActiveDuanHex(opt.key)}
                    className="px-3 py-1.5 text-xs rounded-t transition-colors"
                    style={activeDuanHex === opt.key ? { backgroundColor: 'var(--primary)', color: '#fbfaf5', fontWeight: 600 } : { color: 'rgba(0,77,77,0.55)' }}>
                    {opt.label} · {opt.h.name}
                  </button>
                ))}
              </div>
              {dy ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(dy).filter(([k]) => ['运势','事业','家运','考试','求财','婚姻','诉讼','出行'].includes(k)).map(([k, v]) => (
                    <div key={k} className="p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                      <span className="font-semibold" style={{ color: 'var(--fg)' }}>{k}</span>
                      <span className="ml-1" style={{ color: 'var(--fg)' }}>{v as string}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs" style={{ color: 'rgba(0,77,77,0.55)' }}>暂无故辞可考</p>}
              {/* 打印时显示所有卦断语 */}
              <div className="hidden print:block mt-4">
                {hexOpts.map(opt => {
                  const d = getDuanYu(opt.h.name)
                  if (!d) return null
                  const dims = Object.entries(d).filter(([k]) => ['运势','事业','家运','考试','求财','婚姻','诉讼','出行'].includes(k))
                  if (dims.length === 0) return null
                  return (
                    <div key={opt.key}>
                      <h4 className="text-sm font-[family-name:var(--font-title)] font-bold mb-1">{opt.label} · {opt.h.name}</h4>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {dims.map(([k, v]) => (<div key={k} className="p-1"><b>{k}</b> {v as string}</div>))}
                      </div>
                    </div>
                  )
                })}
              </div>
    </>
  )
}

/** MeihuaZhuanTiSection */
export function MeihuaZhuanTiSection({ p }: { p: MeihuaCtx }) {
  const { result } = p
  const { question } = p
  const zt = getEighteenZhan(question, result.tiYong.relation)
  if (!zt) return null
  return (
    <>
              <div className="text-xs leading-relaxed p-3 rounded-lg border"
                style={{ color: 'var(--fg)', backgroundColor: 'var(--info-bg)', borderColor: 'var(--info-bg)' }}>
                <span className="font-semibold" style={{ color: 'var(--info)' }}>按《梅花易数》十八占法则：</span>
                <p className="mt-1">{zt}</p>
              </div>
    </>
  )
}
