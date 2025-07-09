// routes/agentRoutes.js
const express = require("express");
const { agentHandler } = require("../controllers/agentController");

const router = express.Router();

// If your backend API uses "/api/agent", use this:
router.post("/agent", agentHandler);

module.exports = router;
