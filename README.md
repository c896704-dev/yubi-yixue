# 御笔易学

> 八字命理 · 双人合盘 · 风水分析 · 算卦占卜 — 传统命理学的现代 Web 实现

## 简介

御笔易学是一个全栈中文命理学应用，覆盖四大传统领域：

- **八字排盘** — 输入出生信息，秒出四柱八字、十神格局、旺衰强弱、喜用神忌神、大运推演，AI 撰写 1200+ 字深度命理解析
- **双人合盘** — 双方八字对比，多维度评分（吸引力/稳定性/互补性），AI 1000+ 字合盘关系解读
- **风水分析** — 上传户型图或描述楼盘位置，九宫飞星分析 + 改进建议 + AI 评估
- **算卦占卜** — 六爻纳甲（《增删卜易》体系）和梅花易数（邵雍体系），两种方法可选，AI 按七步/九步经典流程专业断卦

核心算法引擎独立于 AI，确保命理结论有数据锚点而非凭空编造。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 · TypeScript · Vite 6 · Tailwind CSS 3 |
| 后端 | Express 4 · Node.js (ESM) |
| 数据库 | SQLite (better-sqlite3, WAL 模式) |
| 本地存储 | IndexedDB（离线可用 + 跨数据库迁移） |
| AI | DeepSeek API（主）· 通义千问（备） |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 字体 | system font stack（Apple HIG） |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 DEEPSEEK_API_KEY 和 JWT_SECRET

# 3. 启动开发环境（Express:3002 + Vite:5173）
npm run dev

# 4. 打开浏览器访问
open http://localhost:5173
```

## 项目结构

```
├── server/                 # Express 后端
│   ├── index.js            # 服务入口 + 路由挂载
│   ├── db.js               # SQLite 建表 + Safe Migration
│   ├── db-migrate.js       # 数据库迁移脚本
│   ├── middleware/          # JWT 认证 + 设备 ID 追踪
│   ├── routes/              # RESTful API (8 个路由模块)
│   └── services/            # 业务逻辑层
├── src/                    # React 前端
│   ├── App.tsx             # Tab 路由 + 响应式布局
│   ├── index.css           # Apple 风格设计系统（HSL + clamp）
│   ├── features/           # 功能模块 (bazi/compat/fengshui/divination)
│   ├── components/         # 通用 UI 组件（Button/Card/Modal 等）
│   ├── hooks/              # 自定义 React Hooks
│   ├── services/           # API 调用层（Axios + JWT 拦截器）
│   └── utils/              # 核心算法引擎 ⭐
│       ├── bazi.ts          #   八字排盘
│       ├── wangshuai.ts     #   旺衰判定（多维加权）
│       ├── yongshen.ts      #   喜用神推算
│       ├── shensha.ts       #   神煞计算
│       ├── chonghe.ts       #   刑冲合害分析
│       ├── compatibility.ts #   合盘评分引擎
│       ├── ganzhi.ts        #   干支计算
│       ├── solarTime.ts     #   真太阳时
│       ├── liuqin.ts        #   六亲关系
│       └── ai.ts            #   AI Prompt 模板 + 客户端
└── data/                   # 运行时数据
```

## AI 能力

系统采用 **规则引擎 + AI 润色** 的双层架构：

1. **规则引擎先行** — `src/utils/` 下的算法模块独立计算八字排盘、旺衰、喜用神、神煞、合盘分数等核心数据
2. **AI 叙事润色** — 基于规则引擎输出，AI 撰写有洞察、有温度的自然语言报告

AI 功能包括：

| 功能 | Prompt |
|------|--------|
| 八字深度解读 | 六大叙事段落、1200-1800 字、"一句话定性法"开篇 |
| 合盘关系分析 | 四大段落、"核心意象法"定调、1000-1500 字 |
| 六爻断卦 | 七步结构（用神→月建日辰→卦局→爻际→应期→综合断语） |
| 梅花易数 | 九步结构（体用→卦象演进→动爻精析→一体百用→专题断） |
| AI 问答 | 上下文感知面板，支持八字/合盘/风水/占卜多模式问答 |

## 算法亮点

- **真太阳时校正** — 含 35 城市经纬度数据库 + 自定义坐标，精准校准出生时辰
- **旺衰多维度综合判定** — 月令 + 根气 + 生助 + 三围生克 + 连锁惩罚 + 寒暖修正
- **喜用神四维加权** — 扶抑 + 调候 + 通关 + 病药
- **神煞上下文分析** — 带人格特质、人生场景的深度解读，非简单罗列
- **特殊格局识别** — 从格、专旺格、化气格自动判定
- **六爻纳甲体系** — 完整的地支配卦、六亲配置、世应定位、六神安位
- **梅花易数体系** — 起卦→体用生克→互卦→变卦→错卦→综卦→应期→一体百用交叉分析
- **合盘多维度评分** — 总分 + 吸引力 + 稳定性 + 互补性子维度

## 更多命令

```bash
npm run build          # 生产构建
npm run typecheck      # TypeScript 类型检查
npm start              # 仅启动 Express 后端
npm run db:migrate     # 运行数据库迁移
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3002` |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | — |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | DeepSeek 模型名 | `deepseek-v4-flash` |
| `DASHSCOPE_API_KEY` | 通义千问 API Key（备用） | — |
| `JWT_SECRET` | JWT 签名密钥 | — |

## License

MIT
