// controllers/quizController.js
const Scores    = require('../models/scores');
const Questions = require('../models/questions');
const { upsertTexts } = require('../services/memoryService');

async function calculateScore(req, res) {
  try {
    const { user = 'guest', testResponses } = req.body;
    if (!testResponses || typeof testResponses !== 'object') {
      return res.status(400).json({ error: 'Invalid testResponses format' });
    }

    // Load & validate questions
    const questions = await Questions.find()
                                    .sort({ serialNumber: 1 })
                                    .lean();
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

    // Save directly—no transaction
    const saved = await Scores.create({
      user,
      totalScore,
      scoreInfo,
      answers,
      message
    });

    // Fire & forget the Pinecone memory upsert (won't block response)
    upsertTexts(
      [String(saved._id)],
      [saved.message],
      [{
        user: String(saved.user),
        totalScore: saved.totalScore,
        type: "quiz",
        answers: saved.answers,
        timestamp: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString()
      }]
    ).catch(err => {
      console.error('Non-critical Pinecone upsert error:', err);
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
    if (!id || !Array.isArray(followUp) || followUp.length !== 5) {
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
    return res.json({ message: 'Follow-up saved' });
  } catch (err) {
    console.error('Follow-up save failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { calculateScore, saveFollowUp };
