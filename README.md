# 御笔易学

> 传统术数的在线平台 —— 八字排盘 · 双人合盘 · 风水分析 · 六爻梅花 · 识人术 · 神煞 · 万年历

**规则引擎先行，AI 叙事随后。** 所有命理结论由独立的算法引擎算出，AI 只负责把它讲成人话。
引擎不依赖 AI，AI 也不参与判定——所以结论有数据锚点，不是凭空生成的。

线上站点：<https://yubiyixue.xyz>

---

## 板块

| 板块 | 做什么 |
|------|--------|
| **八字排盘** | 四柱、十神、藏干、旺衰强弱、喜用神忌神、刑冲合害、神煞、大运流年，附 AI 深度解读 |
| **双人合盘** | 双方八字逐柱对比、五行能量、性格/健康/事业/家庭/大运七个维度，三维评分 + AI 合盘解读 |
| **风水分析** | 上传户型图或描述楼盘位置，九宫方位、形煞识别、化解方案，附 AI 评估 |
| **算卦占卜** | 六爻纳甲（《增删卜易》体系）与梅花易数（邵雍体系），卦象推导 + 应期推算 + AI 断卦 |
| **识人术** | 四象三垣胎息体系：纳音四段取象、尊卑生克链、三垣禀赋、胎息元神、人生轨迹与大运流年 |
| **神煞速查** | 按柱位列出神煞并逐条释义，附 22 条神煞词典 |
| **万年历** | 公历农历对照、当日干支、节气、宜忌 |
| **我的** | 历史记录汇总（本地优先，登录后跨设备同步） |

---

## 架构

三层，边界清楚：

```
① 引擎层   src/utils/*.ts          纯计算，不依赖 AI，可单独跑
              ↓
② 报告层   src/report/ + *Spec.tsx  章节结构与呈现，屏幕 / 打印 / Word 三处同源
              ↓
③ AI 层     server/services/        DeepSeek 撰写叙事，服务端代理，密钥不出服务端
```

**报告层是这套代码里最值得先看懂的一块。** 每个板块有一份 `ReportSpec`——纯数据地描述
「这份报告有哪些章节、什么顺序、什么标题」。呈现交给唯一的 `ReportView`，
序号 / 锚点 / 目录 / 折叠 / AI 承载只实现一次。由此保证：

- 「有哪些章节」由 `resolveChapters()` **唯一决定**，屏幕、打印、Word 走的是同一个函数
- AI 章节在类型上**不允许携带正文**（`AiChapter.body?: never`）——想往结构里塞文案会编译不过
- 打印样式集中在 `src/report/print.css`，折叠的章节在纸上会被完整还原

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 · TypeScript · Vite 6 · Tailwind CSS 3 |
| 后端 | Express 4（ESM）· Node.js 20+ |
| 数据库 | SQLite（better-sqlite3，WAL 模式） |
| 本地存储 | IndexedDB（未登录可用，登录后同步） |
| 历法 | `lunar-typescript` —— **干支、节气、晚子时的唯一权威**，不自行实现 |
| AI | DeepSeek（`deepseek-flash`）—— 全站唯一上游，文本与风水视觉共用 |
| 认证 | JWT + bcryptjs |
| 字体 | Noto Serif SC（标题）· Noto Sans SC（正文） |
| 配色 | 宣纸底 · 黛青 · 琥珀金 |

---

## 快速开始

```bash
npm install
cp .env.example .env      # 填入 DEEPSEEK_API_KEY 与 JWT_SECRET
npm run dev               # Express:3002 + Vite:5173 并发
```

打开 <http://localhost:5173>。

---

## 项目结构

```
├── server/                      Express 后端
│   ├── index.js                 入口 + 路由挂载 + 中间件顺序
│   ├── db.js                    SQLite 建表与 Safe Migration
│   ├── middleware/              JWT 鉴权 · 设备标识 · 限流 · 错误helper
│   ├── routes/                  9 个路由模块（auth/bazi/compat/divination/renshi/analyze/records/settings/ai）
│   └── services/                AI 上游配置与调用 · 风水引擎 · 九宫 · 评分
│
├── src/
│   ├── App.tsx                  Tab 路由
│   ├── features/                各板块
│   │   ├── bazi/ compat/ fengshui/ renshi/
│   │   ├── divination/          六爻 + 梅花
│   │   ├── almanac/ shensha/ me/
│   │   └── */[name]Spec.tsx     各板块的报告章节编排
│   ├── report/                  ⭐ 报告骨架（唯一呈现层）
│   │   ├── types.ts             ReportSpec / ReportChapter / resolveChapters
│   │   ├── ReportView.tsx       序号 · 锚点 · 目录 · 折叠 · AI 承载
│   │   ├── docModel.ts          文档投影模型（Word 用）
│   │   ├── exportDocx.ts        Word 导出（由同一份 spec 派生）
│   │   ├── report.css           报告级样式
│   │   └── print.css            打印样式（全站唯一）
│   ├── components/              UI 组件与可视化
│   └── utils/                   引擎层
│       ├── bazi.ts wangshuai.ts yongshen.ts    排盘 · 旺衰 · 喜用神
│       ├── shensha.ts chonghe.ts liuqin.ts     神煞 · 刑冲合害 · 六亲
│       ├── sixiang.ts trajectory.ts            识人 · 人生轨迹
│       ├── compatibility.ts                    合盘评分
│       ├── solarTime.ts                        真太阳时
│       └── ai.ts                               提示词与客户端调用
│
└── wiki/                        项目文档（架构总览 / 命理引擎规范 / 验证方法 / 问题修复记录）
```

---

## 两条硬约定

**1. 全站排盘按真太阳时校准**

出生时间须按出生地经度与当日均时差校正后再定时辰与日柱，这是命理界的共识而非可选项。
八字、合盘、识人、神煞走同一个入口（`calculateBazi`），不允许任何板块另起一套口径。

**2. 历法只认 `lunar-typescript`**

干支、节气交节时刻、晚子时换日一律取自该库。历史上手写的干支表与近似节气表都引入过系统性错误，
wiki 里有记录——不要新增手写历法表。

---

## 命令

```bash
npm run dev          # 开发（Express + Vite 并发）
npm run build        # 生产构建
npm run typecheck    # TypeScript 类型检查
npm start            # 仅启动 Express
npm run db:migrate   # 数据库迁移
```

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3002` |
| `DEEPSEEK_API_KEY` | DeepSeek API Key（必需） | — |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 模型名（官方当前支持 `deepseek-flash` / `deepseek-v4-pro`） | `deepseek-flash` |
| `JWT_SECRET` | JWT 签名密钥（生产环境缺失则拒绝启动） | — |
| `NODE_ENV` | 运行模式 | — |
| `CORS_ORIGIN` | 允许的跨域来源（未设则用内置白名单） | — |

> AI 上游的配置只有一处来源：`server/services/ai-config.js`。改模型或换上游只动它。

---

## 部署

生产为 Nginx 静态服务 `dist/` + 反代 `/api` 到本机 3002 端口，应用由 pm2 常驻。

```bash
npm run build
pm2 restart yubi-yixue
```

---

## License

MIT
