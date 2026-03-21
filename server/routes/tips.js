import express from "express";
import { generateTextWithFallback } from "../utils/aiText.js";

const router = express.Router();

const DEFAULT_TIP_REFRESH_HOURS = 24;
const REFRESH_HOURS = (() => {
  const parsed = Number.parseInt(process.env.TIP_REFRESH_HOURS || `${DEFAULT_TIP_REFRESH_HOURS}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIP_REFRESH_HOURS;
})();
const TIP_CACHE_TTL_MS = REFRESH_HOURS * 60 * 60 * 1000;
const DEFAULT_FALLBACK_RETRY_MINUTES = 60;
const FALLBACK_RETRY_MINUTES = (() => {
  const parsed = Number.parseInt(
    process.env.TIP_FALLBACK_RETRY_MINUTES || `${DEFAULT_FALLBACK_RETRY_MINUTES}`,
    10
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FALLBACK_RETRY_MINUTES;
})();
const FALLBACK_RETRY_TTL_MS = FALLBACK_RETRY_MINUTES * 60 * 1000;

const tipsCache = new Map();

const FALLBACK_TIPS = [
  "Irrigate crops early in the morning to reduce evaporation and improve water-use efficiency.",
  "Rotate cereals with legumes to naturally improve soil nitrogen and reduce fertilizer cost.",
  "Use yellow sticky traps in fields to monitor and reduce common sucking pests early.",
  "Keep weeds under control during the first 30 to 40 days after sowing for better yields.",
  "Split nitrogen fertilizer application into multiple doses to improve crop uptake.",
  "Test soil once before each major season and choose fertilizers based on soil health card values.",
  "Avoid overwatering; check topsoil moisture before every irrigation cycle.",
  "Store harvested grains at safe moisture levels to prevent fungal growth and post-harvest loss.",
  "Scout fields at least twice a week so pest or disease outbreaks are caught early.",
  "Use mulching around vegetable crops to conserve moisture and suppress weeds.",
];

const getCachedTip = () => {
  const cached = tipsCache.get("daily-tip");
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    tipsCache.delete("daily-tip");
    return null;
  }

  return cached;
};

const setCachedTip = (tip, source, ttlMs = TIP_CACHE_TTL_MS) => {
  const fetchedAt = new Date().toISOString();
  const nextRefreshAt = new Date(Date.now() + ttlMs).toISOString();

  const payload = {
    tip,
    source,
    fetchedAt,
    nextRefreshAt,
    stale: false,
  };

  tipsCache.set("daily-tip", {
    ...payload,
    ttlMs,
    expiresAt: Date.now() + ttlMs,
  });

  return payload;
};

const pickDeterministicFallbackTip = () => {
  const daySeed = new Date().toISOString().slice(0, 10);
  const hash = [...daySeed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return FALLBACK_TIPS[hash % FALLBACK_TIPS.length];
};

const buildTipPrompt = () =>
  [
    "You are an agricultural advisor for Indian farmers.",
    "Return exactly one practical and concise daily farming tip.",
    "The tip must be a single sentence and under 180 characters.",
    "Do not include markdown, numbering, or extra labels.",
  ].join(" ");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchLiveTip = async () => {
  const maxAttempts = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await generateTextWithFallback({
        prompt: buildTipPrompt(),
        temperature: 0.7,
        maxOutputTokens: 80,
      });

      const cleaned = result.text.replace(/\s+/g, " ").trim().replace(/^"|"$/g, "");
      if (!cleaned) {
        throw new Error("AI provider returned empty tip text");
      }

      return cleaned;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        break;
      }
      await sleep(800 * attempt);
    }
  }

  throw lastError || new Error("Live tip generation failed");
};

router.get("/daily", async (_req, res) => {
  try {
    const cached = getCachedTip();
    if (cached) {
      return res.json({
        tip: cached.tip,
        source: cached.source,
        fetchedAt: cached.fetchedAt,
        nextRefreshAt: cached.nextRefreshAt,
        stale: false,
        cache: { hit: true, ttlMs: cached.ttlMs || TIP_CACHE_TTL_MS },
      });
    }

    try {
      const aiTip = await fetchLiveTip();
      if (aiTip) {
        const payload = setCachedTip(aiTip, "ai");
        return res.json({
          ...payload,
          cache: { hit: false, ttlMs: TIP_CACHE_TTL_MS },
        });
      }
    } catch (error) {
      console.warn("[tips] Live generation failed, using fallback tip:", error?.message || error);
    }

    const fallbackTip = pickDeterministicFallbackTip();
    const payload = setCachedTip(fallbackTip, "fallback", FALLBACK_RETRY_TTL_MS);
    return res.json({
      ...payload,
      cache: { hit: false, ttlMs: FALLBACK_RETRY_TTL_MS },
    });
  } catch (error) {
    const fallbackTip = pickDeterministicFallbackTip();
    return res.status(200).json({
      tip: fallbackTip,
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      nextRefreshAt: new Date(Date.now() + FALLBACK_RETRY_TTL_MS).toISOString(),
      stale: true,
      cache: { hit: false, ttlMs: FALLBACK_RETRY_TTL_MS },
      message: "Tip service recovered using fallback content.",
    });
  }
});

export default router;
