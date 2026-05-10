import { Router } from 'express';

const router = Router();

const BASE_URL = process.env.DEEPSEEK_BASE_URL || process.env.AI_BASE_URL || 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL || process.env.AI_MODEL || 'deepseek-v4-flash';

router.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AI API Key 未配置' });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '缺少消息内容' });
    }

    const upstream = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
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
