// routes/agentRoutes.js
const express = require('express');
const { agentHandler } = require('../controllers/agentController');

const router = express.Router();

// Small helper to surface async errors to Express' error middleware
const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/agent
router.post('/agent', asyncRoute(agentHandler));

module.exports = router;
