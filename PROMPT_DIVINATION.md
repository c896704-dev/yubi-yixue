# 算卦功能模块开发 Prompt

## 项目概览

项目 yubi-yixue（御笔易学）是 Vite + React 18 + TypeScript + Tailwind CSS 前端 + Express + SQLite (better-sqlite3) 后端。

### 已存在的核心基建

**前端：**
- React 18 + TypeScript + Vite
- Tailwind CSS（自定义 paper/brand/gold/positive/negative/water 色系，Noto Serif SC 衬线字体）
- 自定义 UI 组件：`src/components/ui/` 下有 Card、Button、Modal、Input、Select、Loading、Toast、Tabs、Empty、Badge、ErrorBoundary
- 布局组件：`src/components/layout/` 下 TopNav（顶部导航栏，含 tab 切换）、PageContainer
- AuthContext：`src/context/AuthContext.tsx`，提供 user、login、register、logout
- API 服务：`src/services/api.ts`（axios 封装，自动带 JWT token）
- IndexedDB 本地存储：`src/utils/db.ts`（saveRecord / getAllRecords / deleteRecord）
- AI 客户端：`src/utils/ai.ts`（调用 DeepSeek API，含 chat / generateBaziInsight / generateCompatibilityInsight 等函数）
- 路由机制：通过 TopNav 的 tab 切换，`src/App.tsx` 中 `Tab` 类型包含 `'bazi' | 'compat' | 'fengshui' | 'divination'`
- 特征模块结构：`src/features/{feature}/` 下放组件，`src/hooks/use{Feature}.ts` 放自定义 hook

**后端：**
- Express 服务端，端口 3002
- SQLite 数据库（`server/db.js`），已有 users 表、bazi_records 表等
- JWT 认证：`server/middleware/auth.js`（authMiddleware），`server/routes/auth.js`
- API 路由模式：`server/routes/{name}.js`，挂载在 `server/index.js`
- 已有 AI 服务：`server/services/ai-service.js`（调用 Qwen 模型）

**当前算卦状态：**
- TopNav 已有 `divination` tab，但 `disabled` 且显示"算卦功能即将上线，敬请期待"
- App.tsx 中 divination tab 渲染占位文案
- `Tab` 类型已包含 `'divination'`

---

## 需求总述

新增 **算卦 (Divination)** 功能模块，包含两个独立子模块：**六爻（Liuyao）** 和 **梅花易数（Meihua）**。导航上有统一的"算卦"入口 Tab，点击后进入算卦首页，用户可选择进入六爻或梅花易数。两个模块各自独立页面、独立交互流程。

**AI 模型：** DeepSeek-V4-Flash（用已有的 `src/utils/ai.ts` 中的 `chat()` 函数，但需更新 model 名为 `deepseek-v4-flash`，且需在 DeepSeek API 调用中兼容）

**历史记录：** 同时存储到前端 IndexedDB（用于快速加载、离线查看）和后端 SQLite（关联 user_id，登录后可跨设备查看）

---

## 七、古籍研究与卦象数据参考

> 以下内容基于《周易》《梅花易数》《增删卜易》《卜筮正宗》《易林补遗》五部经典古籍的全文阅读与分析总结。实现时必须严格遵循这些传统规则，**不得自行编造卦象算法或体用关系**。

### 7.1 八卦基础数据

来源：《梅花易数》卷一「周易卦数」「八卦象例」「八宫所属五行」，《增删卜易》「001、八卦」

| 卦名 | 卦画 | 卦数 | 五行 | 方位 | 象征 | 人物 | 身体 | 自然 |
|------|------|------|------|------|------|------|------|------|
| 乾 ☰ | 乾三连 ☰ | 1 | 金 | 西北 | 天 | 父 | 首 | 马 |
| 兑 ☱ | 兑上缺 ☱ | 2 | 金 | 西 | 泽 | 少女 | 口 | 羊 |
| 离 ☲ | 离中虚 ☲ | 3 | 火 | 南 | 火 | 中女 | 目 | 雉 |
| 震 ☳ | 震仰盂 ☳ | 4 | 木 | 东 | 雷 | 长男 | 足 | 龙 |
| 巽 ☴ | 巽下断 ☴ | 5 | 木 | 东南 | 风 | 长女 | 股 | 鸡 |
| 坎 ☵ | 坎中满 ☵ | 6 | 水 | 北 | 水 | 中男 | 耳 | 豕 |
| 艮 ☶ | 艮覆碗 ☶ | 7 | 土 | 东北 | 山 | 少男 | 手 | 狗 |
| 坤 ☷ | 坤六断 ☷ | 8 | 土 | 西南 | 地 | 母 | 腹 | 牛 |

