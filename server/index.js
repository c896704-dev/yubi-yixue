import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db.js';
import { deviceMiddleware } from './middleware/device.js';
import analyzeRouter from './routes/analyze.js';
import recordsRouter from './routes/records.js';
import settingsRouter from './routes/settings.js';
import authRouter from './routes/auth.js';
import divinationRouter from './routes/divination.js';
import compatRouter from './routes/compat.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(deviceMiddleware);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/records', recordsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/divination', divinationRouter);
app.use('/api/compat', compatRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database
initDatabase();

app.listen(PORT, () => {
  console.log(`御笔易学服务端运行在 http://localhost:${PORT}`);
});
