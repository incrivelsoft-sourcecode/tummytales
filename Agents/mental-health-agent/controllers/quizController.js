// controllers/quizController.js
require('dotenv').config();

const data = require('../services/data'); // http | mongo via DATA_PROVIDER
const { upsertTexts, toPineconeSafeMetadata } = require('../services/memoryService');

// Helper: coerce any value to a Pinecone-safe list of strings for metadata
function asStringList(value) {
  if (Array.isArray(value)) {
    return value.map(v => {
      if (v == null) return "";
      if (typeof v === "string")  return v;
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      // common shapes from your schema
      return (
        v.label ??
        v.text ??
        v.name ??
        v.title ??
        v.option ??
        v.id ??
        v.value ??
        JSON.stringify(v)
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

    // 1) Load & validate questions (via repo; works for http or mongo)
    const questions = await data.getQuestions();
    if (!Array.isArray(questions) || questions.length !== 10) {
      return res
        .status(500)
        .json({ error: 'Expected 10 questions in DB, found ' + (questions?.length ?? 0) });
    }

    // 2) Compute totalScore, scoreInfo, answers
    let totalScore = 0;
    const scoreInfo = [];
    const answers   = [];

    // Normalize keys in case client sent them as strings
    const responseBySerial = new Map(
      Object.entries(testResponses).map(([k, v]) => [Number(k), Number(v)])
    );

    // Ensure questions are processed in serialNumber order (defensive)
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
        return res
          .status(400)
          .json({ error: `Invalid answer for question ${serial}` });
      }

      const sc = Number(q.answers[idx].score ?? 0);
      totalScore += sc;
      scoreInfo.push({ questionId: serial, score: sc });
      answers.push({ questionId: serial, answerIndex: Number(idx) });
    }

    // 3) Pick feedback message
    const lastScore = scoreInfo[scoreInfo.length - 1]?.score ?? 0;
    const message =
      totalScore > 10 || lastScore > 0
        ? "Thank you for completing the questionnaire. It looks like you might be facing some emotional challenges—consider reaching out for support."
        : "Thank you for completing the questionnaire!";

    // 4) Persist score (via repo)
    // Unified API requires createdAt/updatedAt at TOP LEVEL (camelCase)
    const nowIso = new Date().toISOString();
    let saved;
    try {
      saved = await data.createScore({
        user,
        totalScore,
        scoreInfo,
        answers,
        message,
        createdAt: nowIso,
        updatedAt: nowIso
      });
    } catch (e) {
      const detail = e?.response?.data || e?.message || e;
      console.error('createScore failed:', detail);
      return res.status(422).json({ error: 'Score persist failed', detail });
    }

    const savedId = String(saved?._id || saved?.id || Date.now());

    // 5) Pinecone upsert (fire & forget)
    const metadataRaw = {
      user: String(user),
      totalScore: Number(totalScore),
      type: "quiz",
      answers: asStringList(answers),                // Pinecone-safe
      answers_raw_json: JSON.stringify(answers),     // useful for later parsing
      scoreId: savedId,
      timestamp: nowIso
    };
    const metadataSafe = toPineconeSafeMetadata
      ? toPineconeSafeMetadata(metadataRaw)
      : metadataRaw;

    upsertTexts(
      [savedId],
      [message],      // text to embed
      [metadataSafe],
      'mental_health' // optional namespace
    ).catch(err => {
      console.error('Non-critical Pinecone upsert error (quiz):', err);
    });

    // 6) Respond
    return res.status(201).json({
      id: savedId,
      totalScore,
      message
    });
  } catch (err) {
    console.error('Quiz submission failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function saveFollowUp(req, res) {
  try {
    const { id, followUp } = req.body;

    if (!id || !Array.isArray(followUp)) {
      return res.status(400).json({ error: 'Invalid followUp submission' });
    }

    // 1) Update follow-up (via repo) -> POST /mental_health/score with { id, followUp }
    let updated;
    try {
      updated = await data.updateFollowUp(id, followUp);
    } catch (e) {
      const detail = e?.response?.data || e?.message || e;
      console.error('updateFollowUp failed:', detail);
      return res.status(422).json({ error: 'Follow-up persist failed', detail });
    }
    if (!updated) {
      return res.status(404).json({ error: 'Score document not found' });
    }

    // 2) Pinecone upsert for follow-up (fire & forget)
    const nowIso = new Date().toISOString();
    const followupText = `Follow-up responses saved for score ${String(id)}.`;
    const metadataRaw = {
      type: "followup",
      user: String(updated.user || "guest"),
      scoreDocId: String(id),
      answers: asStringList(followUp),
      answers_raw_json: JSON.stringify(followUp),
      timestamp: nowIso
    };
    const metadataSafe = toPineconeSafeMetadata
      ? toPineconeSafeMetadata(metadataRaw)
      : metadataRaw;

    upsertTexts(
      [String(id) + "-followup"],
      [followupText],
      [metadataSafe],
      'mental_health'
    ).catch(err => {
      console.error('Non-critical Pinecone upsert error (follow-up):', err);
    });

    return res.json({ message: 'Follow-up saved', id, followUp });
  } catch (err) {
    console.error('Follow-up save failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { calculateScore, saveFollowUp };