**卦画口诀**（必须实现为注释引用）：乾三连（☰三横相连），坤六断（☷三横断开为六短），震仰盂（☳下实上虚如碗口朝上），艮覆碗（☶上实下虚如碗口朝下），离中虚（☲中间虚），坎中满（☵中间实），兑上缺（☱上方有缺口），巽下断（☴下方断开）

### 7.2 八宫六十四卦全表

来源：《增删卜易》「002、占卦法」末尾八宫六十四卦卦名

传统六爻用八宫分类法，每宫八卦，共六十四卦。**实现 hexagrams.ts 时必须按此八宫体系组织数据**：

**乾宫八卦（属金）：**
乾为天、天风姤、天山遁、天地否、风地观、山地剥、火地晋、火天大有

**坎宫八卦（属水）：**
坎为水、水泽节、水雷屯、水火既济、泽火革、雷火丰、地火明夷、地水师

**艮宫八卦（属土）：**
艮为山、山火贲、山天大畜、山泽损、火泽睽、天泽履、风泽中孚、风山渐

**震宫八卦（属木）：**
震为雷、雷地豫、雷水解、雷风恒、地风升、水风井、泽风大过、泽雷随

**巽宫八卦（属木）：**
巽为风、风天小畜、风火家人、风雷益、天雷无妄、火雷噬嗑、山雷颐、山风蛊

**离宫八卦（属火）：**
离为火、火山旅、火风鼎、火水未济、山水蒙、风水涣、天水讼、天火同人

**坤宫八卦（属土）：**
坤为地、地雷复、地泽临、地天泰、雷天大壮、泽天夬、水天需、水地比

**兑宫八卦（属金）：**
兑为泽、泽水困、泽地萃、泽山咸、水山蹇、地山谦、雷山小过、雷泽归妹

### 7.3 六十四卦数据详细要求

每卦在 hexagrams.ts 中的数据至少包含：
- `name`：卦名（如"乾为天"）
- `symbol`：卦画符号（上卦+下卦的二进制表示，如 0b111111）
- `upperTrigram` / `lowerTrigram`：上下卦名
- `palace`：所属宫（乾/坎/艮/震/巽/离/坤/兑）
- `palaceElement`：宫五行属性
- `judgment`：卦辞（现代中文，20-40字，从《周易》原文简化，如乾卦卦辞"元亨利贞"→"创始、通达、适宜、正固，四德俱全，大吉之象"）
- `meaning`：简要释义（60-100字现代中文解释，说明该卦的吉凶趋向和核心意象）
- `element`：该卦的五行属性（以所属宫为准）

**重要提示**：数据来源于以下在线古籍，可直接参考：
- 周易六十四卦原文与解释：https://chinesebooks.github.io/yijingshuji/zhouyi/
- 每个卦的详细页面 URL 模式：`https://chinesebooks.github.io/yijingshuji/zhouyi/{ID}.html`（如乾卦 2496，坤卦 2495，屯卦 2494，依次递减）

### 7.4 梅花易数核心方法（必须严格遵循）

来源：《梅花易数》卷一「象数易理篇」、卷二「体用生克篇」、卷三「断占总诀篇」

#### 7.4.1 数字取卦法

> 原文：「卦以八除，凡起卦不问数多少，即以此数作卦数，过八数即以八数递除。一八除不尽，再除二八，三八，直至除尽，以余数作卦。如得八数整，即坤卦，更不必除也。」
> 原文：「爻以六除，凡起动爻，以重卦总数除六，以余数作动爻。如不满六，止用此数为动爻，不必再除。」

规则：
- 取数 mod 8 → 卦（1乾2兑3离4震5巽6坎7艮0/8坤）
- 取数 mod 6 → 爻（1-6，余0为6）

#### 7.4.2 年月日时起卦法

> 原文：「年月日为上卦。年月日加时总数为下卦。又以年月日时总数取爻。」
> 子年1数，丑年2数…亥年12数；正月1…十二月12；初一日1…三十日30；子时1…亥时12

