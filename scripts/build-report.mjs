import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, LevelFormat, PageOrientation, SectionType } from 'docx';
import fs from 'fs';

const CW = 9026; // A4 content width with 1" margins (11906 - 1440 - 1440)
const border = { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 100, right: 100 };
const headFill = "1E3A3A";

function hCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, margins: cellMargins,
    shading: { fill: headFill, type: ShadingType.CLEAR },
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, font: "Noto Sans SC", size: 18, color: "FFFFFF" })] })],
  });
}

function dCell(text, width, opts = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, margins: cellMargins,
    shading: opts.hi ? { fill: "F5F3EC", type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text: String(text ?? ''), font: "Noto Sans SC", size: 18, ...opts })],
    })],
  });
}

function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 240 },
    children: [new TextRun({ text, font: "Noto Serif SC", size: 36, bold: true, color: "1E3A3A" })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, font: "Noto Serif SC", size: 26, bold: true, color: "2D5F5F" })],
  });
}

function para(text) {
  return new Paragraph({ spacing: { after: 100 },
    children: [new TextRun({ text, font: "Noto Sans SC", size: 20, color: "1A1A1A" })] });
}

function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 50 },
    children: [new TextRun({ text, font: "Noto Sans SC", size: 19, color: "333333" })] });
}

function makeTable(headers, rows, widths) {
  const tw = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: tw, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h, i) => hCell(h, widths[i])) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((c, ci) => dCell(c, widths[ci], { hi: ri % 2 === 0 })) })),
    ],
  });
}

