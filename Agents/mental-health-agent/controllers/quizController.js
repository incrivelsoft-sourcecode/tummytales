// controllers/quizController.js
const Scores    = require('../models/scores');
const Questions = require('../models/questions');
const { upsertTexts, toPineconeSafeMetadata } = require('../services/memoryService'); // <- sanitizer exported

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

    // Load & validate questions
    const questions = await Questions.find().sort({ serialNumber: 1 }).lean();
    if (questions.length !== 10) {
      return res
        .status(500)
        .json({ error: 'Expected 10 questions in DB, found ' + questions.length });
    }

    // Compute totalScore, scoreInfo, answers
    let totalScore = 0;
    const scoreInfo = [];
    const answers   = [];

    for (const q of questions) {
      const idx = testResponses[q.serialNumber];
      if (idx == null || idx < 0 || idx >= q.answers.length) {
        return res
          .status(400)
          .json({ error: `Invalid answer for question ${q.serialNumber}` });
      }
      const sc = q.answers[idx].score;
      totalScore += sc;
      scoreInfo.push({ questionId: q.serialNumber, score: sc });
      answers.push({ questionId: q.serialNumber, answerIndex: idx });
    }

    // Pick feedback message
    const lastScore = scoreInfo[scoreInfo.length - 1].score;
    const message =
      totalScore > 10 || lastScore > 0
        ? "Thank you for completing the questionnaire. It looks like you might be facing some emotional challenges—consider reaching out for support."
        : "Thank you for completing the questionnaire!";

    // Save score
    const saved = await Scores.create({
      user,
      totalScore,
      scoreInfo,
      answers,
      message
    });

    // ---- Pinecone upsert (fire & forget) ----
    // Build Pinecone-safe metadata explicitly.
    const metadataRaw = {
      user: String(saved.user),
      totalScore: Number(saved.totalScore),
      type: "quiz",
      // answers is the common offender; ensure it's a list of strings:
      answers: asStringList(saved.answers),
      // keep a raw snapshot if you want to search it later
      answers_raw_json: JSON.stringify(saved.answers),
      timestamp: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString()
    };

    // Option A: Let service sanitizer do the final pass (recommended)
    const metadataSafe = toPineconeSafeMetadata
      ? toPineconeSafeMetadata(metadataRaw)
      : metadataRaw; // fallback if you didn't export it

    upsertTexts(
      [String(saved._id)],
      [saved.message], // text to embed
      [metadataSafe]
    ).catch(err => {
      console.error('Non-critical Pinecone upsert error (quiz):', err);
    });

    return res.status(201).json({
      id: saved._id,
      totalScore: saved.totalScore,
      message: saved.message
    });
  } catch (err) {
    console.error('Quiz submission failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function saveFollowUp(req, res) {
  try {
    const { id, followUp } = req.body;

    // If your follow-up count can vary, drop the strict length check:
    if (!id || !Array.isArray(followUp) /* || followUp.length !== 5 */) {
      return res.status(400).json({ error: 'Invalid followUp submission' });
    }

    const updated = await Scores.findByIdAndUpdate(
      id,
      { followUp },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Score document not found' });
    }

    // ---- Pinecone upsert for follow-up (fire & forget) ----
    // You can embed a compact summary or the message again.
    const followupText = `Follow-up responses saved for score ${String(updated._id)}.`;
    const metadataRaw = {
      type: "followup",
      user: String(updated.user || "guest"),
      scoreDocId: String(updated._id),
      // followUp may be array of indices or objects; make it list of strings:
      answers: asStringList(updated.followUp),
      answers_raw_json: JSON.stringify(updated.followUp),
      timestamp: new Date().toISOString()
    };
    const metadataSafe = toPineconeSafeMetadata
      ? toPineconeSafeMetadata(metadataRaw)
      : metadataRaw;

    upsertTexts(
      [String(updated._id) + "-followup"],
      [followupText],
      [metadataSafe]
    ).catch(err => {
      console.error('Non-critical Pinecone upsert error (follow-up):', err);
    });

    return res.json({ message: 'Follow-up saved' });
  } catch (err) {
    console.error('Follow-up save failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { calculateScore, saveFollowUp };
