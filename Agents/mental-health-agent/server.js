// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const quizRoutes = require('./routes/quizRoutes');
const agentRoutes = require('./routes/agentRoutes');

// Switchable data provider: 'mongo' | 'http'
const DATA_PROVIDER = process.env.DATA_PROVIDER || 'mongo';
const shouldUseMongo = DATA_PROVIDER === 'mongo';
const connectDB = shouldUseMongo ? require('./config/db') : null;

// Small helper to delay startup (useful when waiting for other services)
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function startServer() {
  if (process.env.WAIT_FOR_SERVICES === 'true') {
    console.log('Waiting 15 seconds for services to become available...');
    await delay(15000);
  }

  console.log('Starting service initialization...');
  console.log(`Data provider: ${DATA_PROVIDER}`);

  // Connect to MongoDB only if using 'mongo' provider
  if (shouldUseMongo) {
    await connectDB();
    console.log('✅ MongoDB connected');
  } else {
    console.log('🛰️  Skipping Mongo connection (using unified HTTP API)');
  }

  const app = express();

  // If behind a proxy (Render/NGINX/Cloudflare), trust X-Forwarded-* headers
  app.set('trust proxy', 1);

  // CORS
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Agent-Key', 'X-API-Key'],
    })
  );

  // JSON body parsing
  app.use(express.json({ limit: '1mb' }));

  // Health checks (both local and deployed prefix)
  app.get('/health', (_req, res) => {
    res.json({ ok: true, mode: DATA_PROVIDER, time: new Date().toISOString() });
  });
  app.get('/mentalhealth/api/health', (_req, res) => {
    res.json({ ok: true, mode: DATA_PROVIDER, time: new Date().toISOString() });
  });

  // Mount API routes (both prefixes):
  // - Local/dev:            /api/*
  // - Deployed/public path: /mentalhealth/api/*
  app.use('/api', quizRoutes);
  app.use('/api', agentRoutes);

  app.use('/mentalhealth/api', quizRoutes);
  app.use('/mentalhealth/api', agentRoutes);

  // 404 for unknown routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Centralized error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
