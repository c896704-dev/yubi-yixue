# 修复 Prompt

以下问题需要修复。

---

## Bug 1：PDF 打印导出像手机截图

**问题**：打印时内容挤在窄列，A4 纸横向空间大量浪费。

**根因**：
1. `PageContainer` 的 `max-width: 1100px` + `px-6` 在打印时仍然生效
2. 算卦结果页全用 `flex-col` 纵向堆叠，A4 横宽 210mm 只用了一半
3. 卦画、六爻表、卦辞全部堆成一列

**修复**：

### `src/index.css` 的 `@media print` 中追加：

```css
/* === 页面容器占满 A4 === */
main { max-width: none !important; padding: 0 !important; margin: 0 !important; }

/* === 卦画区横向排列 === */
.print-hexagrams { display: flex !important; flex-direction: row !important; justify-content: space-around !important; align-items: flex-start !important; gap: 16pt !important; }

/* === 六爻表占满宽度 === */
[class*="max-w-[300px]"] { max-width: none !important; }

/* === 卦画线条强制黑色 === */
[class*="w-[60px]"] > div[class*="h-[6px]"],
[class*="w-[60px]"] > div[class*="flex-1"] > div { background-color: #000 !important; }

/* === 隐藏交互元素 === */
button, input, textarea, select, .animate-bounce, .animate-fade-in, .animate-spin-slow { display: none !important; }

/* === 卡片简洁 === */
.card, [class*="rounded-lg"] { box-shadow: none !important; border: 1px solid #ddd !important; padding: 10pt 12pt !important; margin-bottom: 8pt !important; page-break-inside: avoid; }

/* === 标题 === */
h1 { font-size: 18pt; } h2 { font-size: 14pt; } h3 { font-size: 12pt; }

@page { margin: 12mm 14mm; size: A4; }
```

### `LiuyaoPage.tsx` + `MeihuaPage.tsx` 的卦画区：

加 `print-hexagrams` class：
```tsx
<div className="print-hexagrams">
  <HexagramDisplay hexagram={result.originalHexagram} label="本卦" changingPositions={...} />
  {result.changedHexagram && <><div className="...">→</div><HexagramDisplay hexagram={result.changedHexagram} label="变卦" /></>}
</div>
```

六爻表去掉打印时的 max-w 限制：`className="... max-w-[300px] mx-auto print:max-w-none"`

---

## Bug 2：双人合盘四个仪表盘式打分太丑

**问题**：`CompatScore.tsx` 用四个 SVG 圆弧仪表盘（`ScoreGauge`），像汽车仪表盘，风格廉价，与御笔易学的中式古朴风格不符。

**修复**：完全重写 `CompatScore.tsx`，改用中式横条 + 数字卡片：

