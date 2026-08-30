import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

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

    const { messages, temperature } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '缺少消息内容' });
    }

    // 长文防截断：上游 max_tokens 打满（finish_reason=length）时自动续写拼接。
    // 中文长报告（1400-2000字）接近单轮输出上限，截断时以 assistant 截断稿 + "继续"指令续写，最多 2 轮。
    const callUpstream = (chatMessages) => fetch(getChatCompletionsUrl(baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        // 命理解读需稳定输出：默认 0.5，允许前端按场景覆盖
        temperature: typeof temperature === 'number' ? temperature : 0.5,
        // deepseek-v4-flash 为推理型模型：reasoning_tokens 思维链先占用输出额度
        // （实测单次思维链可达 3000-4000 tokens），8192 下长报告正文必被截断，提至 16384
        max_tokens: 16384,
      }),
    });

    let chatMessages = messages;
    let content = '';
    let lastData = null;
    for (let round = 0; round < 3; round++) {
      const upstream = await callUpstream(chatMessages);
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
      lastData = data;
      const choice = data?.choices?.[0];
      const piece = choice?.message?.content || '';
      const finishReason = choice?.finish_reason || '';
      if (!piece) {
        // content 为空：思维链耗尽额度（reasoning 吃满 max_tokens）或偶发空回复。
        // finish=length 时重试同消息（模型随机性下轮可能正常），否则若已有内容用已有成果，都没有则报错
        if (finishReason === 'length' && round < 2) {
          console.log(`[AI 聊天] 第${round + 1}轮思维链耗尽额度（content 空，reasoning 打满），重试`);
          continue;
        }
        if (content) break;
        console.error('[AI 聊天] 上游 200 但无内容:', JSON.stringify(data).slice(0, 300));
        return res.status(502).json({ error: 'AI 服务返回了空内容，请点击重试' });
      }
      content += piece;
      if (finishReason !== 'length') break;
      console.log(`[AI 聊天] 第${round + 1}轮输出被截断（finish_reason=length，已收 ${content.length} 字），自动续写`);
      chatMessages = [
        ...messages,
        { role: 'assistant', content: piece },
        { role: 'user', content: '你的输出在上一条消息末尾被截断了。请从中断处直接继续写完剩余部分：不要重复已有内容，不要重新开头，保持风格连贯。' },
      ];
    }

    if (!content) {
      return res.status(502).json({ error: 'AI 服务返回了空内容，请点击重试' });
    }
    if (lastData?.usage) {
      console.log(`[AI 聊天] 完成：输出 ${content.length} 字，usage:`, JSON.stringify(lastData.usage));
    }
    res.json({ content });
  } catch (error) {
    console.error('[AI 聊天]', error);
    res.status(500).json({ error: 'AI 服务调用失败，请稍后重试' });
  }
});

export default router;
