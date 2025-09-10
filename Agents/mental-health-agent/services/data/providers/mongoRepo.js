const Questions = require('../../../models/questions');
const Scores    = require('../../../models/scores');
const Chat      = require('../../../models/chat');

module.exports = {
  getQuestions: () => Questions.find({}).sort({ serialNumber: 1 }).lean(),
  createScore: (doc) => Scores.create(doc),
  updateFollowUp: (id, followUp) =>
    Scores.findByIdAndUpdate(id, { followUp }, { new: true }),
  getScoresByUser: (userId) =>
    Scores.find({ user: userId }).sort({ createdAt: -1 }).lean(),
  getChatBySession: (sessionId) =>
    Chat.findOne({ sessionId }).lean(),
  getChatsByUser: (userId) =>
    Chat.find({ userId }).sort({ updatedAt: -1 }).lean(),
  upsertChatMessage: ({ sessionId, userId, scoreDocId, role, content }) =>
    Chat.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: { sessionId, userId: userId || null, scoreDocId: scoreDocId || null },
        $push: { messages: { role, content, timestamp: new Date() } }
      },
      { upsert: true, new: true }
    )
};
