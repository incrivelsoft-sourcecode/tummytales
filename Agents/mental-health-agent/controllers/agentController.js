// controllers/agentController.js
require("dotenv").config();
const fetch = require("node-fetch");
const data = require("../services/data"); // http | mongo via DATA_PROVIDER
const { upsertTexts, queryText } = require("../services/memoryService");

const COHERE_KEY = process.env.COHERE_API_KEY;
const COHERE_CHAT_URL = "https://api.cohere.com/v2/chat";

if (!COHERE_KEY) {
  console.error("❌ Missing COHERE_API_KEY");
  process.exit(1);
}

async function agentHandler(req, res) {
  try {
    let { message, scoreDocId, sessionId, userId } = req.body;
    message = (message || "").trim();
    sessionId = (sessionId || "").trim();
    userId = userId || "guest";

    if (!message)   return res.status(400).json({ error: "Empty message." });
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId." });

    // 1) Optionally load latest score for the user (best-effort)
    let scoreDoc = null;
    if (userId) {
      try {
        const scores = await data.getScoresByUser(userId);
        if (Array.isArray(scores) && scores.length) {
          scoreDoc =
            (scoreDocId && scores.find(s => String(s._id) === String(scoreDocId))) ||
            scores[0];
        }
      } catch (e) {
        console.warn("⚠️ Could not load scores for user:", e.message);
      }
    }

    // 2) Persist the user message to unified API (NOTE: now sends the required shape)
    const userTimestamp = new Date();
    await data.upsertChatMessage({
      sessionId,
      userId,
      scoreDocId: scoreDocId ?? null,
      role: "user",
      content: message
    });

    // 2a) Pinecone upsert (non-blocking)
    (async () => {
      try {
        await upsertTexts(
          [`${String(sessionId)}-user-${userTimestamp.getTime()}`],
          [message],
          [{
            sessionId: String(sessionId),
            userId: String(userId || ""),
            type: "chat",
            role: "user",
            scoreDocId: scoreDocId ? String(scoreDocId) : undefined,
            timestamp: userTimestamp.toISOString()
          }]
        );
      } catch (e) {
        console.warn("⚠️ Pinecone upsert (user) failed:", e.message);
      }
    })();

    // 3) Load session history for Cohere context (best-effort)
    let chatSession = null;
    try {
      chatSession = await data.getChatBySession(sessionId);
    } catch (e) {
      console.warn("⚠️ Could not load chat session:", e.message);
    }

    // 4) RAG from vector DB (best-effort)
    let ragBlock = "";
    try {
      const relevant = await queryText(message, 7, { sessionId: String(sessionId) });
      const matches = Array.isArray(relevant?.matches) ? relevant.matches : Array.isArray(relevant) ? relevant : [];
      if (matches.length) {
        ragBlock =
          "\n\n### Context from your history:\n" +
          matches
            .map((r) => {
              const meta = r.metadata || {};
              let label = "";
              if (meta.type === "quiz") label = "**Quiz:** ";
              else if (meta.type === "followup") label = "**Follow-Up:** ";
              else if (meta.role === "user") label = "**You:** ";
              else if (meta.role === "assistant") label = "**Counselor:** ";
              const t = r.text || meta.text || "";
              return t ? `${label}${t}` : "";
            })
            .filter(Boolean)
            .join("\n\n");
      }
    } catch (e) {
      console.warn("⚠️ Pinecone query failed (continuing without RAG):", e.message);
    }

    // 5) Build system prompt
    let quizFeedback = "";
    let followUpAnswers = "";
    if (scoreDoc) {
      quizFeedback = scoreDoc.message || "";
      if (Array.isArray(scoreDoc.followUp)) followUpAnswers = scoreDoc.followUp.join(", ");
    }

    const systemPrompt = `
You are an empathetic, compassionate mental health counselor AI, specifically designed to support pregnant women.

Your goals:
- Listen non-judgmentally to each user, understanding they are pregnant and may be experiencing a wide range of emotions or challenges.
- Always use a gentle, caring, and human tone.
- Offer practical resources for pregnant women when appropriate.
- Ask open-ended, empathetic questions to encourage sharing and reflection.
- Validate feelings, normalize common pregnancy worries, and show warmth and understanding.
- Structure replies using markdown.
- Never mention scores, numbers, or anything clinical.
- Avoid medical diagnoses or medical advice—focus on emotional support and well-being.
- When recommending a video, article, or support line, ALWAYS include a working link (https://...) or phone number.

${quizFeedback ? `**Quiz feedback:** ${quizFeedback}` : ""}
${followUpAnswers ? `\nFollow-up answers: [${followUpAnswers}]` : ""}
${ragBlock}

Always remember you are here to help and listen as a supportive companion during pregnancy.
    `.trim();

    // 6) Compose chat history for Cohere
    const history = Array.isArray(chatSession?.messages) ? chatSession.messages : [];
    const payload = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ];

    // 7) Cohere call
    const apiRes = await fetch(COHERE_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COHERE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-xlarge-nightly",
        messages: payload,
        max_tokens: 1024,
        temperature: 0.8,
        stream: false,
      }),
    });

    const apiJson = await apiRes.json().catch(() => ({}));
    if (!apiRes.ok) {
      console.error("Cohere error", apiJson);
      return res.status(502).json({ error: "Cohere failed", details: apiJson });
    }

    let reply =
      apiJson?.message?.content?.[0]?.text?.trim?.() ||
      apiJson?.generations?.[0]?.text?.trim?.() ||
      apiJson?.text?.trim?.() ||
      "";

    if (!reply) {
      console.warn("⚠️ Empty/unknown Cohere reply shape:", JSON.stringify(apiJson).slice(0, 500));
      reply =
        "I'm here with you. Could you try rephrasing that or telling me a bit more about how you're feeling right now?";
    }

    // 8) Persist assistant message back to unified API
    const asstTimestamp = new Date();
    await data.upsertChatMessage({
      sessionId,
      userId,                // still include; backend keys by session
      scoreDocId: scoreDocId ?? null,
      role: "assistant",
      content: reply
    });

    // 8a) Pinecone (non-blocking)
    (async () => {
      try {
        await upsertTexts(
          [`${String(sessionId)}-assistant-${asstTimestamp.getTime()}`],
          [reply],
          [{
            sessionId: String(sessionId),
            userId: String(userId || ""),
            type: "chat",
            role: "assistant",
            scoreDocId: scoreDocId ? String(scoreDocId) : undefined,
            timestamp: asstTimestamp.toISOString()
          }]
        );
      } catch (e) {
        console.warn("⚠️ Pinecone upsert (assistant) failed:", e.message);
      }
    })();

    // 9) Respond to caller
    return res.json({ reply, sessionId });
  } catch (err) {
    console.error("agentHandler error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { agentHandler };
