// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const quizRoutes = require('./routes/quizRoutes');
const agentRoutes = require('./routes/agentRoutes');

// Force HTTP provider mode only
const DATA_PROVIDER = 'http';
console.log(`Data provider locked to: ${DATA_PROVIDER} (HTTP)`);

// Small helper to delay startup (useful when waiting for other services)
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function startServer() {
  if (process.env.WAIT_FOR_SERVICES === 'true') {
    console.log('Waiting 15 seconds for services to become available...');
    await delay(15000);
  }

  console.log('Starting service initialization...');
  console.log(`Data provider: ${DATA_PROVIDER}`);
  console.log('🛰️  Skipping Mongo connection (HTTP-only mode)');

  const app = express();

  // If behind a proxy (Render/NGINX/Cloudflare), trust X-Forwarded-* headers
  app.set('trust proxy', 1);

  // ---------- CORS (must be before routes) ----------
  // If you DO NOT use browser credentials (cookies), you can leave CORS_ORIGIN unset
  // and keep wildcard behavior. If you DO use credentials, set:
  //   CORS_ORIGIN=https://your-frontend.example,https://another.example
  //   CORS_CREDENTIALS=true
  const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const USE_CREDENTIALS =
    String(process.env.CORS_CREDENTIALS || 'false').toLowerCase() === 'true';

  const corsOptions = {
    origin(origin, cb) {
      // Allow non-browser clients (curl/Postman → no Origin)
      if (!origin) return cb(null, true);

      // If no explicit origins configured, allow all (for non-credentialed browser calls)
      if (ALLOWED_ORIGINS.length === 0) return cb(null, true);

      // Only allow whitelisted origins
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);

      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Agent-Key', 'X-API-Key'],
    credentials: USE_CREDENTIALS, // adds Access-Control-Allow-Credentials: true when enabled
  };

  app.use(cors(corsOptions));
  // Ensure preflight replies include the same headers
  app.options('*', cors(corsOptions));

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