实现规则：
```
上卦 = (年数 + 月数 + 日数) % 8
下卦 = (年数 + 月数 + 日数 + 时数) % 8
动爻 = (年数 + 月数 + 日数 + 时数) % 6
```

#### 7.4.3 文字起卦法

> 原文：
> 「二字为两仪平分。以一字为上卦，一字为下卦。」
> 「三字为三才。以一字为上卦，二字为下卦。」
> 「四字为四象。平分上下为卦。」
> 「五字为五行。以二字为上卦，三字为下卦。」

笔画计算规则：按字数分：
- 1字：取该字笔画数 mod 8 为上卦，笔画数 mod 6 为动爻；若楷书可区分左右结构，左笔画为上卦，右笔画为下卦
- 2字：上卦=第一字笔画数 mod 8，下卦=第二字笔画数 mod 8
- 3字：上卦=第一字笔画数 mod 8，下卦=(第二字+第三字笔画数) mod 8
- 4字：平分，上卦=(字1+字2)笔画数 mod 8，下卦=(字3+字4)笔画数 mod 8
- 5-11字：按原文比例分配
- 11字以上：平分上下

#### 7.4.4 互卦取法

> 原文：「互卦只用八卦，不必取六十四卦名。互卦以重卦去了初爻及第六爻，以中间四爻分作两卦，看得何卦。」
> 又云：「乾坤无互，互其变卦。」

规则：去掉本卦的初爻（第1爻）和上爻（第6爻），用中间4爻（2-5爻）：
- 下互卦 = 取本卦 2、3、4爻组成（2爻为初爻，3爻为中爻，4爻为上爻）
- 上互卦 = 取本卦 3、4、5爻组成（3爻为初爻，4爻为中爻，5爻为上爻）

#### 7.4.5 体用生克理论

来源：《梅花易数》卷二「体用生克篇之一」、「体用总诀」

> 核心原文：
> 「体用云者，体卦为主，用卦为事，互卦为事之中间，刻应变卦为事之终。」
> 「体用之间，比和则吉。」
> 「体克用，诸事吉；用克体，诸事凶。体生用，有耗失之患；用生体，有进益之喜。体用比和，则百事顺遂。」
> 「体宜受用卦之生，用宜见卦体之克。」
> 「体盛则吉，体衰则凶。」
> 「体卦宜乘旺，克体之卦宜衰。」

**体用判断规则**：
1. **体卦**：本卦中**无动爻**的那一卦（上卦或下卦）。即：动爻在上卦则下卦为体，动爻在下卦则上卦为体
2. **用卦**：本卦中**有动爻**的那一卦
3. **体用关系**（按五行生克）：
   - **体克用**：我克制事→吉，但需费力
   - **用克体**：事克制我→凶，阻力大
   - **体生用**：我生事→泄气，有损耗
   - **用生体**：事生我→大吉，有进益
   - **体用比和**：五行相同→最吉，百事顺遂
4. **卦气旺衰**：
   - 震、巽（木）旺于春，衰于秋
   - 离（火）旺于夏，衰于冬
   - 乾、兑（金）旺于秋，衰于夏
   - 坎（水）旺于冬，衰于四季末
   - 坤、艮（土）旺于四季末（辰戌丑未月），衰于春

### 7.5 六爻纳甲核心概念

来源：《增删卜易》第001-009章、《卜筮正宗》第01-18章、《易林补遗》145章

#### 7.5.1 传统摇卦法

> 原文（《增删卜易》「002、占卦法」）：
> 「一个背，两个字，称作'单'，画作'′'为少阳。」
> 「两个背，一个字，称作'拆'，画作'″'为少阴。」
> 「三个背，没有字，称作'重'，画作'○'为老阳，是变爻。」
> 「三个字，没有背，称作'交'，画作'×'为老阴，是变爻。」

摇卦六次，第一次为初爻（最下），第六次为上爻（最上）。
有○或×标记的为变爻，阳动变阴，阴动变阳，生成变卦。

**实现规则**（三枚铜钱模拟）：
```
0 - 字（阴面，值0）
1 - 背（阳面，值1）

三个值之和 = 0（字字字）→ 老阴（×），动爻
三个值之和 = 1（字字背）→ 少阴（- -）
三个值之和 = 2（字背背）→ 少阳（—）
三个值之和 = 3（背背背）→ 老阳（○），动爻
```

