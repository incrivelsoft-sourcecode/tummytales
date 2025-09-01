const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new Schema({
  sessionId:  { type: String, required: true, index: true }, // removed unique:true
  userId:     { type: String, required: true },
  scoreDocId: { type: Schema.Types.ObjectId, ref: 'MentalScores', required: false },
  messages:   { type: [messageSchema], default: [] }
}, { timestamps: true });

// Force correct collection name
module.exports =
  mongoose.models.MentalChats ||
  mongoose.model('MentalChats', chatSchema, 'mental_health_agent_chats');
