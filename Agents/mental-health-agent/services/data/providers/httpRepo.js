// services/data/providers/httpRepo.js
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const BASE = process.env.UNIFIED_API_BASE || 'https://tummytales-db-api.onrender.com';
const AGENT_KEY = process.env.UNIFIED_AGENT_KEY || 'def456';
const API_KEY   = process.env.UNIFIED_API_KEY   || 'entrykey';
const SEED_ON_EMPTY = String(process.env.UNIFIED_SEED_ON_EMPTY || 'false').toLowerCase() === 'true';

const client = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: {
    'X-Agent-Key': AGENT_KEY,
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
});

async function withRetry(fn, tries = 2) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

function loadLocalQuestions() {
  const file = path.join(__dirname, '../../../data/questions.json');
  const buf = fs.readFileSync(file, 'utf8');
  return JSON.parse(buf);
}

async function seedUnifiedQuestions() {
  const items = loadLocalQuestions();
  console.log(`🟡 Seeding ${items.length} questions to unified API...`);
  for (const q of items) {
    try {
      await client.post('/mental_health/question', q);
    } catch (e) {
      const msg = e?.response?.data || e?.message || e;
      console.warn('   ⚠️  seed question failed:', msg);
    }
  }
  console.log('🟢 Seeding attempt finished.');
}

function log422(prefix, err) {
  if (err?.response?.status === 422) {
    try {
      console.error(prefix, JSON.stringify(err.response.data, null, 2));
    } catch {
      console.error(prefix, err.response.data);
    }
  } else if (err?.response?.status >= 400) {
    console.error(prefix, err.response.status, err.response.data);
  } else {
    console.error(prefix, err?.message || err);
  }
}

module.exports = {
  // ---------------- QUESTIONS ----------------
  getQuestions: async () => {
    try {
      const { data } = await withRetry(() => client.get('/mental_health/questions'), 2);

      if (!Array.isArray(data) || data.length !== 10) {
        console.warn(`⚠️ Unified API returned ${Array.isArray(data) ? data.length : 'non-array'} questions.`);
        if (SEED_ON_EMPTY) {
          await seedUnifiedQuestions();
          const { data: after } = await client.get('/mental_health/questions');
          if (Array.isArray(after) && after.length === 10) return after;
        }
        return loadLocalQuestions();
      }
      return data;
    } catch (e) {
      console.error('Unified API /questions failed, using local fallback:', e?.response?.data || e?.message || e);
      if (SEED_ON_EMPTY) { try { await seedUnifiedQuestions(); } catch {} }
      return loadLocalQuestions();
    }
  },

  createQuestion: async (q) => {
    const { data } = await client.post('/mental_health/question', q);
    return data;
  },

  // ---------------- SCORES ----------------
  // POST /mental_health/score — unified API requires createdAt/updatedAt (camelCase) at top level
  createScore: async (doc) => {
    const now = new Date().toISOString();

    const camel = {
      user: doc.user,
      totalScore: doc.totalScore,
      scoreInfo: doc.scoreInfo,
      answers: doc.answers,
      message: doc.message,
      createdAt: doc.createdAt || now,
      updatedAt: doc.updatedAt || now
    };

    const snake = {
      user: doc.user,
      total_score: doc.totalScore,
      score_info: doc.scoreInfo,
      answers: doc.answers,
      message: doc.message,
      created_at: doc.createdAt || now,
      updated_at: doc.updatedAt || now
    };

    const variants = [
      camel,               // preferred
      snake,               // fallback
      { score: camel },    // nested envelope
      { score: snake }
    ];

    let lastErr;
    for (const body of variants) {
      try {
        const { data } = await client.post('/mental_health/score', body);
        return data;
      } catch (e) {
        lastErr = e;
        log422('createScore failed variant:', e);
        if (e?.response?.status !== 422) break; // non-schema issue
      }
    }
    throw lastErr;
  },

  updateFollowUp: async (id, followUp) => {
    const now = new Date().toISOString();

    const camel = { id, followUp, updatedAt: now };
    const snake = { id, follow_up: followUp, updated_at: now };

    const variants = [camel, { score: camel }, snake, { score: snake }];

    let lastErr;
    for (const body of variants) {
      try {
        const { data } = await client.post('/mental_health/score', body);
        return data;
      } catch (e) {
        lastErr = e;
        log422('updateFollowUp failed variant:', e);
        if (e?.response?.status !== 422) break;
      }
    }
    throw lastErr;
  },

  getScoresByUser: async (userId) => withRetry(async () => {
    const { data } = await client.get(`/mental_health/scores/${encodeURIComponent(userId)}`);
    return data;
  }),

  // ---------------- CHAT ----------------
  /**
   * Unified API requires a full chat document on POST:
   * {
   *   sessionId, userId, scoreDocId, messages: [{ role, content, timestamp }],
   *   createdAt, updatedAt
   * }
   */
  upsertChatMessage: async ({ sessionId, userId, role, content, scoreDocId = null }) => {
    const nowIso = new Date().toISOString();

    const body = {
      sessionId,
      userId,
      scoreDocId, // required even if null
      messages: [
        { role, content, timestamp: nowIso }
      ],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      const { data } = await client.post('/mental_health/chat', body);
      return data;
    } catch (e) {
      log422('Unified API /chat failed:', e);
      throw e;
    }
  },

  getChatsByUser: async (userId) => {
    const { data } = await client.get(`/mental_health/chats/${encodeURIComponent(userId)}`);
    return data;
  },

  getChatBySession: async (sessionId) => {
    const { data } = await client.get(`/mental_health/chat/session/${encodeURIComponent(sessionId)}`);
    return data;
  }
};
