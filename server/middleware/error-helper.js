const isProd = process.env.NODE_ENV === 'production';

export function safeError(error, context = '请求') {
  return isProd ? `${context}失败，请稍后重试` : error.message || `${context}失败`;
}

export function handleError(res, error, context = '请求', status = 500) {
  console.error(`[${context}]`, error);
  res.status(status).json({ error: safeError(error, context) });
}
