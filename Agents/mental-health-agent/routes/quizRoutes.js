// routes/quizRoutes.js

const express           = require('express');
const router            = express.Router();
const Questions         = require('../models/questions');
const followUps         = require('../data/followUpQuestions.json');
const { calculateScore,
        saveFollowUp   } = require('../controllers/quizController');

/**
 * GET /api/questions
 * Returns the 10 scored questions from MongoDB
 */
router.get('/questions', async (req, res, next) => {
  try {
    const qs = await Questions
      .find()
      .sort({ serialNumber: 1 })
      .lean();
    res.json(qs);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/score
 * Body: { user: String, testResponses: { "1": Number, …, "10": Number } }
 * Calculates totalScore, saves raw answers + scoreInfo, and returns { id, totalScore, message }
 */
router.post('/score', calculateScore);

/**
 * GET /api/followup
 * Returns the 5 static follow-up questions
 */
router.get('/followup', (req, res) => {
  res.json(followUps);
});

/**
 * POST /api/followup
 * Body: { id: "<Scores._id>", followUp: [Number,Number,Number,Number,Number] }
 * Saves the follow-up answers into the existing Scores document
 */
router.post('/followup', saveFollowUp);

module.exports = router;
