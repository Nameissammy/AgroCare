import express from "express";
import { generateTextWithFallback } from "../utils/aiText.js";

const router = express.Router();

const CHAT_SYSTEM_INSTRUCTION =
  "You are an expert agricultural assistant for Indian farmers. Provide practical, accurate, and helpful advice on crop management, pest control, mandi prices, weather preparedness, and government schemes. Keep responses concise and easy to understand. If asked about exact live mandi prices, suggest checking the app's Mandi Prices section.";

const buildRuleBasedFallbackReply = (message) => {
  const text = String(message || "").toLowerCase();

  if (text.includes("price") || text.includes("mandi")) {
    return "For latest rates, please check the Mandi Prices section. As a quick rule, compare modal prices across nearby markets before selling and track daily trend movement.";
  }

  if (text.includes("disease") || text.includes("pest") || text.includes("infection")) {
    return "Please upload a clear crop image in Disease Detection for accurate diagnosis. Meanwhile, isolate affected plants, avoid overhead irrigation, and remove heavily infected leaves.";
  }

  if (text.includes("water") || text.includes("irrigation")) {
    return "Irrigate in early morning or late evening to reduce evaporation. Keep soil moist but not waterlogged, and adjust frequency based on crop stage and local temperature.";
  }

  return "I’m temporarily on backup mode. Start with field scouting twice a week, timely irrigation, and balanced fertilizer based on soil condition. Ask a specific crop question for targeted guidance.";
};

router.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    const trimmedHistory = Array.isArray(history)
      ? history
          .filter((item) => item && typeof item.content === "string" && (item.role === "user" || item.role === "bot"))
          .slice(-8)
      : [];

    const historyBlock = trimmedHistory.length
      ? `Conversation history:\n${trimmedHistory
          .map((item) => `${item.role === "bot" ? "Assistant" : "User"}: ${item.content}`)
          .join("\n")}`
      : "";

    const prompt = `${historyBlock}${historyBlock ? "\n\n" : ""}User: ${message.trim()}\nAssistant:`;

    const result = await generateTextWithFallback({
      prompt,
      systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      temperature: 0.5,
      maxOutputTokens: 350,
    });

    return res.json({
      reply: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error("[ai] Chat generation failed:", error);
    return res.status(200).json({
      reply: buildRuleBasedFallbackReply(req.body?.message),
      provider: "fallback",
      model: "rule-based",
      warning: "Live AI generation unavailable; served fallback response.",
    });
  }
});

export default router;
