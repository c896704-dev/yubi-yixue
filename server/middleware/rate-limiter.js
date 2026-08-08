import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

const standardConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  // 仅开发模式跳过本机（生产环境经 nginx 反代，req.ip 为代理地址，必须限流）
  skip: (req) => !isProd && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
};

/** 登录用户不受 IP 限流影响（按用户维度限流更精准，且不会误伤同 IP 的其他用户） */
const skipLoggedIn = (req) => Boolean(req.userId);

export const authLimiter = rateLimit({
  ...standardConfig,
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  skip: (req) => (standardConfig.skip(req) || skipLoggedIn(req)),
  message: { error: '请求过于频繁，请15分钟后再试' },
});

export const aiChatLimiter = rateLimit({
  ...standardConfig,
  windowMs: 1 * 60 * 1000,
  max: isProd ? 20 : 200,
  skip: (req) => (standardConfig.skip(req) || skipLoggedIn(req)),
  message: { error: 'AI 请求过于频繁，请稍后再试' },
});

export const analysisLimiter = rateLimit({
  ...standardConfig,
  windowMs: 1 * 60 * 1000,
  max: isProd ? 10 : 50,
  skip: (req) => (standardConfig.skip(req) || skipLoggedIn(req)),
  message: { error: '分析请求过于频繁，请稍后再试' },
});

export const generalLimiter = rateLimit({
  ...standardConfig,
  windowMs: 1 * 60 * 1000,
  // 提高阈值：前端页面挂载会并发多个请求（记录加载/设备注册），
  // 60次/分钟在同IP多用户下容易误触。基础防刷 120次/分钟足够，登录用户不限
  max: isProd ? 120 : 500,
  skip: (req) => (standardConfig.skip(req) || skipLoggedIn(req)),
  message: { error: '请求过于频繁，请稍后再试' },
});
