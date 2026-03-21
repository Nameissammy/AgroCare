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

const FALLBACK_TIPS = {
  en: [
    "Irrigate crops early in the morning to reduce evaporation and improve water-use efficiency.",
    "Rotate cereals with legumes to naturally improve soil nitrogen and reduce fertilizer cost.",
    "Use yellow sticky traps in fields to monitor and reduce common sucking pests early.",
    "Keep weeds under control during the first 30 to 40 days after sowing for better yields.",
    "Split nitrogen fertilizer application into multiple doses to improve crop uptake.",
  ],
  hi: [
    "पानी की बचत के लिए सिंचाई सुबह जल्दी करें और खेत में नमी संतुलित रखें।",
    "फसल चक्र में दलहनी फसल शामिल करें ताकि मिट्टी की उर्वरता बेहतर हो।",
    "पीले स्टिकी ट्रैप से शुरुआती कीट प्रकोप की निगरानी करें।",
    "बुवाई के बाद शुरुआती 30-40 दिनों में खरपतवार नियंत्रण पर ध्यान दें।",
    "नाइट्रोजन उर्वरक को एक साथ न देकर किस्तों में दें।",
  ],
  ta: [
    "நீர்சேமிப்புக்காக அதிகாலை அல்லது மாலை நேரத்தில் பாசனம் செய்யுங்கள்.",
    "மண் வளம் அதிகரிக்க பருப்பு வகைகளை பயிர் சுழற்சியில் சேர்க்கவும்.",
    "மஞ்சள் ஸ்டிக்கி டிராப் வைத்து ஆரம்ப பூச்சி தாக்கத்தை கண்காணிக்கவும்.",
    "விதைத்த பின் முதல் 30-40 நாட்களில் களையை கட்டுப்படுத்துங்கள்.",
    "நைட்ரஜன் உரத்தை ஒரே முறையில் அல்லாமல் கட்டங்களாக அளிக்கவும்.",
  ],
  te: [
    "నీటి ఆదా కోసం ఉదయం త్వరగా లేదా సాయంత్రం సమయంలోనే నీరు పెట్టండి.",
    "మట్టి సారాన్ని పెంచేందుకు పప్పుధాన్యాలను పంట చక్రంలో చేర్చండి.",
    "ప్రారంభ దశలో పురుగు నియంత్రణకు పసుపు స్టిక్కీ ట్రాప్స్ ఉపయోగించండి.",
    "విత్తిన తర్వాత తొలి 30-40 రోజుల్లో కలుపు నియంత్రణ కీలకం.",
    "నైట్రజన్ ఎరువును విడతలుగా ఇవ్వడం మంచిది.",
  ],
  kn: [
    "ನೀರಿನ ಉಳಿವಿಗಾಗಿ ಬೆಳಿಗ್ಗೆ ಬೇಗ ಅಥವಾ ಸಂಜೆ ಹೊತ್ತಿನಲ್ಲಿ ನೀರಾವರಿ ಮಾಡಿ.",
    "ಮಣ್ಣಿನ ಸಾರ ಹೆಚ್ಚಿಸಲು ಬೆಳೆ ಪರಿವರ್ತನೆಯಲ್ಲಿ ಪಲ್ಯ ಬೆಳೆ ಸೇರಿಸಿ.",
    "ಆರಂಭಿಕ ಹಂತದ ಕೀಟ ನಿಯಂತ್ರಣಕ್ಕೆ ಹಳದಿ ಸ್ಟಿಕ್ಕಿ ಟ್ರಾಪ್ ಬಳಸಿ.",
    "ಬಿತ್ತನೆಯ ನಂತರ ಮೊದಲ 30-40 ದಿನ ಕಳೆ ನಿಯಂತ್ರಣ ಅತ್ಯಂತ ಮುಖ್ಯ.",
    "ನೈಟ್ರಜನಸ್ ರಸಗೊಬ್ಬರವನ್ನು ಹಂತ ಹಂತವಾಗಿ ನೀಡಿ.",
  ],
  ml: [
    "ജലസംരക്ഷണത്തിന് പകൽ ചൂട് കൂടും മുൻപ് സേചനം നടത്തുക.",
    "മണ്ണിന്റെ ഫലഭൂയിഷ്ഠതക്കായി വിളചക്രത്തിൽ പയർവർഗ്ഗം ഉൾപ്പെടുത്തുക.",
    "ആരംഭ ഘട്ടത്തിലെ കീടാക്രമണം കണ്ടെത്താൻ മഞ്ഞ സ്റ്റിക്കി ട്രാപ്പുകൾ ഉപയോഗിക്കുക.",
    "വിതച്ചതിന് ശേഷം ആദ്യ 30-40 ദിവസം കളനിർമ്മാർജനം ശ്രദ്ധിക്കുക.",
    "നൈട്രജൻ വളം ഒരുമിച്ച് നൽകാതെ ഘട്ടം ഘട്ടമായി നൽകുക.",
  ],
  or: [
    "ଜଳ ସଞ୍ଚୟ ପାଇଁ ସକାଳେ ସିଞ୍ଚନ କରନ୍ତୁ ଏବଂ ମାଟିର ଆର୍ଦ୍ରତା ରଖନ୍ତୁ।",
    "ମାଟି ଉର୍ବରତା ବଢାଇବାକୁ ଫସଳ ଚକ୍ରରେ ଡାଲି ଫସଳ ରଖନ୍ତୁ।",
    "ଆରମ୍ଭ ଅବସ୍ଥାରେ କୀଟ ନିୟନ୍ତ୍ରଣ ପାଇଁ ହଳଦିଆ ଷ୍ଟିକି ଟ୍ରାପ୍ ବ୍ୟବହାର କରନ୍ତୁ।",
    "ବୁନା ପରେ ପ୍ରଥମ 30-40 ଦିନ ଘାସ ନିୟନ୍ତ୍ରଣରେ ଧ୍ୟାନ ଦିଅନ୍ତୁ।",
    "ନାଇଟ୍ରୋଜେନ ସରକୁ ଏକେବାରେ ନୁହେଁ, ଧାପ ଧାପରେ ଦିଅନ୍ତୁ।",
  ],
};

