// services/data/providers/httpRepo.js
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const BASE = process.env.UNIFIED_API_BASE || 'https://tummytales-db-api.onrender.com';
const AGENT_KEY = process.env.UNIFIED_AGENT_KEY || 'def456';
const API_KEY   = process.env.UNIFIED_API_KEY   || 'entrykey';
const SEED_ON_EMPTY = String(process.env.UNIFIED_SEED_ON_EMPTY || 'false').toLowerCase() === 'true';

// Optional kill-switches to completely skip unified writes (useful in prod while backend is flaky)
const DISABLE_UNIFIED_WRITE = String(process.env.UNIFIED_DISABLE_WRITES || 'false').toLowerCase() === 'true';
const DISABLE_UNIFIED_CHAT  = String(process.env.UNIFIED_DISABLE_CHAT   || 'false').toLowerCase() === 'true';

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
    console.error(prefix, err.response?.status, err.response?.data);
  } else {
    console.error(prefix, err?.message || err);
  }
}

// --- helpers for “synthetic” non-blocking fallbacks ---
function syntheticScoreResponse(doc) {
  const id = String(Date.now());
  return { _id: id, id, ...doc, __synthetic: true };
}
function ok(payload = {}) { return { ok: true, persisted: false, ...payload }; }

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
  // Try JSON variants, then ?score=, then form score=. If all fail, return synthetic (non-blocking).
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

    if (DISABLE_UNIFIED_WRITE) {
      console.warn('🟠 UNIFIED_DISABLE_WRITES=true — returning synthetic score.');
      return syntheticScoreResponse(camel);
    }

    let lastErr;

    // JSON bodies
    for (const body of [camel, snake, { score: camel }, { score: snake }]) {
      try {
        const { data } = await client.post('/mental_health/score', body);
        return data;
      } catch (e) {
        lastErr = e;
        log422('createScore failed variant:', e);
        if (e?.response?.status !== 422) break; // if not schema-related, stop trying variants
      }
    }

    // Query param ?score=<json>
    try {
      const { data } = await client.post('/mental_health/score', null, {
        params: { score: JSON.stringify(camel) }
      });
      return data;
    } catch (e) {
      lastErr = e;
      log422('createScore failed (query ?score=):', e);
    }

    // Form-encoded score=<json>
    try {
      const form = new URLSearchParams();
      form.append('score', JSON.stringify(camel));
      const { data } = await client.post('/mental_health/score', form.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return data;
    } catch (e) {
      lastErr = e;
      log422('createScore failed (form score=):', e);
    }

    // Final non-blocking fallback
    console.warn('🟠 Unified /score not accepting payloads; returning synthetic score so UI can continue.');
    return syntheticScoreResponse(camel);
  },

  /**
   * updateFollowUp expects FULL score doc:
   * { id,user,totalScore,scoreInfo,answers,message,createdAt,updatedAt,followUp }
   * If it fails, return a non-blocking OK so UI can proceed (persisted:false).
   */
  updateFollowUp: async (fullScore) => {
    const camel = { ...fullScore };
    const snake = {
      id: camel.id,
      user: camel.user,
      total_score: camel.totalScore,
      score_info: camel.scoreInfo,
      answers: camel.answers,
      message: camel.message,
      follow_up: camel.followUp,
      created_at: camel.createdAt,
      updated_at: camel.updatedAt
    };

    if (DISABLE_UNIFIED_WRITE) {
      console.warn('🟠 UNIFIED_DISABLE_WRITES=true — accepting followUp locally.');
      return ok({ id: camel.id, echo: camel });
    }

    let lastErr;
    for (const body of [camel, { score: camel }, snake, { score: snake }]) {
      try {
        const { data } = await client.post('/mental_health/score', body);
        return data;
      } catch (e) {
        lastErr = e;
        log422('updateFollowUp failed variant:', e);
        if (e?.response?.status !== 422) break;
      }
    }

    console.warn('🟠 Unified /score followUp not accepted; acknowledging locally.');
    return ok({ id: camel.id, echo: camel });
  },

  getScoresByUser: async (userId) => withRetry(async () => {
    const { data } = await client.get(`/mental_health/scores/${encodeURIComponent(userId)}`);
    return data;
  }),

  // ---------------- CHAT ----------------
  /**
   * Unified API docs imply:
   * { sessionId, userId, scoreDocId, messages: [{ role, content, timestamp }], createdAt, updatedAt }
   * If API rejects (expects ?chat=), we acknowledge locally so the agent can keep talking.
   */
  upsertChatMessage: async ({ sessionId, userId, role, content, scoreDocId = null }) => {
    const nowIso = new Date().toISOString();

    const body = {
      sessionId,
      userId,
      scoreDocId, // can be null
      messages: [{ role, content, timestamp: nowIso }],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    if (DISABLE_UNIFIED_CHAT) {
      console.warn('🟠 UNIFIED_DISABLE_CHAT=true — accepting chat locally.');
      return ok({ sessionId, userId, echo: body });
    }

    try {
      const { data } = await client.post('/mental_health/chat', body);
      return data;
    } catch (e) {
      log422('Unified API /chat failed:', e);

      // Try ?chat=<json> as a one-off
      try {
        const { data } = await client.post('/mental_health/chat', null, {
          params: { chat: JSON.stringify(body) }
        });
        return data;
      } catch (e2) {
        log422('Unified API /chat failed (query ?chat=):', e2);
      }

      // Last resort: non-blocking local ack
      console.warn('🟠 Unified /chat not accepting payloads; acknowledging locally.');
      return ok({ sessionId, userId, echo: body });
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
