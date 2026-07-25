import { Router } from 'express';

const router = Router();

function getAiConfig() {
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
  const apiKey = process.env.DEEPSEEK_API_KEY;
  return { baseUrl, model, apiKey };
}

function getChatCompletionsUrl(baseUrl) {
  const clean = baseUrl.replace(/\/+$/, '');
  if (clean.endsWith('/chat/completions')) return clean;
  if (clean.endsWith('/v1')) return `${clean}/chat/completions`;
  return `${clean}/v1/chat/completions`;
}

router.post('/chat', async (req, res) => {
  try {
    const { baseUrl, model, apiKey } = getAiConfig();
    if (!apiKey) {
      return res.status(500).json({ error: 'DeepSeek API Key 未配置' });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '缺少消息内容' });
    }

    const upstream = await fetch(getChatCompletionsUrl(baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    const text = await upstream.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: { message: text || 'AI 服务返回非 JSON 响应' } };
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data.error?.message || data.message || `DeepSeek API error ${upstream.status}`,
      });
    }

    res.json({
      content: data?.choices?.[0]?.message?.content || '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'AI 服务调用失败' });
  }
});

export default router;
