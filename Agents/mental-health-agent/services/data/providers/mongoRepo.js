// services/data/providers/mongoRepo.js
// HTTP-backed shim to replace the old Mongo repo implementation.
// Any code that still requires the old mongoRepo will transparently use the HTTP provider.

const http = require('./httpRepo'); // assumes httpRepo.js is in the same folder

module.exports = {
  // Questions
  getQuestions: async () => {
    // http.getQuestions already returns an array or falls back to local questions
    return http.getQuestions();
  },

  // Scores
  createScore: async (doc) => {
    // http.createScore tries multiple payload shapes and returns either persisted doc or synthetic
    return http.createScore(doc);
  },

  updateFollowUp: async (idOrFullScore, maybeFollowUp) => {
    /**
     * Original mongo version accepted (id, followUp).
     * http.updateFollowUp expects a full score doc. This shim attempts to be flexible:
     * - If caller passed a fullScore object => forward it (optionally attach followUp).
     * - If caller passed (id, followUp) => build a minimal fullScore { id, followUp } and forward.
     *
     * If your unified API requires additional fields in the fullScore, callers should pass the
     * full score object instead — or we can extend this shim to fetch the full doc first.
     */
    try {
      if (typeof idOrFullScore === 'object' && idOrFullScore !== null) {
        const fullScore = { ...idOrFullScore };
        if (maybeFollowUp !== undefined) fullScore.followUp = maybeFollowUp;
        return http.updateFollowUp(fullScore);
      }

      // caller provided (id, followUp)
      const id = idOrFullScore;
      const followUp = maybeFollowUp;
      const fullScore = { id, followUp };
      return http.updateFollowUp(fullScore);
    } catch (e) {
      throw e;
    }
  },

  getScoresByUser: async (userId) => {
    return http.getScoresByUser(userId);
  },

  // Chat
  getChatBySession: async (sessionId) => {
    return http.getChatBySession(sessionId);
  },

  getChatsByUser: async (userId) => {
    return http.getChatsByUser(userId);
  },

  upsertChatMessage: async ({ sessionId, userId, scoreDocId, role, content }) => {
    // keep same signature as original mongoRepo.upsertChatMessage
    return http.upsertChatMessage({ sessionId, userId, role, content, scoreDocId });
  }
};