#### 7.5.2 六亲规则

来源：《增删卜易》「005、六亲歌」

> 原文：「生我者为父母，我生者为子孙，我克者为妻财，克我者为官鬼，比和者为兄弟。」

六亲以卦的宫位五行（"我"）为基准：
- **乾兑金宫**：金兄土父，木财火鬼，水子
- **坎宫水**：水兄木子，金父火财，土鬼
- **坤艮土宫**：土兄火父，木鬼水财，金子
- **离宫火**：火兄土子，木父水鬼，金财
- **震巽木宫**：木兄水父，金鬼火子，土财

（注：本 prompt 要求的前端算卦模块不需要实现完整的纳甲六亲装卦，但 AI 解读的系统提示词中应包含这些知识，使 AI 能够运用六亲关系进行专业解读）

#### 7.5.3 用神分类

来源：《增删卜易》「008、用神」

**父母爻**：占父母、祖辈、师长、房屋、舟车、衣服、文书、雨具、契约
**官鬼爻**：占功名、官运、丈夫（妻占夫）、鬼神、贼盗
**兄弟爻**：占兄弟姐妹、同辈朋友；占财物为劫财之神
**妻财爻**：占妻妾、钱财、珠宝、货物、仆役
**子孙爻**：占儿女、晚辈、学生、医药、僧道、六畜；为福德之神、制鬼之神

（AI 解读提示词中要包含用神知识，让 AI 根据用户所问之事判断取何用神）

### 7.6 古籍参考链接

可在开发过程中查阅以下在线资源获取完整数据和原文参考：

| 古籍 | 在线阅读地址 | 说明 |
|------|-------------|------|
| 周易六十四卦 | https://chinesebooks.github.io/yijingshuji/zhouyi/ | 64卦原文+注释+译文 |
| 梅花易数 | https://chinesebooks.github.io/yijingshuji/meihuayishu/ | 邵雍著，3卷完整 |
| 增删卜易 | https://chinesebooks.github.io/yijingshuji/zengshanbuyi/ | 野鹤老人著，140章 |
| 卜筮正宗 | https://chinesebooks.github.io/yijingshuji/bushizhengzong/ | 王洪绪辑，54章含18问答 |
| 易林补遗 | https://ctext.org/wiki.pl?if=gb&chapter=783680&remap=gb | 张世宝著，145章 |

---

## 详细需求

### 一、导航与路由

1. **启用 TopNav 的算卦 tab**：移除 `disabled` 和 `opacity-50 cursor-not-allowed`
2. **新增算卦首页组件**：`src/features/divination/DivinationPage.tsx`，显示两个卡片入口：
   - 六爻（Liuyao）：点击进入 LiuyaoPage
   - 梅花易数（Meihua）：点击进入 MeihuaPage
3. **在 App.tsx 中**：`tab === 'divination'` 时渲染 `DivinationPage`
4. **DivinationPage 内状态管理**：用 `useState<'hub' | 'liuyao' | 'meihua'>('hub')` 控制显示哪个页面

### 二、六爻（Liuyao）

**页面：** `src/features/divination/liuyao/LiuyaoPage.tsx`

#### 2.1 三种起卦方式

1. **摇卦（手动摇卦）**
   - 页面显示一个动画摇卦区：一个铜钱或卦筒的视觉元素
   - 用户每次点击"摇卦"按钮，系统用 3 次随机数（0/1 模拟铜钱正反面）生成一爻
   - 共需点击 6 次，从下往上（初爻→上爻）依次生成
   - 每次摇完显示当前爻的阴阳（⚊ 为阳、⚋ 为阴）和变爻标记（老阳○/老阴×）
   - 规则：三个正面（1,1,1）→ 老阳（变爻○）；三个反面（0,0,0）→ 老阴（变爻×）；两正一反 → 少阳（⚊）；两反一正 → 少阴（⚋）
   - 6 次完成后自动显示本卦、变爻位置、变卦

2. **数字起卦**
   - 用户输入 3 个数字（自然数，0-999）
   - 第一个数 ÷ 8 的余数 → 上卦（1乾2兑3离4震5巽6坎7艮8坤，余0为8）
   - 第二个数 ÷ 8 的余数 → 下卦
   - 第三个数 ÷ 6 的余数 → 变爻位置（余0为6，表示第6爻动）
   - 若无第三个数则默认无变爻

