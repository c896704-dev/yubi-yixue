/**
 * AI 服务 - 调用 Qwen 视觉/文本模型
 */
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const AI_MODEL = process.env.AI_MODEL || 'qwen3.6-flash';

async function aiFetch(body, apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || data.message || `HTTP ${res.status}` };
    }
    return { success: true, data, content: data?.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { success: false, error: error.name === 'AbortError' ? '请求超时' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

export async function callQwenVision(imageBase64, prompt, apiKey) {
  return aiFetch({
    model: AI_MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: prompt },
      ],
    }],
    max_tokens: 4000,
    temperature: 0.3,
  }, apiKey);
}

export async function callQwenText(prompt, apiKey) {
  return aiFetch({
    model: AI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000,
    temperature: 0.7,
  }, apiKey);
}

/**
 * 验证 API Key 有效性
 */
export async function validateApiKey(apiKey) {
  try {
    const result = await callQwenText('回复"OK"', apiKey);
    return result.success;
  } catch {
    return false;
  }
}

/**
 * 户型图识别 Prompt
 */
export function getLayoutRecognitionPrompt() {
  return `你是一个专业的建筑户型图分析专家。请分析这张户型图，并以严格的 JSON 格式输出以下信息：

{
  "layout": "户型名称或类型（如方正三居/L形两居/南北通透三居等）",
  "totalArea": 120,
  "orientation": "朝向（east/south/west/north/se/sw/ne/nw）",
  "rooms": [
    {
      "name": "房间名（如主卧/次卧/客厅/厨房/卫生间/阳台/大门/玄关/书房/走廊/储物间）",
      "position": "在户型图中的相对方位（西北角/正北方/东北角/正东方/东南角/正南方/西南角/正西方/中区偏北等）",
      "approximateArea": 15
    }
  ],
  "features": {
    "hasWindow": true,
    "windowPositions": ["南侧大窗", "北侧小窗"],
    "doorPosition": "大门在户型图的方位（如正南方/东南角）",
    "balconyDirection": "阳台朝向（如南/东南）",
    "balconyAttachedTo": "阳台连接的房间（如客厅/主卧）",
    "beamNotes": "横梁位置（如客厅中部横梁/主卧门口横梁）",
    "noWindowRooms": ["无窗的房间名列表"],
    "northSouthThrough": true,
    "isRegular": true,
    "isNarrow": false,
    "depthWidthRatio": 1.2,
    "irregularDescription": "如果不规则，描述哪里不规则",
    "hasEnclosedBalcony": false,
    "hasLongCorridor": false,
    "hasChuanTangSha": false,
    "layoutType": "regular",
    "shortToLongRatio": 1.0,
    "indentInfo": {}
  },
  "layoutAnalysis": {
    "isRegular": true,
    "irregularDescription": "",
    "missingCornerPositions": [],
    "indentInfo": {
      "西北": 0.2,
      "东南": 0.45
    }
  }
}

说明：
- position字段需标明每个房间在户型图中的准确方位
- missingCornerPositions: 列出缺角>10%的方位
- indentInfo: 各宫位凹陷深度比例（0-1），没有缺角的写0
- hasChuanTangSha: 大门与阳台/窗户在同一直线上且距离≥5米且中间无实体阻隔
- hasEnclosedBalcony: 是否有内阳台内包后补齐缺角
- layoutType: "regular"方正 / "L-shape"L形 / "irregular"不规则
- northSouthThrough: 是否有南北窗户可以形成对流

只输出 JSON，不要其他文字。`;
}

/**
 * 风水报告生成 Prompt（纯户型版，无八字）
 */
