// controllers/quizController.js
require('dotenv').config();

const data = require('../services/data'); // http | mongo via DATA_PROVIDER
const { upsertTexts, toPineconeSafeMetadata } = require('../services/memoryService');

// Pinecone-safe list of strings
function asStringList(value) {
  if (Array.isArray(value)) {
    return value.map(v => {
      if (v == null) return "";
      if (typeof v === "string") return v;
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      return (
        v.label ?? v.text ?? v.name ?? v.title ?? v.option ?? v.id ?? v.value ?? JSON.stringify(v)
      );
    });
  }
  if (value && typeof value === "object") return [JSON.stringify(value)];
  if (value == null) return [];
  return [String(value)];
}

async function calculateScore(req, res) {
  try {
    const { user = 'guest', testResponses } = req.body;
    if (!testResponses || typeof testResponses !== 'object') {
      return res.status(400).json({ error: 'Invalid testResponses format' });
    }

    // 1) Load questions (repo falls back to local JSON if Unified API errors)
    const questions = await data.getQuestions();
    if (!Array.isArray(questions) || questions.length !== 10) {
      return res.status(500).json({ error: 'Expected 10 questions in DB, found ' + (questions?.length ?? 0) });
    }

    // 2) Compute score
    let totalScore = 0;
    const scoreInfo = [];
    const answers   = [];

    const responseBySerial = new Map(
      Object.entries(testResponses).map(([k, v]) => [Number(k), Number(v)])
    );

    const sorted = [...questions].sort((a, b) => Number(a.serialNumber) - Number(b.serialNumber));

    for (const q of sorted) {
      const serial = Number(q.serialNumber);
      const idx = responseBySerial.has(serial) ? responseBySerial.get(serial) : undefined;

      if (
        idx == null ||
        !Array.isArray(q.answers) ||
        idx < 0 ||
        idx >= q.answers.length ||
        typeof q.answers[idx]?.score === 'undefined'
      ) {
        return res.status(400).json({ error: `Invalid answer for question ${serial}` });
      }

      const sc = Number(q.answers[idx].score ?? 0);
      totalScore += sc;
      scoreInfo.push({ questionId: serial, score: sc });
      answers.push({ questionId: serial, answerIndex: Number(idx) });
    }

    // 3) Message heuristic
    const lastScore = scoreInfo[scoreInfo.length - 1]?.score ?? 0;
    const message =
      totalScore > 10 || lastScore > 0
        ? "Thank you for completing the questionnaire. It looks like you might be facing some emotional challenges—consider reaching out for support."
        : "Thank you for completing the questionnaire!";

    const nowIso = new Date().toISOString();

    // 4) Persist via repo — but DON'T BLOCK UI if Unified API rejects
    let savedId = null;
    let persisted = true;
    try {
      const saved = await data.createScore({
        user,
        totalScore,
        scoreInfo,
        answers,
        message,
        createdAt: nowIso,
        updatedAt: nowIso
      });
      savedId = String(saved?._id || saved?.id || Date.now());
    } catch (e) {
      persisted = false;
      savedId = String(Date.now()); // synthetic id so client can proceed
      console.warn('createScore warning (Unified API offline or schema mismatch):', e?.response?.data || e?.message || e);
    }

    // 5) Fire-and-forget vector upsert
    const metadataRaw = {
      user: String(user),
      totalScore: Number(totalScore),
      type: "quiz",
      answers: asStringList(answers),
      answers_raw_json: JSON.stringify(answers),
      scoreId: savedId,
      timestamp: nowIso,
      persisted
    };
    const metadataSafe = toPineconeSafeMetadata ? toPineconeSafeMetadata(metadataRaw) : metadataRaw;

    upsertTexts([savedId], [message], [metadataSafe], 'mental_health')
      .catch(err => console.error('Non-critical Pinecone upsert error (quiz):', err));

    // 6) Respond (include fullScore echo so the client can immediately submit follow-up)
    return res.status(201).json({
      id: savedId,
      totalScore,
      message,
      persisted,
      fullScore: {
        id: savedId,
        user,
        totalScore,
        scoreInfo,
        answers,
        message,
        createdAt: nowIso,
        updatedAt: nowIso
      }
    });
  } catch (err) {
    console.error('Quiz submission failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Accepts EITHER:
 *  - { fullScore: { id,user,totalScore,scoreInfo,answers,message,createdAt,updatedAt,followUp } }
 *  - { id: "<id>", followUp: [..] }
 * Persists if Unified API accepts; otherwise returns success with persisted:false so UI is not blocked.
 */
async function saveFollowUp(req, res) {
  try {
    const { fullScore } = req.body;

    // Shape 1: minimal
    if (!fullScore && req.body && req.body.id && Array.isArray(req.body.followUp)) {
      return res.json({
        message: 'Follow-up accepted (temp, not persisted)',
        id: String(req.body.id),
        followUp: req.body.followUp,
        persisted: false
      });
    }

    // Shape 2: full
    if (
      !fullScore ||
      !fullScore.id ||
      !Array.isArray(fullScore.followUp) ||
      typeof fullScore.user !== 'string'
    ) {
      return res.status(400).json({
        error: 'Invalid followUp submission. Send fullScore { id, user, totalScore, scoreInfo[], answers[], message, createdAt, updatedAt, followUp[] } or { id, followUp[] }.'
      });
    }

    fullScore.updatedAt = new Date().toISOString();

    try {
      const updated = await data.updateFollowUp(fullScore);
      if (!updated) {
        return res.status(404).json({ error: 'Score document not found' });
      }

      // Vector upsert (fire & forget)
      const followupText = `Follow-up responses saved for score ${String(fullScore.id)}.`;
      const metadataRaw = {
        type: "followup",
        user: String(fullScore.user || "guest"),
        scoreDocId: String(fullScore.id),
        answers: asStringList(fullScore.followUp),
        answers_raw_json: JSON.stringify(fullScore.followUp),
        timestamp: new Date().toISOString(),
        persisted: true
      };
      const metadataSafe = toPineconeSafeMetadata ? toPineconeSafeMetadata(metadataRaw) : metadataRaw;

      upsertTexts([String(fullScore.id) + "-followup"], [followupText], [metadataSafe], 'mental_health')
        .catch(err => console.error('Non-critical Pinecone upsert error (follow-up):', err));

      return res.json({ message: 'Follow-up saved', id: fullScore.id, followUp: fullScore.followUp, persisted: true });
    } catch (e) {
      console.warn('updateFollowUp warning (Unified API offline or schema mismatch):', e?.response?.data || e?.message || e);

      // Don’t block the user; accept locally
      return res.json({
        message: 'Follow-up accepted (temp, not persisted)',
        id: fullScore.id,
        followUp: fullScore.followUp,
        persisted: false
      });
    }
  } catch (err) {
    console.error('Follow-up save failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { calculateScore, saveFollowUp };
