// routes/quizRoutes.js
const express = require('express');
const router = express.Router();

const data = require('../services/data'); // http | mongo via DATA_PROVIDER
const followUps = require('../data/followUpQuestions.json');
const { calculateScore, saveFollowUp } = require('../controllers/quizController');

// Helper to surface async errors to Express' error middleware
const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * GET /api/questions
 * Returns the 10 scored questions from the configured data provider
 * (unified HTTP API in http mode, Mongo in mongo mode)
 */
router.get('/questions', asyncRoute(async (_req, res) => {
  const qs = await data.getQuestions();           // <-- no Mongoose here
  res.json(qs);
}));

/**
 * POST /api/score
 * Body: { user?: String, testResponses: { "1": Number, …, "10": Number } }
 * Calculates totalScore, persists via repo, and returns { id, totalScore, message }
 */
router.post('/score', asyncRoute(calculateScore));

/**
 * GET /api/followup
 * Returns the 5 static follow-up questions (served locally)
 */
router.get('/followup', (_req, res) => {
  res.json(followUps);
});

/**
 * POST /api/followup
 * Body: { id: "<Scores._id>", followUp: [Number, Number, Number, Number, Number] }
 * Saves follow-up answers via repo
 */
router.post('/followup', asyncRoute(saveFollowUp));

module.exports = router;