3. **随机起卦（一键）**
   - 自动随机生成完整六爻卦
   - 自动随机决定变爻位置（0-6 个变爻）
   - 一键完成

#### 2.2 六爻显示

- 显示 **本卦**（主卦）：从下到上 6 爻，用 CSS 绘制传统卦画（⚊ 阳爻 / ⚋ 阴爻）
- 显示 **卦名**（如"乾为天"、"火风鼎"）和 **卦象**（如上乾下离）
- 如果存在变爻：
  - 在卦画上高亮标记变爻位置（○ / × 符号）
  - 显示 **变卦**（变爻改变后的新卦）
  - 显示动爻的爻辞简要提示（如果本地有数据）
- 显示该卦对应的 **五行属性**（如乾兑金、离火、震巽木、坎水、艮坤土）

#### 2.3 卦象数据

在 `src/features/divination/utils/` 下创建：
- **trigrams.ts**：八卦数据（名称、卦画符号、五行、方位、数字、象征等）
- **hexagrams.ts**：64 卦数据（卦名、上下卦组合、卦辞、象辞、简要含义等）—— 不需要完整的古文爻辞，只需要简短的现代解释，每卦100字以内即可

以上数据用本地常量写死，无需调用 API。

#### 2.4 AI 解读

- 用户点击"AI 解卦"按钮
- 调用 `src/utils/ai.ts` 中的 `chat()` 函数（或新建 `generateLiuyaoInterpretation()` 函数）
- 系统提示词需要包含：六爻生成的完整卦象数据（本卦、变卦、变爻位置、五行关系等）、用户所问之事（允许用户输入一个问题）
- AI 回答风格：沿用已有"御笔判官"风格，半文言半现代
- 在结果区显示 AI 解读（支持 Markdown 渲染，用项目中已有的 react-markdown + remark-gfm）
- 加载中显示 Loading 组件，出错显示错误信息

#### 2.5 交互流程

```
LiuyaoPage
├── 起卦方式选择（Tab/按钮切换）：摇卦 | 数字 | 随机
│
├── [摇卦模式] 铜钱动画区 + 摇卦按钮（点击6次）
├── [数字模式] 3个数字输入框 + 起卦按钮
├── [随机模式] 一键起卦按钮
│
├── 结果显示区
│   ├── 本卦（卦画 + 卦名 + 卦象）
│   ├── 变爻标记（如有）
│   ├── 变卦（如有）
│   └── 五行属性
│
├── 问题输入区（文本输入框，可选，"你所问何事？"）
├── AI 解卦按钮
├── AI 解读结果区（Markdown卡片）
│
└── 底部按钮：重新起卦 / 保存记录
```

### 三、梅花易数（Meihua）

**页面：** `src/features/divination/meihua/MeihuaPage.tsx`

#### 3.1 三种起卦方式

1. **数字起卦**
   - 用户输入 3 个数字
   - 第一个数 ÷ 8 余数 → 上卦（同上 1乾~8坤）
   - 第二个数 ÷ 8 余数 → 下卦
   - 第三个数 ÷ 6 余数 → 动爻
   - 若无第三个数则默认为时间秒数

2. **时间起卦**
   - 自动取当前系统时间（年、月、日、时）
   - 农历转换：使用项目中已有的 `lunar-typescript` 库（`lunar-typescript` 在 package.json 中）将公历转为农历
   - 年数 + 月数 + 日数 ÷ 8 余数 → 上卦
   - 年数 + 月数 + 日数 + 时数 ÷ 8 余数 → 下卦
   - 年数 + 月数 + 日数 + 时数 ÷ 6 余数 → 动爻
   - 若 `lunar-typescript` 转换不方便，简化版：取当前年月日时分秒的数字之和计算

3. **文字起卦**
   - 用户输入中文文字（建议 2-4 字）
   - 计算每个字的笔画数（用预置的常用汉字笔画映射表，覆盖常见字即可，不常见的字用 Unicode 码点 mod 8 兜底）
   - 若 2 字：上卦 = 第一个字笔画数 ÷ 8 余数，下卦 = 第二个字笔画数 ÷ 8 余数
   - 若 3 字：上卦 = 第一个字笔画数 ÷ 8 余数，下卦 = 第二三个字笔画数和 ÷ 8 余数
   - 若 4+字：上卦 = 前两字笔画数和 ÷ 8，下卦 = 后两字笔画数和 ÷ 8
   - 动爻 = 总笔画数 ÷ 6 余数