```tsx
import type { CompatibilityResult } from '../../types'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

interface CompatScoreProps { result: CompatibilityResult }

function scoreLabel(s: number): string {
  if (s >= 85) return '天作之合'
  if (s >= 70) return '上等良缘'
  if (s >= 55) return '中等可配'
  if (s >= 40) return '尚需磨合'
  return '多有不和'
}

function scoreBarColor(s: number): string {
  if (s >= 80) return 'bg-positive-400'
  if (s >= 60) return 'bg-gold-400'
  if (s >= 40) return 'bg-brand-400'
  return 'bg-negative-400'
}

export function CompatScore({ result }: CompatScoreProps) {
  const { scores, verdict, advantages, weaknesses, warnings } = result

  return (
    <Card>
      {/* 总分大卡 */}
      <div className="text-center mb-6">
        <div className="font-serif text-5xl font-bold text-[#2C2C2C] mb-1">
          {Math.round(scores.total)}
          <span className="text-lg text-[#8C8C8C] font-normal ml-1">分</span>
        </div>
        <div className="text-sm text-[#8C8C8C]">{scoreLabel(scores.total)}</div>
        {verdict && <div className="mt-1 font-serif text-base text-[#2C2C2C]">{verdict}</div>}
      </div>

      {/* 三个子维度：横条 + 分数 */}
      <div className="space-y-3 mb-6">
        {[
          { label: '吸引力', score: scores.attraction, desc: '性格、外表、气场的吸引程度' },
          { label: '稳定性', score: scores.stability, desc: '长期关系的稳定与持久' },
          { label: '互补性', score: scores.complement, desc: '五行能量互补、优缺点互补' },
        ].map((s) => (
          <div key={s.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-serif text-[#2C2C2C] text-sm">{s.label}</span>
              <span className="text-xs text-[#8C8C8C]">{s.desc}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-paper-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${scoreBarColor(s.score)}`}
                  style={{ width: `${Math.min(100, Math.max(0, s.score))}%` }}
                />
              </div>
              <span className="font-bold text-sm text-[#2C2C2C] w-8 text-right">
                {Math.round(s.score)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 优势 / 挑战 / 告警 */}
      <div className="flex flex-col gap-4">
        {advantages?.length > 0 && (
          <div>
            <h3 className="font-serif text-lg font-semibold text-positive-600 mb-2">优势</h3>
            <div className="flex gap-1.5 flex-wrap">
              {advantages.map((a, i) => <Badge key={i} variant="positive">{a}</Badge>)}
            </div>
          </div>
        )}
        {weaknesses?.length > 0 && (
          <div>
            <h3 className="font-serif text-lg font-semibold text-negative-600 mb-2">挑战</h3>
            <div className="flex gap-1.5 flex-wrap">
              {weaknesses.map((w, i) => <Badge key={i} variant="negative">{w}</Badge>)}
            </div>
          </div>
        )}
        {warnings?.length > 0 && (
          <div className="p-4 bg-negative-50 rounded-lg border border-negative-200">
            {warnings.map((w, i) => (
              <p key={i} className="m-0 text-sm text-[#4C4C4C] leading-relaxed">{w}</p>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
```

**旧组件处理**：`ScoreGauge` 如果其他模块不再使用可以直接删除，否则保留不动。

---

## Bug 3：算卦记录无法点击查看 + 没有显示"所占之事"

**问题**：
1. 历史记录列表只有删除按钮，不能点击查看详情
2. 记录卡片没有显示用户曾经填写的"所占之事"

**修复**（`DivinationPage.tsx`）：

```tsx
// 新增状态：查看某条历史记录
const [viewingRecord, setViewingRecord] = useState<DivinationRecord | null>(null)

// 点击记录时加载查看
const handleViewRecord = (r: DivinationRecord) => {
  setViewingRecord(r)
  // 根据类型进入对应子页面并回填数据
  if (r.type === 'liuyao') {
    setView('liuyao')
    // 需要 LiuyaoPage 支持接收外部记录数据：加一个 optional prop 
    // `initialRecord?: DivinationRecord`，有值时直接显示结果
  } else {
    setView('meihua')
  }
}
```

**历史记录卡片**改为：
```tsx
<div key={r.id} className="flex justify-between items-center py-2.5 px-3.5 bg-paper-50 rounded-lg hover:bg-paper-100 cursor-pointer" onClick={() => handleViewRecord(r)}>
  <div>
    <span className="text-sm font-semibold text-[#2C2C2C]">{r.label}</span>
    {/* 显示所占之事 */}
    {r.question && (
      <div className="text-xs text-[#8C8C8C] mt-0.5 truncate max-w-[300px]">
        问：{r.question}
      </div>
    )}
    <div className="flex gap-2 mt-0.5">
      <span className={`text-xs px-1.5 py-0.5 rounded ${r.type === 'liuyao' ? 'bg-amber-100 text-amber-700' : 'bg-pink-100 text-pink-700'}`}>
        {r.type === 'liuyao' ? '六爻' : '梅花易数'}
      </span>
      <span className="text-xs text-[#8C8C8C]">{new Date(r.createdAt).toLocaleDateString('zh-CN')}</span>
    </div>
  </div>
  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
    <Button variant="ghost" size="sm" onClick={() => handleViewRecord(r)}>查看</Button>
    <Button variant="ghost" size="sm" onClick={() => deleteDivinationRecord(r.id).then(loadHistory)}>删除</Button>
  </div>
</div>
```

**LiuyaoPage 和 MeihuaPage**：各加一个 optional prop `viewingRecord?: DivinationRecord`，有值时跳过输入直接展示结果（`phase='result'`，`result` 从 record 的 `hexagramData` 取，`interpretation` 从 record 的 `aiInterpretation` 取）。

---

## Bug 4：双人合盘的合盘历史记录不显示

**问题**：`CompatPage.tsx` 中合盘历史卡片被包在 `{!hasRunCompat && (<>...合盘历史...</>)}` 里。当用户做完一次合盘后，`hasRunCompat` 变为 `true`，整个合盘历史区域被隐藏。

**修复**：把合盘历史记录卡片提到 `!hasRunCompat` 条件外：

```tsx
{/* 合盘历史记录 — 始终可见 */}
{compatRecords.length > 0 && (
  <Card>
    <div className="flex justify-between items-center">
      <span className="font-serif text-lg font-semibold text-[#2C2C2C]">合盘历史</span>
      <Button variant="ghost" size="sm" onClick={() => setShowCompatHistory(!showCompatHistory)}>
        {showCompatHistory ? '收起' : `展开 (${compatRecords.length})`}
      </Button>
    </div>
    {showCompatHistory && (
      <div className="mt-4 flex flex-col gap-1.5">
        {compatRecords.map((cr) => (
          <div key={cr.id} className="flex justify-between items-center py-2.5 px-3.5 bg-paper-50 rounded-lg">
            <span className="text-sm font-semibold text-[#2C2C2C]">{cr.label}</span>
            <Button variant="ghost" size="sm" onClick={() => deleteCompatRecord(cr.id).then(() => getAllCompatRecords().then(setCompatRecords))}>
              删除
            </Button>
          </div>
        ))}
      </div>
    )}
  </Card>
)}
```

**同时修复**：`handleCompat` 中保存记录时 `aiInsight: null` 应改为保存实际的 insight。因为 `fetchAiInsight` 是异步的，需要通过 `useEffect` 在 `aiInsight` 更新后重新保存：

```typescript
// 新增：当 aiInsight 生成后更新记录
useEffect(() => {
  if (aiInsight && result) {
    // 找到最近保存的合盘记录并更新 aiInsight
    getAllCompatRecords().then(records => {
      const latest = records[0]
      if (latest && !latest.aiInsight) {
        saveCompatRecord({ ...latest, aiInsight })
      }
    })
  }
}, [aiInsight, result])
```
