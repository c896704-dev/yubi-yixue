import type { AppTab } from '../../context/NavContext'

interface SiteFooterProps {
  onNavigate: (tab: AppTab) => void
}

const toolLinks: { label: string; tab: AppTab }[] = [
  { label: '八字排盘', tab: 'bazi' },
  { label: '双人合盘', tab: 'compat' },
  { label: '风水分析', tab: 'fengshui' },
  { label: '六爻 · 梅花', tab: 'divination' },
  { label: '神煞速查', tab: 'shensha' },
]

const refLinks: { label: string; tab: AppTab }[] = [
  { label: '每日时令', tab: 'almanac' },
  { label: '万年历', tab: 'almanac' },
  { label: '我的记录', tab: 'me' },
  { label: '古籍溯源', tab: 'bazi' },
]

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-container site-footer-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-brand-line">
              <span className="yb-seal" style={{ width: 38, height: 38, fontSize: 16 }}>御笔</span>
              <div>
                <div className="footer-brand-name">御笔易学</div>
                <div className="footer-brand-sub">古籍数字化 AI 推演平台</div>
              </div>
            </div>
            <p className="footer-desc">
              以宣纸为底，黛青为骨，琥珀为金。融合八字、合盘、风水、六爻梅花与每日时令，每一句解读皆有古籍为证。
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">术数</h4>
            <ul>
              {toolLinks.map((l) => (
                <li key={l.label}>
                  <a href="#" onClick={(e) => { e.preventDefault(); onNavigate(l.tab) }}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">资源</h4>
            <ul>
              {refLinks.map((l) => (
                <li key={l.label}>
                  <a href="#" onClick={(e) => { e.preventDefault(); onNavigate(l.tab) }}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">关于</h4>
            <ul>
              <li><a href="#" onClick={(e) => e.preventDefault()}>关于御笔</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>使用条款</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>隐私政策</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>联系我们</a></li>
            </ul>
          </div>
        </div>

        <hr className="divider-ink" style={{ margin: '28px 0 20px' }} />

        <div className="footer-bottom">
          <div className="flex items-center gap-3">
            <span>© 2026 御笔易学</span>
            <span className="ink-dot" style={{ opacity: 0.5 }} />
            <span>青ICP备2026000952号-1</span>
          </div>
          <div className="font-serif tracking-[0.2em]">墨韵 · 古意 · 新知</div>
        </div>
      </div>
    </footer>
  )
}
