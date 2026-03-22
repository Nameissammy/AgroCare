import express from "express";

const router = express.Router();

const SUPPORTED_LANGUAGES = new Set(["en", "hi", "ta", "te", "kn", "ml", "or"]);
const OPENWEATHER_LANG_MAP = {
  en: "en",
  hi: "hi",
  ta: "ta",
  te: "te",
  kn: "kn",
  ml: "ml",
  or: "en",
};

const DEFAULT_CACHE_MINUTES = 20;
const CACHE_MINUTES = (() => {
  const parsed = Number.parseInt(process.env.WEATHER_CACHE_MINUTES || `${DEFAULT_CACHE_MINUTES}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CACHE_MINUTES;
})();
const CACHE_TTL_MS = CACHE_MINUTES * 60 * 1000;

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
const weatherCache = new Map();

const resolveLanguage = (language) => {
  const normalized = String(language || "en").toLowerCase().trim();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : "en";
};

const getOpenWeatherLanguage = (language) => OPENWEATHER_LANG_MAP[language] || "en";

const parseCoordinate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidLatitude = (value) => value >= -90 && value <= 90;
const isValidLongitude = (value) => value >= -180 && value <= 180;

const roundCoordinate = (value) => Math.round(value * 10) / 10;

const getCacheKey = ({ lat, lon, language }) =>
  JSON.stringify({
    lat: roundCoordinate(lat),
    lon: roundCoordinate(lon),
    language,
  });

const getCachedResponse = (cacheKey) => {
  const cached = weatherCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    weatherCache.delete(cacheKey);
    return null;
  }

  return cached.value;
};

const setCachedResponse = (cacheKey, value) => {
  weatherCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const mapCloudsToCondition = (cloudPercent) => {
  if (cloudPercent >= 60) return "Clouds";
  if (cloudPercent >= 20) return "Partly Cloudy";
  return "Sunny";
};

const buildDailyForecast = (forecastList) => {
  const byDate = new Map();

  forecastList.forEach((entry) => {
    const date = new Date(entry.dt * 1000);
    if (Number.isNaN(date.getTime())) return;

    const dateKey = date.toISOString().slice(0, 10);
    const current = byDate.get(dateKey) || {
      date: dateKey,
      temps: [],
      humidities: [],
      cloudiness: [],
    };

    current.temps.push(Number(entry.main?.temp));
    current.humidities.push(Number(entry.main?.humidity));
    current.cloudiness.push(Number(entry.clouds?.all));
    byDate.set(dateKey, current);
  });

  return [...byDate.values()]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 7)
    .map((day) => {
      const validTemps = day.temps.filter((temp) => Number.isFinite(temp));
      const validHumidities = day.humidities.filter((humidity) => Number.isFinite(humidity));
      const validCloudiness = day.cloudiness.filter((cloud) => Number.isFinite(cloud));

      const maxTemp = validTemps.length ? Math.max(...validTemps) : 0;
      const minTemp = validTemps.length ? Math.min(...validTemps) : 0;
      const avgHumidity = validHumidities.length
        ? Math.round(validHumidities.reduce((sum, value) => sum + value, 0) / validHumidities.length)
        : 0;
      const avgCloudiness = validCloudiness.length
        ? Math.round(validCloudiness.reduce((sum, value) => sum + value, 0) / validCloudiness.length)
        : 0;

      return {
        date: day.date,
        high: Math.round(maxTemp),
        low: Math.round(minTemp),
        humidity: avgHumidity,
        cond: mapCloudsToCondition(avgCloudiness),
      };
    });
};

router.get("/current", async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: "Weather service is not configured.",
        code: "WEATHER_NOT_CONFIGURED",
      });
    }

    const lat = parseCoordinate(req.query?.lat);
    const lon = parseCoordinate(req.query?.lon);

    if (lat === null || lon === null || !isValidLatitude(lat) || !isValidLongitude(lon)) {
      return res.status(400).json({
        message: "Valid latitude and longitude query parameters are required.",
        code: "INVALID_COORDINATES",
      });
    }

    const language = resolveLanguage(req.query?.language);
    const weatherLang = getOpenWeatherLanguage(language);

    const cacheKey = getCacheKey({ lat, lon, language: weatherLang });
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        cache: { hit: true, ttlMs: CACHE_TTL_MS },
      });
    }

    const commonParams = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      units: "metric",
      appid: apiKey,
      lang: weatherLang,
    });

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`${OPENWEATHER_BASE_URL}/weather?${commonParams.toString()}`),
      fetch(`${OPENWEATHER_BASE_URL}/forecast?${commonParams.toString()}`),
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      const currentBody = !currentResponse.ok ? await currentResponse.text() : "";
      const forecastBody = !forecastResponse.ok ? await forecastResponse.text() : "";

      return res.status(502).json({
        message: "Unable to fetch live weather data from provider.",
        code: "WEATHER_UPSTREAM_FAILED",
        details: {
          currentStatus: currentResponse.status,
          forecastStatus: forecastResponse.status,
          currentBody,
          forecastBody,
        },
      });
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    const cloudiness = Number(currentData?.clouds?.all);
    const payload = {
      source: "OpenWeatherMap",
      fetchedAt: new Date().toISOString(),
      location: {
        city: currentData?.name || "",
        country: currentData?.sys?.country || "",
        lat: Number(currentData?.coord?.lat ?? lat),
        lon: Number(currentData?.coord?.lon ?? lon),
      },
      current: {
        tempC: Number(currentData?.main?.temp ?? 0),
        humidity: Number(currentData?.main?.humidity ?? 0),
        cond: mapCloudsToCondition(Number.isFinite(cloudiness) ? cloudiness : 0),
      },
      forecast: buildDailyForecast(Array.isArray(forecastData?.list) ? forecastData.list : []),
      cache: { hit: false, ttlMs: CACHE_TTL_MS },
    };

    setCachedResponse(cacheKey, payload);

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to retrieve weather data.",
      code: "WEATHER_INTERNAL_ERROR",
      details: error?.message || "Unknown error",
    });
  }
});

export default router;
