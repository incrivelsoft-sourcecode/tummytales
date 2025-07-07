// controllers/agentController.js
require("dotenv").config();
const fetch = require("node-fetch");
const Scores = require("../models/scores");
const Chat = require("../models/chat");
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
    message   = (message   || "").trim();
    sessionId = (sessionId || "").trim();

    if (!message)   return res.status(400).json({ error: "Empty message." });
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId." });

    // 1) Try to load quiz context (optional)
    let scoreDoc = null;
    if (scoreDocId) {
      scoreDoc = await Scores.findById(scoreDocId).lean();
    }

    // 2) Load or create chat session (scoreDocId optional)
    let chatDoc = await Chat.findOne({ sessionId });
    if (!chatDoc) {
      chatDoc = await Chat.create({
        sessionId,
        userId: userId || null,
        scoreDocId: scoreDocId || undefined,
        messages: []
      });
    } else if (scoreDocId && !chatDoc.scoreDocId) {
      // If quiz just finished, add it to the chatDoc
      chatDoc.scoreDocId = scoreDocId;
      await chatDoc.save();
    }

    // 3) Persist user message (DB + Pinecone)
    const userTimestamp = new Date();
    chatDoc.messages.push({ role: "user", content: message, timestamp: userTimestamp });
    await chatDoc.save();
    await upsertTexts(
      [`${String(sessionId)}-user-${userTimestamp.getTime()}`],
      [message],
      [{
        sessionId: String(sessionId),
        userId: String(userId),
        type: "chat",
        role: "user",
        scoreDocId: scoreDocId ? String(scoreDocId) : undefined,
        timestamp: userTimestamp.toISOString()
      }]
    );

    // 4) RAG: fetch relevant history for this session from Pinecone
    const relevant = await queryText(message, 7, { sessionId: String(sessionId) });
    const ragBlock = relevant.length
      ? "\n\n### Context from your history:\n" +
        relevant.map(r => {
          let label = '';
          if (r.metadata?.type === 'quiz') label = '**Quiz:** ';
          else if (r.metadata?.type === 'followup') label = '**Follow-Up:** ';
          else if (r.metadata?.role === 'user') label = '**You:** ';
          else if (r.metadata?.role === 'assistant') label = '**Counselor:** ';
          return `${label}${r.text}`;
        }).join("\n\n")
      : "";

    // 5) Build system prompt for an empathetic counselor
    let quizFeedback = "";
    let followUpAnswers = "";

    if (scoreDoc) {
      quizFeedback = scoreDoc.message || "";
      followUpAnswers = Array.isArray(scoreDoc.followUp)
        ? scoreDoc.followUp.join(", ")
        : "";
    }

    const systemPrompt = `
You are an empathetic, compassionate mental health counselor AI, specifically designed to support pregnant women.

Your goals:
- Listen non-judgmentally to each user, understanding they are pregnant and may be experiencing a wide range of emotions or challenges.
- Always use a gentle, caring, and human tone.
- Offer practical resources for pregnant women (such as support helplines, meditation videos, articles on pregnancy wellbeing, etc.) when appropriate.
- Ask open-ended, empathetic questions to encourage sharing and reflection.
- Validate feelings, normalize common pregnancy worries, and show warmth and understanding in your responses.
- Structure your replies using markdown: **bold headings**, bullet points, and links as needed.
- Never mention scores, numbers, or anything clinical.
- Avoid offering medical diagnoses or advice—focus on emotional support and well-being.
- When recommending a video, article, or support line, ALWAYS include a working web link (https://...) or phone number.
- Do not just say "here's a video" or "here's an article"—include the actual clickable URL.

${quizFeedback ? `**Quiz feedback:** ${quizFeedback}` : ""}
${followUpAnswers ? `\nFollow-up answers: [${followUpAnswers}]` : ""}
${ragBlock}

Always remember you are here to help and listen as a supportive companion during pregnancy.
    `.trim();

    // 6) Call Cohere
    const payload = [
      { role: "system", content: systemPrompt },
      ...chatDoc.messages.map(m => (
        { role: m.role, content: m.content }
      ))
    ];

    const apiRes = await fetch(COHERE_CHAT_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_KEY}`,
        "Content-Type":  "application/json"
      },
      body: JSON.stringify({
        model:        "command-xlarge-nightly",
        messages:     payload,
        max_tokens:   1024,
        temperature:  0.8,
        stream:       false
      })
    });
    const apiJson = await apiRes.json();
    if (!apiRes.ok) {
      console.error("Cohere error", apiJson);
      return res.status(502).json({ error: "Cohere failed", details: apiJson });
    }

    // 7) Extract AI reply
    let reply = "";
    if (apiJson.message?.content?.[0]?.text) {
      reply = apiJson.message.content[0].text.trim();
    } else if (apiJson.generations?.[0]?.text) {
      reply = apiJson.generations[0].text.trim();
    }
    if (!reply) {
      return res.status(502).json({ error: "Empty reply from Cohere", response: apiJson });
    }

    // 8) Save assistant reply to DB + Pinecone
    const asstTimestamp = new Date();
    chatDoc.messages.push({ role: "assistant", content: reply, timestamp: asstTimestamp });
    await chatDoc.save();
    await upsertTexts(
      [`${String(sessionId)}-assistant-${asstTimestamp.getTime()}`],
      [reply],
      [{
        sessionId: String(sessionId),
        userId: String(userId),
        type: "chat",
        role: "assistant",
        scoreDocId: scoreDocId ? String(scoreDocId) : undefined,
        timestamp: asstTimestamp.toISOString()
      }]
    );

    // 9) Return
    return res.json({ reply, sessionId });
  } catch (err) {
    console.error("agentHandler error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { agentHandler };