const resolveLanguage = (language) => {
  const normalized = String(language || "en").toLowerCase().trim();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : "en";
};

const getCacheKey = (language) => `daily-tip:${language}`;

const getCachedTip = (language) => {
  const cached = tipsCache.get(getCacheKey(language));
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    tipsCache.delete("daily-tip");
    return null;
  }

  return cached;
};

const setCachedTip = (language, tip, source, ttlMs = TIP_CACHE_TTL_MS) => {
  const fetchedAt = new Date().toISOString();
  const nextRefreshAt = new Date(Date.now() + ttlMs).toISOString();

  const payload = {
    tip,
    source,
    fetchedAt,
    nextRefreshAt,
    stale: false,
  };

  tipsCache.set(getCacheKey(language), {
    ...payload,
    ttlMs,
    expiresAt: Date.now() + ttlMs,
  });

  return payload;
};

const pickDeterministicFallbackTip = (language = "en") => {
  const daySeed = new Date().toISOString().slice(0, 10);
  const hash = [...daySeed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const tips = FALLBACK_TIPS[language] || FALLBACK_TIPS.en;
  return tips[hash % tips.length];
};

const buildTipPrompt = (language = "en") =>
  [
    "You are an agricultural advisor for Indian farmers.",
    `Respond in ${LANGUAGE_NAMES[language] || "English"}.`,
    "Return exactly one practical and concise daily farming tip.",
    "The tip must be a single sentence and under 180 characters.",
    "Do not include markdown, numbering, or extra labels.",
  ].join(" ");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchLiveTip = async (language) => {
  const maxAttempts = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await generateTextWithFallback({
        prompt: buildTipPrompt(language),
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

router.get("/daily", async (req, res) => {
  try {
    const language = resolveLanguage(req.query?.language);
    const cached = getCachedTip(language);
    if (cached) {
      return res.json({
        tip: cached.tip,
        language,
        source: cached.source,
        fetchedAt: cached.fetchedAt,
        nextRefreshAt: cached.nextRefreshAt,
        stale: false,
        cache: { hit: true, ttlMs: cached.ttlMs || TIP_CACHE_TTL_MS },
      });
    }

    try {
      const aiTip = await fetchLiveTip(language);
      if (aiTip) {
        const payload = setCachedTip(language, aiTip, "ai");
        return res.json({
          ...payload,
          language,
          cache: { hit: false, ttlMs: TIP_CACHE_TTL_MS },
        });
      }
    } catch (error) {
      console.warn("[tips] Live generation failed, using fallback tip:", error?.message || error);
    }

    const fallbackTip = pickDeterministicFallbackTip(language);
    const payload = setCachedTip(language, fallbackTip, "fallback", FALLBACK_RETRY_TTL_MS);
    return res.json({
      ...payload,
      language,
      cache: { hit: false, ttlMs: FALLBACK_RETRY_TTL_MS },
    });
  } catch (error) {
    const language = resolveLanguage(req.query?.language);
    const fallbackTip = pickDeterministicFallbackTip(language);
    return res.status(200).json({
      tip: fallbackTip,
      language,
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
