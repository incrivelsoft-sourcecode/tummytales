// models/scores.js
// ─────────────────────────────────────────────
// Schema for storing quiz results & follow-up answers
const mongoose = require("mongoose");
const { Schema } = mongoose;

const scoreSchema = new Schema({
  user: {
    type: String,
    required: false  // true if you always pass a user identifier
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
  // Raw answers for future charting/visualization
  answers: [{
    questionId:  { type: Number, required: true },
    answerIndex: { type: Number, required: true }
  }],
  message: {
    type: String,
    required: true
  },
  followUp: {
    type: [Number],       // stores the 5 follow-up answers as indices
    default: [],          // empty until the client submits them
    validate: arr => arr.length <= 5
  }
}, { timestamps: true });

// Explicit collection name: mental_health_agent_scores
module.exports =
  mongoose.models.MentalScores ||
  mongoose.model("MentalScores", scoreSchema, "mental_health_agent_scores");
