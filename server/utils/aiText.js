const DEFAULT_PROVIDER = "auto";
const DEFAULT_COOLDOWN_MS = 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_COOLDOWN_THRESHOLD = 3;

const providerState = {
  gemini: {
    rateLimitHits: [],
    cooldownUntil: 0,
  },
  openai: {
    rateLimitHits: [],
    cooldownUntil: 0,
  },
};

const parseRetryAfterMs = (headerValue) => {
  if (!headerValue) return 0;
  const numericSeconds = Number(headerValue);
  if (Number.isFinite(numericSeconds) && numericSeconds > 0) {
    return Math.floor(numericSeconds * 1000);
  }

  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return 0;
};

const getProviderState = (provider) => providerState[provider] || providerState.gemini;

const registerRateLimitHit = (provider, retryAfterMs = 0) => {
  const state = getProviderState(provider);
  const now = Date.now();
  state.rateLimitHits = state.rateLimitHits.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  state.rateLimitHits.push(now);

  const hitsExceeded = state.rateLimitHits.length >= RATE_LIMIT_COOLDOWN_THRESHOLD;
  if (hitsExceeded || retryAfterMs > 0) {
    const cooldownMs = Math.max(retryAfterMs, DEFAULT_COOLDOWN_MS);
    state.cooldownUntil = Math.max(state.cooldownUntil, now + cooldownMs);
  }
};

const isProviderCoolingDown = (provider) => {
  const state = getProviderState(provider);
  return Date.now() < state.cooldownUntil;
};

const getRemainingCooldownMs = (provider) => {
  const state = getProviderState(provider);
  return Math.max(0, state.cooldownUntil - Date.now());
};

const normalizeProvider = (value) => {
  const candidate = String(value || DEFAULT_PROVIDER).toLowerCase().trim();
  if (candidate === "gemini" || candidate === "openai" || candidate === "auto") {
    return candidate;
  }
  return DEFAULT_PROVIDER;
};

const validateOpenAIKey = (rawKey) => {
  const key = String(rawKey || "");
  const trimmed = key.trim();

  if (!trimmed) {
    return { valid: false, reason: "OpenAI API key is missing" };
  }

  if (trimmed.includes("\n") || trimmed.includes("\r") || /\s/.test(trimmed)) {
    return {
      valid: false,
      reason: "OpenAI API key appears malformed (contains whitespace/newline).",
    };
  }

  if (!trimmed.startsWith("sk-")) {
    return {
      valid: false,
      reason: "OpenAI API key appears malformed (expected to start with sk-).",
    };
  }

  return { valid: true, key: trimmed };
};

const hasGeminiKey = () => Boolean(process.env.GEMINI_API_KEY);
const hasOpenAIKey = () => validateOpenAIKey(process.env.OPENAI_API_KEY).valid;

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
  if (isProviderCoolingDown("gemini")) {
    const seconds = Math.ceil(getRemainingCooldownMs("gemini") / 1000);
    throw new Error(`Gemini temporarily cooling down after rate limiting (${seconds}s remaining)`);
  }

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
    const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
    let detail = "";

    try {
      const payload = await response.json();
      detail =
        payload?.error?.message ||
        payload?.message ||
        "";
    } catch {
      // ignore json parse failures
    }

    if (response.status === 429) {
      registerRateLimitHit("gemini", retryAfterMs);
    }

    throw new Error(
      `Gemini request failed with status ${response.status}${detail ? `: ${detail}` : ""}`
    );
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
  if (isProviderCoolingDown("openai")) {
    const seconds = Math.ceil(getRemainingCooldownMs("openai") / 1000);
    throw new Error(`OpenAI temporarily cooling down after rate limiting (${seconds}s remaining)`);
  }

  const keyValidation = validateOpenAIKey(process.env.OPENAI_API_KEY);
  if (!keyValidation.valid) {
    throw new Error(keyValidation.reason || "OpenAI API key is invalid");
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
      Authorization: `Bearer ${keyValidation.key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
    let detail = "";

    try {
      const payload = await response.json();
      detail =
        payload?.error?.message ||
        payload?.message ||
        "";
    } catch {
      // ignore json parse failures
    }

    if (response.status === 429) {
      registerRateLimitHit("openai", retryAfterMs);
    }

    throw new Error(
      `OpenAI request failed with status ${response.status}${detail ? `: ${detail}` : ""}`
    );
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