#### 3.2 梅花易数显示

- **本卦**（原卦）：卦画 + 卦名 + 卦象
- **互卦**（交互卦）：取本卦 234 爻为下互卦、345 爻为上互卦，显示互卦的卦画和卦名
- **变卦**（变爻后的卦）：显示变卦的卦画和卦名
- **体用生克**：
  - 体卦（主卦中无动爻的那一卦）= 代表问卦者
  - 用卦（主卦中有动爻的那一卦）= 代表所问之事
  - 显示体用五行生克关系：体生用、用生体、体克用、用克体、体用比和
  - 简要解释体用关系对占卜结果的预示

#### 3.3 数据复用

复用六爻模块的 `trigrams.ts` 和 `hexagrams.ts` 数据。

#### 3.4 AI 解读

- 同六爻模式，用户点击"AI 解卦"调用 DeepSeek-V4-Flash
- 系统提示词需包含梅花易数完整卦象：本卦、互卦、变卦、体用关系、五行生克
- 回答风格一致

#### 3.5 交互流程

```
MeihuaPage
├── 起卦方式选择（Tab/按钮切换）：数字 | 时间 | 文字
│
├── [数字模式] 3个数字输入框 + 起卦按钮
├── [时间模式] "以当前时间起卦"按钮（显示当前时间）
├── [文字模式] 文字输入框 + 起卦按钮
│
├── 结果显示区
│   ├── 本卦（卦画 + 卦名 + 卦象）
│   ├── 互卦（卦画 + 卦名）
│   ├── 变卦（卦画 + 卦名）
│   ├── 体用关系（体卦 / 用卦 / 五行生克）
│   └── 简要断语（如"体克用，事可成但费力"）
│
├── 问题输入区（可选）
├── AI 解卦按钮
├── AI 解读结果区（Markdown卡片）
│
└── 底部按钮：重新起卦 / 保存记录
```

### 四、历史记录（双向存储）

#### 4.1 前端 IndexedDB

- 在 `src/utils/db.ts` 中新增函数：
  - `saveDivinationRecord(record: DivinationRecord)` 
  - `getAllDivinationRecords(): DivinationRecord[]`
  - `deleteDivinationRecord(id: string)`
  - `getDivinationRecordByType(type: 'liuyao' | 'meihua'): DivinationRecord[]`
- `DivinationRecord` 类型：
  ```ts
  interface DivinationRecord {
    id: string
    type: 'liuyao' | 'meihua'
    method: string       // 具体起卦方式
    question: string     // 用户所问问题
    hexagramData: object // 完整卦象数据
    aiInterpretation: string | null
    createdAt: number
    label: string        // 自动生成的标题
  }
  ```
- 在 `db.ts` 的 `openDB()` 中用新版本号打开数据库，`onupgradeneeded` 中创建 `divination_records` 存储

#### 4.2 后端 SQLite

- **数据库迁移**：在 `server/db.js` 的 `initDatabase()` 中新增表：
  ```sql
  CREATE TABLE IF NOT EXISTS divination_records (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('liuyao', 'meihua')),
    method TEXT NOT NULL,
    question TEXT,
    hexagram_data TEXT NOT NULL,
    ai_interpretation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_divination_user ON divination_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_divination_type ON divination_records(type);
  ```
- **新增 API 路由**：`server/routes/divination.js`
  - `POST /api/divination/records` — 保存记录（需 authMiddleware，从 req.userId 获取用户）
  - `GET /api/divination/records?type=liuyao` — 获取当前用户的记录列表
  - `DELETE /api/divination/records/:id` — 删除记录
- 在 `server/index.js` 中挂载路由：`app.use('/api/divination', divinationRouter)`

#### 4.3 前端同步逻辑

- 用户点击"保存记录"时：
  1. 先保存到 IndexedDB（保证离线可用）
  2. 如果用户已登录，同时 POST 到后端 API
- 进入算卦页面时：
  1. 从 IndexedDB 加载当前类型的历史记录
  2. 如果用户已登录，同时从后端 API 加载并合并（去重）
