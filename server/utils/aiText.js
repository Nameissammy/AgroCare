const DEFAULT_PROVIDER = "auto";

const normalizeProvider = (value) => {
  const candidate = String(value || DEFAULT_PROVIDER).toLowerCase().trim();
  if (candidate === "gemini" || candidate === "openai" || candidate === "auto") {
    return candidate;
  }
  return DEFAULT_PROVIDER;
};

const hasGeminiKey = () => Boolean(process.env.GEMINI_API_KEY);
const hasOpenAIKey = () => Boolean(process.env.OPENAI_API_KEY);

const getProviderOrder = () => {
  const preferred = normalizeProvider(process.env.AI_PROVIDER);
  const available = [];

  if (hasGeminiKey()) available.push("gemini");
  if (hasOpenAIKey()) available.push("openai");

  if (available.length === 0) {
    return [];
  }

  if (preferred === "gemini") {
    return ["gemini", "openai"].filter((provider) => available.includes(provider));
  }

  if (preferred === "openai") {
    return ["openai", "gemini"].filter((provider) => available.includes(provider));
  }

  return available;
};

const callGemini = async ({ prompt, systemInstruction, temperature = 0.7, maxOutputTokens = 256 }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing");
  }

  const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const finalPrompt = systemInstruction
    ? `${systemInstruction}\n\nUser request:\n${prompt}`
    : prompt;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") {
    throw new Error("Gemini returned an empty response");
  }

  return {
    text: text.trim(),
    provider: "gemini",
    model,
  };
};

const callOpenAI = async ({ prompt, systemInstruction, temperature = 0.7, maxOutputTokens = 256 }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is missing");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const messages = [];

  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("OpenAI returned an empty response");
  }

  return {
    text: text.trim(),
    provider: "openai",
    model,
  };
};

export const generateTextWithFallback = async ({
  prompt,
  systemInstruction,
  temperature = 0.7,
  maxOutputTokens = 256,
}) => {
  const providerOrder = getProviderOrder();
  if (providerOrder.length === 0) {
    throw new Error("No AI provider key configured. Set GEMINI_API_KEY and/or OPENAI_API_KEY.");
  }

  const errors = [];

  for (const provider of providerOrder) {
    try {
      if (provider === "gemini") {
        return await callGemini({ prompt, systemInstruction, temperature, maxOutputTokens });
      }
      if (provider === "openai") {
        return await callOpenAI({ prompt, systemInstruction, temperature, maxOutputTokens });
      }
    } catch (error) {
      errors.push(`${provider}: ${error?.message || error}`);
    }
  }

  throw new Error(`All configured AI providers failed. ${errors.join(" | ")}`);
};
