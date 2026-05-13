import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── Smart Message Suggestions ───────────────────────────────
router.post("/suggest", async (req, res) => {
  const { conversationHistory, currentInput } = req.body;

  try {
    console.log("BODY:", req.body);

    const prompt = `
You are a helpful assistant inside a chat app.
Given the conversation history and the user's partial input,
suggest 3 short natural replies.
Return ONLY a valid JSON array of 3 strings, no explanation, no markdown.

Example: ["Hey!", "How are you?", "Sounds good"]

Conversation:
${JSON.stringify(conversationHistory)}

User typing: "${currentInput}"
`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    const text = result.choices[0].message.content.trim();
    console.log("RAW GROQ RESPONSE:", text);

    const cleaned = text.replace(/```json|```/g, "").trim();
    const suggestions = JSON.parse(cleaned);

    res.json({ suggestions });

  } catch (err) {
    console.error("AI suggest error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Chat Summary ─────────────────────────────────────────────
router.post("/summarize", async (req, res) => {
  const { messages } = req.body;

  try {
    const chatText = messages
      .map((m) => `${m.sender}: ${m.content}`)
      .join("\n");

    const prompt = `
Summarize this chat conversation in 3-4 sentences:

${chatText}
`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    const summary = result.choices[0].message.content.trim();
    res.json({ summary });

  } catch (err) {
    console.error("AI summarize error:", err);
    res.status(500).json({ error: "Failed to summarize" });
  }
});

export default router;