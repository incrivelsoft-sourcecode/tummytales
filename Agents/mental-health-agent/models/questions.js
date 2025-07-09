// models/questions.js
// ────────────────────────
// No changes needed here; this schema already defines your 10 scored questions.
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  text:  { type: String, required: true },
  score: { type: Number, required: true }
});

const questionSchema = new mongoose.Schema({
  serialNumber: { type: Number, required: true },
  question:     { type: String, required: true },
  answers:      { type: [answerSchema], required: true }
});

module.exports = mongoose.model('Questions', questionSchema);
