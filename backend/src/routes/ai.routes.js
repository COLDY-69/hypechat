import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Smart Message Suggestions
router.post("/suggest", async (req, res) => {
  const { conversationHistory, currentInput } = req.body;
  try {
    const prompt = `You are a helpful assistant inside a chat app. Given the conversation history and the user's partial input, suggest 3 short, natural message completions or replies. Return ONLY a JSON array of 3 strings, no explanation, no markdown.
    
Conversation so far: ${JSON.stringify(conversationHistory)}
User is typing: "${currentInput}"
Suggest 3 replies.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const suggestions = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json({ suggestions });
  } catch (err) {
    console.error("AI suggest error:", err);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
});

// Chat Summary
router.post("/summarize", async (req, res) => {
  const { messages } = req.body;
  try {
    const chatText = messages.map((m) => `${m.sender}: ${m.content}`).join("\n");
    const prompt = `Summarize this chat conversation in 3-4 sentences:\n\n${chatText}`;
    const result = await model.generateContent(prompt);
    res.json({ summary: result.response.text() });
  } catch (err) {
    console.error("AI summarize error:", err);
    res.status(500).json({ error: "Failed to summarize" });
  }
});

export default router;