export function getFengshuiReportPrompt(data) {
  const { orientation, year, strengths, weaknesses, ninePalaceData } = data;

  return `你是一个专业的建筑户型和传统风水分析专家。以下是某住宅的风水分析数据，请生成一份【优缺点分析报告】。

【房屋信息】
- 朝向：${orientation}
- 建造年份：${year || '未知'}

【已检测到的优点】
${JSON.stringify(strengths || [], null, 2)}

【已检测到的缺点】
${JSON.stringify(weaknesses || [], null, 2)}

【九宫格分析】
${JSON.stringify(ninePalaceData || {}, null, 2)}

请生成一份专业的风水分析报告：

━━━ 主要优点 ━━━
（按重要性列出至少3个优点，每个优点一句话概括 + 一句解释）

━━━ 主要缺点 ━━━
（按严重程度列出至少3个缺点，每个缺点一句话概括 + 一句解释 + 附一条推荐的化解方法）

━━━ 整体评价 ━━━
（一段话总结此户型适合什么样的人居住，以及总体吉凶判断）

要求：
1. 先说优点再说缺点
2. 每个缺点后标注"化解：xxx"，优先推荐简单低成本的方案
3. 专业但不晦涩，让普通用户能看懂
4. 篇幅控制在500字以内`;
}

/**
 * 属相分析 Prompt
 */
export function getZodiacAnalysisPrompt(birthYear) {
  return `请根据出生年份 ${birthYear}，确定对应的生肖属相及其五行属性，并以 JSON 格式输出。

只输出 JSON，不要其他文字：
{
  "animal": "生肖（如鼠/牛/虎/兔/龙/蛇/马/羊/猴/鸡/狗/猪）",
  "element": "该生肖对应的五行（金/木/水/火/土）",
  "traits": "该属相的性格特点（50字以内）",
  "luckyDirections": ["吉利方位"],
  "unluckyDirections": ["不利方位"],
  "compatibleElements": ["相生的五行"],
  "incompatibleElements": ["相克的五行"]
}`;
}

/**
 * 属相+户型综合报告 Prompt
 */
export function getZodiacComprehensivePrompt(data) {
  const { orientation, strengths, weaknesses, ninePalaceData, zodiacData, matchData } = data;

  return `你是一个精通风水学和属相命理的专家。以下是某住宅的户型数据和房主属相信息，请生成一份综合风水分析报告。

【房屋数据】
- 朝向：${orientation}
- 九宫格：${JSON.stringify(ninePalaceData || {})}
- 优点：${JSON.stringify(strengths || [])}
- 缺点：${JSON.stringify(weaknesses || [])}

【房主属相】
${JSON.stringify(zodiacData || {}, null, 2)}

【五行匹配分析】
${JSON.stringify(matchData || {}, null, 2)}

请生成综合报告：

━━━ 户型优缺点 ━━━
（客观分析户型本身的优劣，不含属相因素，至少各2条）

━━━ 房主属相匹配分析 ━━━
（此户型与房主属相的匹配度，包括朝向五行与属相的生克关系、各方位与属相的适配情况、此房对房主运势的综合影响）

━━━ 综合结论 ━━━
（此房是否适合此属相的房主，一句话总结）

要求：专业但不晦涩，篇幅控制在500字以内。`;
}

/**
 * 环境风水分析 Prompt
 */
export function getEnvironmentAnalysisPrompt(description) {
  return `你是一个精通风水学的专家。请分析以下楼盘位置的风水格局，并以 JSON 格式输出：

描述信息：${description}

输出格式：
{
  "fourDeities": {
    "greenDragon": { "score": 85, "description": "左侧（东）青龙方描述" },
    "whiteTiger": { "score": 70, "description": "右侧（西）白虎方描述" },
    "redPhoenix": { "score": 80, "description": "前方（南）朱雀方描述" },
    "blackTortoise": { "score": 75, "description": "后方（北）玄武方描述" }
  },
  "shaDetections": [
    { "type": "形煞类型", "severity": "high/medium/low", "description": "描述" }
  ],
  "overallEnvironment": "整体环境评价",
  "recommendations": ["改善建议"]
}

只输出 JSON，不要其他文字。`;
}

export default {
  callQwenVision,
  callQwenText,
  validateApiKey,
  getLayoutRecognitionPrompt,
  getFengshuiReportPrompt,
  getZodiacAnalysisPrompt,
  getZodiacComprehensivePrompt,
  getEnvironmentAnalysisPrompt,
};
