const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  sessionId:  { type: String, required: true, unique: true },
  userId:     { type: String, required: true },
  scoreDocId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scores', required: false },
  messages:   { type: [messageSchema], default: [] }
});

module.exports = mongoose.model('Chat', chatSchema);
