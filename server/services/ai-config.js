/**
 * AI 上游配置 —— 全站唯一一处。
 *
 * 2026-10-05 建立：此前 `routes/ai.js` 与 `services/ai-service.js` 各写了一套
 * baseUrl / model / URL 拼接逻辑，于是「官方改了模型名」这种一次性的变更要改两个地方，
 * 漏一个就只剩半边能用。现在两边都从这里取。
 *
 * 模型名：官方当前支持的只有 `deepseek-flash`（推理型）与 `deepseek-v4-pro`。
 * 旧名 `deepseek-v4-flash` 已不在官方列表里——实测上游报错原文：
 * 「The supported API model names are deepseek-flash, deepseek-v4-pro, but you passed …」
 * 它目前仍能解析（返回体里 `model` 字段已被改写成 `deepseek-flash`），但属于遗留别名，不要再用。
 */

export function getAiConfig() {
  return {
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    // 推理型模型：思维链（reasoning_tokens）先占用 max_tokens，额度不够时正文会是空的
    model: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
    apiKey: process.env.DEEPSEEK_API_KEY,
  }
}

/**
 * 单次调用的输出上限。推理型模型下这个值必须给足：
 * 实测思维链可占掉输出额度的 75%（单次最高 93.5%），给小了正文直接为空。
 */
export const AI_MAX_TOKENS = 16384;

/**
 * 拼接 chat/completions 地址。
 * 三种 baseUrl 写法都要能接住：带 `/v1`、带完整路径、只有域名。
 */
export function getChatCompletionsUrl(baseUrl) {
  const clean = String(baseUrl || '').replace(/\/+$/, '')
  if (clean.endsWith('/chat/completions')) return clean
  if (clean.endsWith('/v1')) return `${clean}/chat/completions`
  return `${clean}/v1/chat/completions`
}