- 显示最近 10 条记录列表，点击可重新加载查看

### 五、样式与交互细节

1. **卦画绘制**：使用 CSS 或 SVG 绘制传统卦画
   - 阳爻（⚊）：一条实线 ━━━━━
   - 阴爻（⚋）：两条短线 ━━ ━━
   - 爻从下往上排列（初爻在最下）
   - 整体风格古朴，使用深褐色（#2C2C2C）和 paper 色系背景
2. **五行配色**：木绿色、火红色、土黄色、金白色、水蓝色（参考项目中已有的五行语义）
3. **整体风格**：延续项目现有的"御笔易学"品牌风格——半文言半现代、宣纸质感、古朴但不陈旧
4. **动画效果**：
   - 摇卦时铜钱翻转动画（可用 CSS 旋转 + 透明度过渡）
   - 卦画逐爻出现动画（从下往上逐行显现）
   - AI 解读打字机效果或淡入效果
5. **响应式**：适配移动端，卦画在小屏上保持可读性

### 六、文件变更清单

#### 新增文件

```
src/features/divination/
├── DivinationPage.tsx          # 算卦首页（六爻/梅花入口选择）
├── liuyao/
│   ├── LiuyaoPage.tsx          # 六爻主页面
│   ├── CoinShaker.tsx          # 摇卦铜钱交互组件
│   ├── HexagramDisplay.tsx     # 卦画显示组件（可被六爻和梅花共用）
│   └── LiuyaoInterpretation.tsx # AI解读显示组件
├── meihua/
│   ├── MeihuaPage.tsx          # 梅花易数主页面
│   └── MeihuaInterpretation.tsx # AI解读显示组件
├── utils/
│   ├── trigrams.ts             # 八卦数据
│   ├── hexagrams.ts            # 64卦数据
│   ├── liuyao.ts               # 六爻逻辑：摇卦、数字起卦、随机起卦
│   ├── meihua.ts               # 梅花易数逻辑：数字起卦、时间起卦、文字起卦、体用分析
│   └── strokes.ts              # 汉字笔画映射表
└── types.ts                    # 算卦相关类型定义

src/hooks/
├── useLiuyao.ts                # 六爻状态管理 hook
└── useMeihua.ts                # 梅花易数状态管理 hook

server/routes/
└── divination.js               # 算卦记录 API 路由
```

#### 修改文件

```
src/App.tsx                     # divination tab 渲染 DivinationPage
src/components/layout/TopNav.tsx # 移除 divination tab 的 disabled
src/utils/ai.ts                 # 新增 generateLiuyaoInterpretation() / generateMeihuaInterpretation()
src/utils/db.ts                 # 新增 divination 相关 IndexedDB 操作
server/db.js                    # 新增 divination_records 表
server/index.js                 # 挂载 divination 路由
```

---

## 八、已发现的 Bug 及修复说明

> 以下问题在 Claude Code 初次实现中存在，已手动修复。后续迭代修改时请避免重新引入。

### Bug 1：互卦计算错误（CRITICAL）

**问题**：`meihua.ts` 中的 `computeHuGua()` 函数用比特编码值（0-7）直接调用 `getTrigramByNumber()`，而比特编码和八卦数是两套不同体系。

**根因**：hexagrams 的 symbol 字段用比特编码（bit0=初爻、bit1=二爻、bit2=三爻），即 3bit 值范围为 0-7，其中：
- 0b000(0)=坤、0b001(1)=艮、0b010(2)=坎、0b011(3)=巽、0b100(4)=震、0b101(5)=离、0b110(6)=兑、0b111(7)=乾

而 `getTrigramByNumber()` 接收的是八卦数系统：1=乾、2=兑、3=离、4=震、5=巽、6=坎、7=艮、8(0)=坤

**转换公式**：`八卦数 = 8 - 比特值`（比特值=0 时对应坤）

**修复**：新增 `bitsToTrigramNum()` 函数，在 `computeHuGua` 中调用 `getTrigramByNumber(bitsToTrigramNum(bitValue))`。

### Bug 2：动爻标记显示偏移

**问题**：`HexagramDisplay.tsx` 中动爻标记（○/×）被包裹在条件性渲染的 `<span>` 中，有/无动爻的行宽度不一致，导致各爻水平位置偏移。

