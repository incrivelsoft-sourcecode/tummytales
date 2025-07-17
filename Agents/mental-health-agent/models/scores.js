// models/scores.js
// ─────────────────────────────────────────────
// Now includes an `answers` array to record each questionId + chosen index.
const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  user: {
    type: String,
    required: false  // set to true if you always pass a user identifier
  },
  totalScore: {
    type: Number,
    required: true
  },
  // Breakdown of computed scores
  scoreInfo: [{
    questionId: { type: Number, required: true },
    score:      { type: Number, required: true }
  }],
  // **NEW**: Raw answers for future charting/visualization
  answers: [{
    questionId:  { type: Number, required: true },
    answerIndex: { type: Number, required: true }
  }],
  message: {
    type: String,
    required: true
  },
  followUp: {
    type: [Number],       // will store the 5 follow-up answers as indices
    default: [],          // empty until the client submits them
    validate: arr => arr.length <= 5
  }
}, { timestamps: true });

module.exports = mongoose.model("Scores", scoreSchema);
