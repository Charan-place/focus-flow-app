import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.json({ name: 'FocusFlow API', status: 'ok' }));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/sync', syncRoutes);

// 404 + error handlers
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set. Copy server/.env.example to server/.env and fill it in.');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => console.log(`✅ FocusFlow API on http://localhost:${PORT}`));
}

start().catch((e) => {
  console.error('Failed to start:', e.message);
  process.exit(1);
});
