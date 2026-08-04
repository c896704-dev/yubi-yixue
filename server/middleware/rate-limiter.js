import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

const standardConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  // 仅开发模式跳过本机（生产环境经 nginx 反代，req.ip 为代理地址，必须限流）
  skip: (req) => !isProd && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
};

export const authLimiter = rateLimit({
  ...standardConfig,
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  message: { error: '请求过于频繁，请15分钟后再试' },
});

export const aiChatLimiter = rateLimit({
  ...standardConfig,
  windowMs: 1 * 60 * 1000,
  max: isProd ? 20 : 200,
  message: { error: 'AI 请求过于频繁，请稍后再试' },
});

export const analysisLimiter = rateLimit({
  ...standardConfig,
  windowMs: 1 * 60 * 1000,
  max: isProd ? 5 : 50,
  message: { error: '分析请求过于频繁，请稍后再试' },
});

export const generalLimiter = rateLimit({
  ...standardConfig,
  windowMs: 1 * 60 * 1000,
  max: isProd ? 60 : 500,
  message: { error: '请求过于频繁，请稍后再试' },
});