**修复**：改为固定宽度占位：
```jsx
{/* 左侧动爻标记：固定宽度，无动爻也保留空间 */}
<span className="inline-block w-5 text-center text-xs text-negative-500 font-bold">
  {isChanging ? (line === 1 ? '○' : '×') : ''}
</span>
{/* 卦画 */}
...
{/* 右侧留白保持对称 */}
<span className="inline-block w-5" />
```

### Bug 3：交互流程——起卦前未强制填写问题 + AI 未自动解读

**问题**：起卦输入区没有"所占之事"字段，排盘后需要用户手动点击"AI 解卦"才分析。

**修复**：
1. **起卦前**：在输入区顶部增加必填字段 `所占之事 *`，带验证提示
2. **起卦时**：起卦函数先检查 `question.trim()` 是否为空，非空才执行
3. **排盘后**：起卦函数中直接调用 `autoInterpret()` 自动触发 AI 解读
4. **结果显示**：结果显示区显示"所问之事"字段；AI 解读自动加载中、自动显示结果；解读失败时显示重试按钮

### Bug 4：卦辞释义内容太少

**问题**：每卦的 `judgment` 仅 20-40 字、`meaning` 仅 60-100 字，信息量不足。

**修复要求**（需手动补充完整）：
- `judgment`：应有 30-50 字，包含卦辞原文核心 + 简要解释
- `meaning`：应有 150-250 字，结构：卦象解释 + 逐爻要义简述 + 事业/婚姻/其他方面的实际预示
- 内容可从以下在线古籍页面获取：https://chinesebooks.github.io/yijingshuji/zhouyi/{ID}.html（乾 2496、坤 2495、屯 2494……）

---

## 实现约束与注意事项

1. **不要修改 / 破坏已有功能**（八字排盘、双人合盘、风水分析）
2. **AI API 调用**：使用已有的 `src/utils/ai.ts` 中的 `chat()` 函数，但需将 model 改为 `deepseek-v4-flash`（保持 base URL 为 `https://api.deepseek.com`）。新增专门的 `generateLiuyaoInterpretation()` 和 `generateMeihuaInterpretation()` 函数。
3. **数据类型**：在 `src/features/divination/types.ts` 中定义所有算卦相关类型，不要修改 `src/types.ts`
4. **深色模式**：暂时不需要支持
5. **测试**：先保证功能可用，不需要写单元测试
6. **卦象数据**：trigrams.ts 和 hexagrams.ts 中的数据用本地常量（硬编码），确保 64 卦数据完整准确。**必须严格按照第七节「古籍研究与卦象数据参考」中的八宫体系组织六十四卦数据**，不得自行编造卦象算法。
   - **数据丰富度要求**：每卦的 `judgment` 须 30-50 字（含卦辞原文+简释），`meaning` 须 150-250 字（结构：卦象总论 + 六爻逐一简述 + 对事业/婚姻/财运的具体预示）
   - **数据来源**：https://chinesebooks.github.io/yijingshuji/zhouyi/ 每卦有"原文""注释""译文""读解"四部分，可据此提炼
   - 六爻各爻辞（初九/初六至上九/上六）简要内容仅放入 AI 解读的系统提示词中即可，不需要在 hexagrams.ts 中存储全部爻辞
7. **六爻摇卦规则**：**必须严格执行传统三钱法**（《增删卜易》「002、占卦法」），背为阳、字为阴，三背为老阳（○）、三字为老阴（×）、两背一字为少阳（′）、一字两背为少阴（″）。不得改用其他随机算法。
8. **梅花易数体用规则**：**必须严格执行体用生克理论**（《梅花易数》卷二「体用总诀」），体为己、用为事，体克用吉、用克体凶、体生用泄、用生体益、比和最吉。互卦取法为去初上爻取中四爻分两卦。
9. **字体和样式**：沿用项目中已有的 Tailwind 自定义色系（paper-, brand-, gold-, positive-, negative-, water-）和字体（font-serif, font-sans），不要引入新的 Tailwind 插件或外部字体。
10. **古籍原文引用**：AI 解读的系统提示词中应引用第七节中的古籍规则（六亲、用神、体用生克、卦气旺衰等），使 AI 能够以"精通《增删卜易》《卜筮正宗》《梅花易数》"的命理师身份进行专业解读。
