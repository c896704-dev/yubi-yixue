import type { LiuyaoResult } from '../types'
import { HexagramDisplay } from '../HexagramDisplay'
import { ReportMarkdown } from '../../../report/ReportMarkdown'
import { getDuanYu } from '../../../utils/duanyu'
import { determineLiuyaoYongShen } from '../utils/liuyao-yongshen'
import { computeYingQiLiuyao } from '../../../utils/yingqi'

/**
 * 六爻报告的各章节片段。
 *
 * 本文件只提供**片段**（各自从 LiuyaoCtx 取所需字段）；章节顺序、序号、锚点、
 * 目录与 AI 承载由 liuyaoSpec.tsx 描述、ReportView 统一处理。
 *
 * 原先这些卡片是页面 return 里的内联 JSX，自带 <Card> 外壳；接入 ReportView 后
 * 外壳由呈现层提供，故此处只剩卡片**内容**。
 */
export interface LiuyaoCtx {
  result: LiuyaoResult
  question: string
  analysisText: string | null
  interpreting: boolean
  interpretError: string | null
  interpretation: string | null
  activeLiuyaoHex: string
  setActiveLiuyaoHex: (v: string) => void
  handleReinterpret: () => void
}

export function LiuyaoHexSection({ p }: { p: LiuyaoCtx }) {
  const { result } = p
  return (
    <>
          <div className="hexagram-row">
            <HexagramDisplay
              hexagram={result.originalHexagram}
              label="本卦"
              changingPositions={result.changingPositions}
            />
            {result.changedHexagram && (
              <span className="hex-sep">→</span>
            )}
            {result.changedHexagram && (
              <HexagramDisplay
                hexagram={result.changedHexagram}
                label="变卦"
              />
            )}
          </div>

          {/* 六爻纳甲排盘表 */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            {/* 月建日辰信息栏 */}
            {result.naja && (
              <div className="flex flex-wrap gap-4 justify-center mb-4 text-xs" style={{ color: 'rgba(0,77,77,0.55)' }}>
                <span>宫：<b style={{ color: 'var(--fg)' }}>{result.naja.palaceName}</b>（{result.naja.palaceElement}）</span>
                <span>月建：<b style={{ color: 'var(--fg)' }}>{result.naja.monthZhi}月{result.naja.monthWuxing}</b></span>
                <span>日辰：<b style={{ color: 'var(--fg)' }}>{result.naja.dayZhi}日{result.naja.dayWuxing}</b></span>
                {result.naja.isLiuChong && <span className="font-semibold" style={{ color: 'var(--danger)' }}>六冲卦</span>}
                {result.naja.isStatic && <span style={{ color: 'var(--primary)' }}>静卦</span>}
              </div>
            )}

            {/* 纳甲表头 */}
            <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-semibold mb-1 px-1"
              style={{ color: 'rgba(0,77,77,0.55)' }}>
              <span>爻位</span><span>六神</span><span>干支</span><span>五行</span><span>六亲</span><span>世应</span><span>阴阳</span>
            </div>

            {/* 纳甲表体 — 从上往下显示 */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              {[...(result.naja?.lines || result.lines)].reverse().map((line, i) => {
                const pos = 6 - i
                const posNames = ['','初','二','三','四','五','上']
                const isShi = line.shiying === '世'
                const isYing = line.shiying === '应'
                return (
                  <div key={i} className="grid grid-cols-7 gap-1 text-xs text-center py-2 px-1 items-center"
                    style={{
                      borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
                      backgroundColor: line.changing ? 'var(--negative-bg)' : isShi ? 'var(--primary-light)' : undefined,
                    }}>
                    <span style={{ color: 'rgba(0,77,77,0.55)' }}>{posNames[pos]}爻</span>
                    <span style={{ color: 'var(--hu-po-jin, #d4af37)' }}>{line.liushen || ''}</span>
                    <span className="font-semibold tracking-wide" style={{ color: 'var(--fg)' }}>{line.gan || ''}{line.zhi || ''}</span>
                    <span>{line.wuxing || ''}</span>
                    <span>{line.liuqin || ''}</span>
                    <span>
                      {isShi && <span className="inline-block px-1.5 py-px rounded text-[10px] font-semibold"
                        style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)' }}>世</span>}
                      {isYing && <span className="inline-block px-1.5 py-px rounded text-[10px] font-semibold"
                        style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)' }}>应</span>}
                    </span>
                    <span style={line.value ? {} : { color: 'rgba(0,77,77,0.55)' }}>
                      {line.value ? '⚊' : '⚋'}
                      {line.changing && <span className="ml-0.5" style={{ color: 'var(--danger)' }}>{line.value ? '○' : '×'}</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 卦局分析（嵌入卦象卡片底部） */}
          {result.naja && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                  <span style={{ color: 'rgba(0,77,77,0.55)' }}>卦局：</span>
                  <span className="font-semibold" style={{ color: 'var(--fg)' }}>
                    {result.naja.isLiuChong?'六冲卦':result.naja.isLiuHe?'六合卦':'非冲非合'}
                  </span>
                  {result.naja.isLiuChong && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(0,77,77,0.55)' }}>六冲主快散变动</p>}
                  {result.naja.isLiuHe && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(0,77,77,0.55)' }}>六合主和聚长久</p>}
                </div>
                {result.naja.chiShiLiqin && (
                  <div className="p-2.5 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                    <span style={{ color: 'rgba(0,77,77,0.55)' }}>持世：</span>
                    <span className="font-semibold" style={{ color: 'var(--fg)' }}>{result.naja.chiShiLiqin}持世</span>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(0,77,77,0.55)' }}>{result.naja.chiShiText}</p>
                  </div>
                )}
              </div>
            </div>
          )}
    </>
  )
}

/** LiuyaoAnalysisSection */
export function LiuyaoAnalysisSection({ p }: { p: LiuyaoCtx }) {
  const { result } = p
  const { analysisText } = p
  const { question } = p
  return (
    <>
          {analysisText && (
            <div className="report text-sm leading-relaxed p-4 rounded-lg mb-3"
              style={{ color: 'var(--fg)', backgroundColor: 'var(--bg)' }}>
              <ReportMarkdown>{analysisText}</ReportMarkdown>
            </div>
          )}
          {result.naja && (() => {
            const naja = result.naja!
            const ys = determineLiuyaoYongShen(naja.lines, question)
            const yq = computeYingQiLiuyao(ys.primary.line.wuxing!, naja.isStatic, naja.monthWuxing)
            if (!yq || yq.length === 0) return null
            return (
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-sm mb-1" style={{ color: 'var(--fg)' }}>应期推算</div>
                {yq.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded p-2"
                    style={{ backgroundColor: 'var(--primary-light)' }}>
                    <span className="font-semibold min-w-[80px]" style={{ color: 'var(--primary-hover)' }}>{item.method}</span>
                    <span className="flex-1 font-bold" style={{ color: 'var(--primary)' }}>{item.timeWindow}</span>
                  </div>
                ))}
              </div>
            )
          })()}
          {!analysisText && !result.naja && <p className="text-sm text-center py-4" style={{ color: 'rgba(0,77,77,0.55)' }}>等待 AI 解读完成...</p>}
    </>
  )
}

/** LiuyaoGuaCiSection */
export function LiuyaoGuaCiSection({ p }: { p: LiuyaoCtx }) {
  const { result } = p
  return (
    <>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(0,77,77,0.55)' }}>{result.originalHexagram.judgment}</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{result.originalHexagram.meaning}</p>
          {result.changedHexagram && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>
                变卦 · {result.changedHexagram.name}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{result.changedHexagram.meaning}</p>
            </div>
          )}
    </>
  )
}

/** LiuyaoDuanYuSection */
export function LiuyaoDuanYuSection({ p }: { p: LiuyaoCtx }) {
  const { result } = p
  const { activeLiuyaoHex } = p
  const { setActiveLiuyaoHex } = p
  const hexOpts = [
    { key: 'original', label: '本卦', name: result.originalName },
    ...(result.changedName ? [{ key: 'changed', label: '变卦', name: result.changedName }] : []),
  ]
  const active = hexOpts.find(o => o.key === activeLiuyaoHex) || hexOpts[0]
  const dy = getDuanYu(active.name)
  const allDims = (name: string) => {
    const d = getDuanYu(name); if (!d) return []
    return Object.entries(d).filter(([k]) => ['运势', '事业', '家运', '考试', '求财', '婚姻', '诉讼', '出行'].includes(k))
  }
  return (
    <>
              <div className="flex gap-1 mb-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                {hexOpts.map(opt => (
                  <button key={opt.key} onClick={() => setActiveLiuyaoHex(opt.key)}
                    className="px-3 py-1.5 text-xs rounded-t transition-colors"
                    style={activeLiuyaoHex === opt.key ? { backgroundColor: 'var(--primary)', color: '#fbfaf5', fontWeight: 600 } : { color: 'rgba(0,77,77,0.55)' }}>
                    {opt.label} · {opt.name}
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
              ) : <p className="text-xs" style={{ color: 'rgba(0,77,77,0.55)' }}>暂无</p>}
              {/* 打印时显示所有卦断语 */}
              <div className="hidden print:block mt-4">
                {hexOpts.map(opt => {
                  const dims = allDims(opt.name)
                  if (dims.length === 0) return null
                  return (
                    <div key={opt.key}>
                      <h4 className="text-sm font-[family-name:var(--font-title)] font-bold mb-1">{opt.label} · {opt.name}</h4>
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
