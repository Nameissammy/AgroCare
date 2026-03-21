import express from "express";
import { generateTextWithFallback } from "../utils/aiText.js";

const router = express.Router();

const SUPPORTED_LANGUAGES = new Set(["en", "hi", "ta", "te", "kn", "ml", "or"]);

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  or: "Odia",
};

const CHAT_SYSTEM_INSTRUCTION = (language = "en") =>
  `You are an expert agricultural assistant for Indian farmers. Always respond in ${LANGUAGE_NAMES[language] || "English"}. Provide practical, accurate, and helpful advice on crop management, pest control, mandi prices, weather preparedness, and government schemes. Keep responses concise and easy to understand. If asked about exact live mandi prices, suggest checking the app's Mandi Prices section.`;

const FALLBACK_REPLIES = {
  en: {
    price: "For latest rates, please check the Mandi Prices section. As a quick rule, compare modal prices across nearby markets before selling and track daily trend movement.",
    disease: "Please upload a clear crop image in Disease Detection for accurate diagnosis. Meanwhile, isolate affected plants, avoid overhead irrigation, and remove heavily infected leaves.",
    irrigation: "Irrigate in early morning or late evening to reduce evaporation. Keep soil moist but not waterlogged, and adjust frequency based on crop stage and local temperature.",
    default: "I’m temporarily on backup mode. Start with field scouting twice a week, timely irrigation, and balanced fertilizer based on soil condition. Ask a specific crop question for targeted guidance.",
  },
  hi: {
    price: "नवीनतम दरों के लिए मंडी भाव अनुभाग देखें। बेचने से पहले पास की मंडियों के मोडल भाव की तुलना करें और दैनिक रुझान देखें।",
    disease: "सटीक पहचान के लिए रोग पहचान अनुभाग में फसल की स्पष्ट फोटो अपलोड करें। तब तक प्रभावित पौधों को अलग रखें और बहुत संक्रमित पत्तियां हटा दें।",
    irrigation: "सिंचाई सुबह जल्दी या शाम को करें ताकि पानी की बचत हो। मिट्टी नम रखें, जलभराव न होने दें, और फसल अवस्था के अनुसार सिंचाई अंतराल तय करें।",
    default: "मैं अभी बैकअप मोड में हूं। हफ्ते में दो बार खेत का निरीक्षण करें, समय पर सिंचाई करें और मिट्टी की स्थिति के अनुसार संतुलित उर्वरक दें।",
  },
};

const resolveLanguage = (language) => {
  const normalized = String(language || "en").toLowerCase().trim();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : "en";
};

const buildRuleBasedFallbackReply = (message, language = "en") => {
  const text = String(message || "").toLowerCase();
  const messages = FALLBACK_REPLIES[language] || FALLBACK_REPLIES.en;

  if (text.includes("price") || text.includes("mandi")) {
    return messages.price;
  }

  if (text.includes("disease") || text.includes("pest") || text.includes("infection")) {
    return messages.disease;
  }

  if (text.includes("water") || text.includes("irrigation")) {
    return messages.irrigation;
  }

  return messages.default;
};

router.post("/chat", async (req, res) => {
  try {
    const { message, history = [], language } = req.body || {};
    const resolvedLanguage = resolveLanguage(language);

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
      systemInstruction: CHAT_SYSTEM_INSTRUCTION(resolvedLanguage),
      temperature: 0.5,
      maxOutputTokens: 350,
    });

    return res.json({
      reply: result.text,
      provider: result.provider,
      model: result.model,
      language: resolvedLanguage,
    });
  } catch (error) {
    console.error("[ai] Chat generation failed:", error);
    const resolvedLanguage = resolveLanguage(req.body?.language);
    return res.status(200).json({
      reply: buildRuleBasedFallbackReply(req.body?.message, resolvedLanguage),
      provider: "fallback",
      model: "rule-based",
      language: resolvedLanguage,
      warning: "Live AI generation unavailable; served fallback response.",
    });
  }
});

export default router;