// ─── section factory (portrait / landscape) ───
function portraitSection(children) {
  return { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, headers: hdrs, footers: ftrs, children };
}
function landscapeSection(children) {
  return { properties: { page: { size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, headers: hdrs, footers: ftrs, children };
}

const hdrs = {
  default: new Header({ children: [
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D4AF37", space: 4 } },
      children: [new TextRun({ text: "御笔易学 · qingnang.cc 对标优化方案", font: "Noto Serif SC", size: 16, color: "999999" })] }),
  ]}),
};
const ftrs = {
  default: new Footer({ children: [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: "E0E0E0", space: 4 } },
      children: [new TextRun({ text: "第 ", font: "Noto Sans SC", size: 16, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], font: "Noto Sans SC", size: 16, color: "999999" }), new TextRun({ text: " 页", font: "Noto Sans SC", size: 16, color: "999999" })] }),
  ]}),
};

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Noto Sans SC", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Noto Serif SC", color: "1E3A3A" },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Noto Serif SC", color: "2D5F5F" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ── 封面 ──
    portraitSection([
      new Paragraph({ spacing: { before: 4000 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
        children: [new TextRun({ text: "御笔易学", font: "Noto Serif SC", size: 60, bold: true, color: "1E3A3A" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
        children: [new TextRun({ text: "×", font: "Noto Serif SC", size: 28, color: "D4AF37" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
        children: [new TextRun({ text: "qingnang.cc 青囊", font: "Noto Serif SC", size: 32, color: "1E3A3A" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 },
        children: [new TextRun({ text: "对标分析优化方案", font: "Noto Serif SC", size: 48, bold: true, color: "D4AF37" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
        children: [new TextRun({ text: "古籍数字化 AI 推演平台 · 功能 / 设计 / 技术全维度对标", font: "Noto Sans SC", size: 20, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
        children: [new TextRun({ text: "2026 年 6 月", font: "Noto Sans SC", size: 18, color: "999999" })] }),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 目录 ──
    portraitSection([
      heading("目  录"),
      para(""),
      para("一、整体架构对比"),
      para("二、视觉设计系统深度分析"),
      para("三、动画与交互特效"),
      para("四、功能覆盖面对比"),
      para("五、功能性对标优化方案"),
      para("六、视觉 / 交互 / 动效优化方案"),
      para("七、技术债务清理"),
      para("八、实施优先级矩阵"),
      para("九、关键文件清单"),
      para("十、同业案例参考"),
      para("十一、验证指标"),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 一、整体架构对比 ──
    portraitSection([
      heading("一、整体架构对比"),
      para("qingnang.cc（青囊 Aether Pouch）是基于 Next.js App Router + Turbopack 构建的古籍数字化 AI 推演平台，托管于 Vercel + Cloudflare CDN。御笔易学 (yubiyixue.xyz) 是 React SPA + Vite + Express 架构，托管于自建 Ubuntu VPS。两者服务于同一类用户群体，但在技术选型、设计品质、功能覆盖上存在系统性差距。"),
      para(""),
      // 4-col table → 2256 each = 9026
      makeTable(
        ["维度", "qingnang.cc", "御笔易学", "建议"],
        [
          ["框架", "Next.js + Turbopack + RSC", "React SPA + Vite 6", "保持 Vite，加代码分割"],
          ["部署", "Vercel + Cloudflare CDN", "Ubuntu VPS + Nginx", "保持 VPS（备案），可加 CDN"],
          ["CSS 方案", "Tailwind v4 (CSS-first)", "Tailwind v3 + CSS 变量", "升级到 Tailwind v4"],
          ["动画引擎", "27+ 纯 CSS 关键帧", "4 个基础动画", "扩展至 12-15 个"],
          ["PWA", "完整支持", "无", "必须添加"],
          ["SEO", "完整 OG / JSON-LD / 百度", "仅基础 title", "必须添加"],
          ["主题系统", "3 套", "1 套", "扩展至 3 套"],
          ["字体系统", "Serif 标题 + Sans 正文", "SF Pro + Noto 混用", "宋体标题 + 黑体正文"],
        ],
        [1700, 2400, 2400, 2526],
      ),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 二、视觉设计系统 ──
    portraitSection([
      heading("二、视觉设计系统深度分析"),

      h2("2.1 色彩系统"),
      para("qingnang.cc 使用中文古典色调命名，三套主题通过 CSS 变量驱动。御笔当前使用 Apple 蓝白 HSL 配色，与命理古籍主题气质不匹配。以下为核心色值对照："),
      para(""),
      // 5-col → 1806 each = 9030
      makeTable(
        ["Token", "classic 主题", "zen 主题", "zen-dark", "用途"],
        [
          ["--dai-qing (黛青)", "#004d4d", "#1f2d2d", "#e8e8e3", "主文本 / 标题"],
          ["--dai-qing-light", "#006666", "#4a5c5c", "#a8b0ac", "次要文本"],
          ["--xuan-zhi (宣纸)", "#fbfaf5", "#fbfaf5", "#14181a", "页面背景"],
          ["--xuan-zhi-dark", "#e8e4c9", "#f4f1e8", "#1c2225", "卡片背景"],
          ["--hu-po-jin (琥珀金)", "#d4af37", "#c9a14a", "#c9a14a", "强调色 / 金色"],
          ["红色系 (合参)", "#9c3d54", "#b24a63", "#b24a63", "三术合参卡片"],
        ],
        [1700, 1700, 1700, 1700, 2226],
      ),
      para(""),
      para("建议实施方案：御笔 CSS 色板全面迁移至宣纸/黛青/琥珀金体系，详见第六节。"),

      h2("2.2 字体系统"),
      para("qingnang.cc 全站标题使用 font-serif (Noto Serif SC + 宋体)，正文使用 font-sans (Noto Sans SC)。字体层级清晰，古籍韵味统一。"),
      para("御笔当前混用 SF Pro / Noto Sans / Noto Serif，缺乏系统字体层级。建议在 :root 建立独立字体变量。"),

      h2("2.3 组件命名体系"),
      para("qingnang.cc 拥有 .qn- 前缀完整组件体系，设计语言高度一致。御笔类名混乱（card / btn / ink-nav / subtabs），缺乏统一命名空间。"),
      para(""),
      // 4-col → 2256 each
      makeTable(
        ["组件", "qingnang 类名", "御笔当前", "建议"],
        [
          ["按钮", ".qn-btn --primary / --amber", ".btn .btn-primary", ".yb-btn --primary / --gold"],
          ["卡片", ".qn-card --interactive", ".card", ".yb-card --hover"],
          ["表单域", ".qn-field __head / __label", ".field-wrap / .field", ".yb-field"],
          ["导航栏", ".qn-navbar --scrolled", ".ink-nav", ".yb-navbar"],
          ["印章", ".qn-seal", "无", "新增 .yb-seal"],
          ["分隔线", ".divider-ink", "无", "新增 .divider-ink"],
        ],
        [1600, 3200, 2200, 2026],
      ),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 三、动画与交互特效 ──
    portraitSection([
      heading("三、动画与交互特效"),
      para("qingnang.cc 内置 27+ CSS 关键帧动画。御笔当前仅有 rotate / pulse / fadeIn / scaleIn 4 个，远不足以支撑古籍美学交互深度。"),
      para(""),

      h2("3.1 高频核心动画（建议优先实现）"),
      // 4-col → 1506 + 2000 + 3000 + 1500 = 8006 → recalc: 1500+2500+2500+1500=8000, add 1026 to last = 9026
      makeTable(
        ["动画名", "触发场景", "技术参数", "优先级"],
        [
          ["glow-breathe", "Logo 呼吸发光", "drop-shadow + text-shadow 3s", "P0"],
          ["ink-spread", "水墨扩散效果", "scale(0→2.5) + blur 2.5s", "P0"],
          ["coin-flip", "六爻硬币翻转", "rotateY(0→720deg) 1.2s", "P0"],
          ["foil-sheen", "金色箔片流光", "background-position 偏移 13s", "P0"],
          ["btn-sheen-sweep", "按钮光泽扫过", "skew + translate 4.8s", "P1"],
          ["blink-cursor", "打字光标闪烁", "step-end 0.8s", "P1"],
          ["pulse-lamp", "指示灯脉冲", "box-shadow 2.4s", "P1"],
          ["glyph-float", "符文上浮消散", "translateY + opacity 10s", "P2"],
          ["trinity-flow", "三连线流动", "stroke-dashoffset 1.8s", "P2"],
          ["hecan-pulse", "合参完成脉冲", "scale(1→1.035) 1.2s", "P2"],
        ],
        [1500, 2262, 3262, 2002],
      ),
      para(""),

      h2("3.2 Web 特效组件"),
      // 3-col → 2200 + 3400 + 3426
      makeTable(
        ["特效组件", "技术实现", "适用御笔页面"],
        [
          [".gold-foil-text (金箔文字)", "background-clip: text + 3 层渐变 + 动画", "页首标题 / 八字日主显示"],
          [".ink-border (水墨描边)", "::before 伪元素 + mask-composite", "卡片框 / 按钮边框"],
          [".spotlight-card (聚光灯)", "::after radial-gradient 跟随鼠标 mousemove", "功能入口卡片"],
          [".divider-ink (水墨分割线)", "三色渐变 gradient", "section 分隔"],
          [".yb-seal (古印章)", "红色底 + inset box-shadow", "「御笔」品牌标识"],
          [".marquee (典籍滚动)", "translateX(-50%) 无限 + 渐变遮罩", "首页 banner"],
        ],
        [2200, 3426, 3400],
      ),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 四、功能覆盖面对比 ── LANDSCAPE
    landscapeSection([
      heading("四、功能覆盖面对比"),
      para("此页面使用横向排版以完整展示 4 列对照表格。"),
      para(""),
      // In landscape, content width = 16838 - 2880 = 13958
      makeTable(
        ["功能", "qingnang.cc", "御笔当前", "差距"],
        [
          ["八字排盘", "有（免费）", "有", "持平"],
          ["八字详批", "有（付费 + RAG 古籍溯源）", "有（AI 无溯源）", "缺 RAG 溯源"],
          ["八字合盘", "有（免费）", "有", "持平"],
          ["紫微斗数", "有（免费）", "无", "缺核心术数"],
          ["七政四余", "有（免费）", "无", "缺"],
          ["三术合参", "有（旗舰）", "无", "缺旗舰功能"],
          ["六爻起卦", "有", "有（含梅花易数）", "持平"],
          ["奇门遁甲", "有（免费）", "无", "缺"],
          ["大六壬", "有（免费）", "无", "缺"],
          ["每日时令", "有（免费）", "无", "高优先补充"],
          ["风水分析", "无", "有（户型图 + 位置）", "独有优势"],
          ["藏经阁 Wiki", "有", "无", "缺内容功能"],
          ["百宝袋 Toolkit", "有", "无", "缺"],
          ["主题切换", "3 套", "1 套", "缺"],
          ["PWA 支持", "完整", "无", "缺"],
          ["双人格 AI 模式", "有（博导/老友）", "无", "缺差异化"],
          ["按次计费", "有（赠 50 灵签）", "免费", "缺商业模式"],
        ],
        [2200, 4000, 4000, 3758],
      ),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 五、功能性对标优化方案 ──
    portraitSection([
      heading("五、功能性对标优化方案"),

      h2("5.1 每日时令（P1，工作量 3 天，ROI ★★★）"),
      para("零成本高留存功能。利用已有的 lunar-typescript 库和 ganzhi.ts 中的节气表，80% 逻辑现成。展示当日干支、节气、宜忌、五行日主颜色指示。与新用户互动的每日入口。"),

      h2("5.2 RAG 古籍锚定（P1，工作量 5 天，ROI ★★★）"),
      para("这是 qingnang.cc 最核心的差异化竞争力——每一句 AI 解读都引用《滴天髓》《三命通会》《增删卜易》等古籍原文并标注出处。"),
      para("技术方案：把现有 duanyu.ts（1494行 64卦×18维）和 zhantiduans.ts 的断语库用 embedding 向量化，在 AI prompt 中动态注入最相关的古籍片段。可用本地 text-to-vector + 余弦相似度，无需外部向量数据库。"),

      h2("5.3 紫微斗数（P1，工作量 7 天，ROI ★★★）"),
      para("覆盖十二宫排盘(命宫→父母宫)、14颗主星(紫微系+天府系)、辅星、四化。需要新建算法模块。对齐 qingnang 的免费排盘策略。"),

      h2("5.4 双人格 AI 模式（P2，工作量 3 天，ROI ★★）"),
      para("同一张盘可选「博导模式」或「老友模式」。博导：引经据典、逻辑严密；老友：风趣直白、接地气比喻。实现：同一个 AI prompt 架构，改 system.message 的 tone 参数。"),

      h2("5.5 按次计费系统（P2，工作量 5 天，ROI ★★★）"),
      para("参考 qingnang「注册赠 50 灵签，按次计费、无订阅」模式。需要微信支付集成 + 用户余额管理 + 计费中间件。"),

      h2("5.6 SEO + PWA（P0，工作量 2 天，ROI ★★★）"),
      para("添加完整 Open Graph / Twitter Card / JSON-LD / 百度验证 meta 标签；manifest.webmanifest + Service Worker 离线缓存；移动浏览器添加至桌面提示。"),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 六、视觉/交互/动效优化 ──
    portraitSection([
      heading("六、视觉 / 交互 / 动效优化方案"),

      h2("6.1 CSS 色板全面替换"),
      para("从 Apple-style HSL 蓝白过渡到宣纸/黛青/琥珀金古籍配色："),
      para(""),
      // 4-col → 2256 each
      makeTable(
        ["CSS 变量", "当前值", "新值", "色名"],
        [
          ["--background", "0 0% 100% (白)", "#fbfaf5", "宣纸"],
          ["--foreground", "0 0% 9% (近黑)", "#004d4d", "黛青"],
          ["--accent", "211 100% 50% (蓝)", "#d4af37", "琥珀金"],
          ["--muted", "0 0% 96% (浅灰)", "#f4f1e8", "浅宣"],
          ["--border", "0 0% 91%", "rgba(0,0,0,0.06)", "淡墨"],
          ["--success", "141 72% 42% (绿)", "#2d6a4f", "苍翠"],
          ["--danger", "358 75% 52% (红)", "#9c3d54", "朱砂"],
        ],
        [2200, 2800, 2000, 2026],
      ),
      para(""),

      h2("6.2 动画扩展（8 个核心关键帧）"),
      para("全部定义在 src/index.css，组件通过 Tailwind 类或内联 animation 引用。每个动画 5-15 行 CSS："),
      bullet("glow-breathe — Logo 呼吸发光 (drop-shadow + text-shadow, 3s)"),
      bullet("ink-spread — 墨水扩散 (scale + blur, 2.5s)"),
      bullet("coin-flip — 六爻硬币 (rotateY 720deg, 1.2s)"),
      bullet("foil-sheen — 金箔流光 (background-position, 13s)"),
      bullet("btn-sheen — 按钮扫光 (skew + translate, 4.8s)"),
      bullet("blink-cursor — 打字光标 (step-end, 0.8s)"),
      bullet("pulse-lamp — 指示灯 (box-shadow, 2.4s)"),
      bullet("glyph-float — 符文上浮 (translateY + opacity, 10s)"),

      h2("6.3 组件特效（6 个亮点）"),
      bullet(".gold-foil-text — 金箔文字，用于八字日主和页首标题"),
      bullet(".ink-border — 水墨描边，用于卡片和按钮"),
      bullet(".spotlight-card — 聚光灯跟随鼠标，用于功能入口"),
      bullet(".divider-ink — 水墨三色分割线"),
      bullet(".yb-seal — 古印章组件，用于品牌标识"),
      bullet(".marquee — 典籍滚动字幕，用于首页 banner"),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 七、技术债务清理 ──
    portraitSection([
      heading("七、技术债务清理"),
      para(""),
      // 3-col → 2000 + 4000 + 3026
      makeTable(
        ["项目", "当前状态", "改进目标"],
        [
          ["CSS 文件", "1565 行单文件 + 大量内联 style", "拆分 design tokens → tokens.css"],
          ["字体引用", "SF Pro / Noto Sans / Serif 混用", "统一 font-serif / font-sans 类名"],
          ["Canvas 组件色值", "写死的 '#E0DDD5' / '#2C2C2C'", "全面支持 CSS 变量动态配色"],
          ["暗色/主题切换", "仅 CSS 变量预备，无触发机制", "添加主题切换按钮 + 3 套主题"],
          ["Vite chunk", "单个 1.4MB JS bundle", "添加 manualChunks 代码分割"],
          ["PWA", "无 manifest / SW / install", "添加完整 PWA 支持"],
          ["IndexedDB 同步", "补丁式修复", "重构为统一 sync 层"],
        ],
        [2200, 3400, 3426],
      ),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 八、实施优先级矩阵 ── LANDSCAPE
    landscapeSection([
      heading("八、实施优先级矩阵"),
      para("此页面使用横向排版以完整展示 5 列矩阵。"),
      para(""),
      makeTable(
        ["优先级", "项目", "工作量", "ROI", "依赖"],
        [
          ["P0 立即", "SEO + PWA 支持", "2 天", "★★★", "无"],
          ["P0 立即", "CSS 色板 + 字体替换", "3 天", "★★★", "无"],
          ["P0 立即", "动画关键帧 8 个", "2 天", "★★★", "无"],
          ["P0 立即", "组件特效 4 个", "2 天", "★★★", "无"],
          ["P1 高优先", "每日时令 (黄历)", "3 天", "★★★", "lunar-typescript"],
          ["P1 高优先", "RAG 古籍锚定", "5 天", "★★★", "duanyu.ts embedding"],
          ["P1 高优先", "紫微斗数", "7 天", "★★★", "无"],
          ["P2 中优先", "双人格 AI 模式", "3 天", "★★", "AI prompt 调整"],
          ["P2 中优先", "按次计费 + 微信支付", "5 天", "★★★", "微信支付商户号"],
          ["P2 中优先", "3 套主题切换", "2 天", "★★", "CSS 变量已就绪"],
          ["P3 低优先", "奇门/大六壬/七政", "22 天", "★★", "需新建大量算法"],
        ],
        [1300, 3400, 1600, 1600, 2626],
      ),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 九、关键文件清单 ──
    portraitSection([
      heading("九、关键文件清单"),
      para("以下文件需要在 P0 阶段修改或新建："),
      para(""),
      h2("需重写 (P0)"),
      bullet("src/index.css — 色板 / 字体 / 动画全量替换"),
      bullet("tailwind.config.js — 对齐新色板"),
      bullet("src/App.tsx — 添加主题切换 / PWA manifest"),
      bullet("src/components/layout/TopNav.tsx — 导航栏古籍风适配"),
      bullet("src/components/ui/Card / Button / Badge — 样式适配新色板"),

      h2("需新建 (P0-P1)"),
      bullet("src/styles/tokens.css — 设计 token 独立文件"),
      bullet("public/manifest.webmanifest — PWA 清单"),
      bullet("public/sw.js — Service Worker"),
      bullet("src/features/daily/DailyPage.tsx — 每日时令页"),
      bullet("src/utils/rag.ts — RAG 检索工具函数"),
      bullet("src/features/bazi/BaziPersonaToggle.tsx — 双人格切换组件"),
      bullet("src/features/ziwei/ — 紫微斗数模块"),

      h2("可复用资源（已存在，无需改动）"),
      bullet("src/utils/duanyu.ts (1494行) — 断语库，RAG 的文本源"),
      bullet("src/utils/zhantiduans.ts — 占题断语库"),
      bullet("src/utils/ganzhi.ts — 干支/节气/四柱计算"),
      bullet("lunar-typescript — 农历转换核心库"),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 十、同业案例参考 ──
    portraitSection([
      heading("十、同业案例参考"),

      h2("10.1 Aura AI — AI 五行命盘"),
      para("许志豪 2026 年作品，Vite 8 + React 19 + Tailwind v4 + Anthropic SDK，4 天从 idea 到 Vercel 上线。"),
      bullet("五行 runtime CSS 变量：金/木/水/火/土整页 accent color 即时切换，呼应命盘五行本质"),
      bullet("Canvas 2D 水墨流场粒子：由 Claude 共写，未使用 framer-motion/three.js，从零生成水墨游丝动画"),
      bullet("Claude Design 做整体风格 prototype，古典美學 + 現代互動 + 結構化 AI 輸出三者同时成立"),
      bullet("客户端纯函数日干推算 (Julian Day Number → 60 甲子循环)，不依赖后端"),
      bullet("AI 结构化输出 (JSON output + prompt cache 降 token 成本)，繁体/英文双语支持"),

      h2("10.2 问卜 AI (wenbu.net)"),
      para("Vue 3 + Element Plus + ECharts + Spring Boot + MySQL。前后端分离，WebSocket 实时 AI 对话。"),
      bullet("ECharts 绘制八字干支图、十神关系图、九宫格局可视化"),
      bullet("支持 DeepSeek / ChatGPT 多模型切换"),
      bullet("完整的 SaaS 计费与用户体系"),

      h2("10.3 对御笔的直接启发"),
      para("水墨 Canvas 粒子动画和五行 CSS 变量即时换肤是御笔可以实现的最具视觉冲击力的特性。Canvas 2D 动画不需要 three.js——仅用原生 Canvas API + requestAnimationFrame 即可实现流动的墨水粒子效果。建议在 P0 的「组件特效」中优先实现金箔文字和水墨描边，在 P1 的 Canvas 扩展中实现水墨流场背景。"),
      new Paragraph({ children: [new PageBreak()] }),
    ]),

    // ── 十一、验证指标 ──
    portraitSection([
      heading("十一、验证指标"),
      para(""),
      // 4-col → 2200 + 2200 + 2200 + 2426
      makeTable(
        ["指标", "当前", "目标", "测量方式"],
        [
          ["Lighthouse 评分", "~70", ">90", "Chrome DevTools Audit"],
          ["PWA 安装可用", "否", "是", "移动端 → 添加到桌面"],
          ["动画关键帧数", "4", "12+", "grep @keyframes index.css"],
          ["主题数", "1", "3", "设置 → 主题切换"],
          ["Open Graph 标签", "无", "完整", "opengraph.xyz 检测"],
          ["首页加载时间 (3G)", "3-5s", "<2s", "WebPageTest"],
          ["SEO meta tags", "仅 title", "完整 + 百度验证", "查看页面源码"],
          ["术数覆盖数", "4 种", "6 种", "功能导航栏计数"],
        ],
        [2000, 2000, 2000, 3026],
      ),
      para(""),

      // End
      new Paragraph({ spacing: { before: 600 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 6, color: "D4AF37", space: 12 } }, spacing: { before: 400 },
        children: [new TextRun({ text: "— 全文完 —", font: "Noto Serif SC", size: 22, color: "999999", italics: true })] }),
    ]),
  ],
});

const buf = await Packer.toBuffer(doc);
const outPath = "/Users/camellia/Desktop/Code/CC/yubi-yixue/御笔易学_qingnangcc对标分析优化方案.docx";
fs.writeFileSync(outPath, buf);
console.log("✅ Word 文档已生成:", outPath);
console.log("   大小:", (buf.byteLength / 1024).toFixed(0), "KB");
