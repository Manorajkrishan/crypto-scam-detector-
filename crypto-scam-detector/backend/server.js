require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const analyzeRoutes = require('./routes/analyze');
const reportRoutes = require('./routes/report');
const { initDb } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'crypto-scam-detector-api' });
});

app.use('/api/analyze', analyzeRoutes);
app.use('/api/report', reportRoutes);

async function start() {
  try {
    await initDb();
    console.log('Database initialized');
  } catch (err) {
    console.warn('Database init warning (using file fallback):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
