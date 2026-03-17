import express from "express";

const router = express.Router();

const AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const AGMARKNET_BASE_URL = "https://api.data.gov.in/resource";
const DEFAULT_API_KEY = "579b464db66ec23bdd00000125f4f54e93e7d04f6f8f1954";
const CACHE_TTL_MS = 5 * 60 * 1000;
const mandiCache = new Map();

const getCacheKey = ({ state, commodity, search, limit, offset }) =>
  JSON.stringify({ state, commodity, search, limit, offset });

const getCachedResponse = (cacheKey) => {
  const cached = mandiCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    mandiCache.delete(cacheKey);
    return null;
  }

  return cached.value;
};

const setCachedResponse = (cacheKey, value) => {
  mandiCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const parseNumber = (value) => {
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalize = (value) => String(value || "").trim().toLowerCase();

const parseArrivalDate = (rawDate) => {
  if (!rawDate) return null;
  const [day, month, year] = String(rawDate).split("/").map(Number);
  if (!day || !month || !year) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
};

const toINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const mapRecord = (record) => {
  const minPrice = parseNumber(record.min_price);
  const maxPrice = parseNumber(record.max_price);
  const modalPrice = parseNumber(record.modal_price);

  return {
    state: record.state,
    district: record.district,
    market: record.market,
    commodity: record.commodity,
    variety: record.variety,
    grade: record.grade,
    arrivalDate: record.arrival_date,
    minPrice,
    maxPrice,
    modalPrice,
    minPriceFormatted: toINR(minPrice),
    maxPriceFormatted: toINR(maxPrice),
    modalPriceFormatted: toINR(modalPrice),
  };
};

const buildTrend = (records) => {
  const byDate = new Map();

  records.forEach((record) => {
    const date = parseArrivalDate(record.arrivalDate);
    if (!date) return;

    const key = date.toISOString().slice(0, 10);
    const current = byDate.get(key) || { total: 0, count: 0 };
    current.total += record.modalPrice;
    current.count += 1;
    byDate.set(key, current);
  });

  const sorted = [...byDate.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-7)
    .map(([date, value]) => ({
      date,
      modalPrice: Math.round(value.total / value.count),
    }));

  return sorted;
};

router.get("/prices", async (req, res) => {
  try {
    const {
      state = "",
      commodity = "",
      search = "",
      limit = "100",
      offset = "0",
    } = req.query;

    const apiKey = process.env.AGMARKNET_API_KEY || DEFAULT_API_KEY;
    const requestLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const requestOffset = Math.max(Number(offset) || 0, 0);

    const cacheKey = getCacheKey({
      state: String(state),
      commodity: String(commodity),
      search: String(search),
      limit: requestLimit,
      offset: requestOffset,
    });

    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        cache: { hit: true, ttlMs: CACHE_TTL_MS },
      });
    }

    const params = new URLSearchParams({
      "api-key": apiKey,
      format: "json",
      limit: String(requestLimit),
      offset: String(requestOffset),
    });

    if (state) {
      params.append("filters[state]", String(state));
    }

    if (commodity) {
      params.append("filters[commodity]", String(commodity));
    }

    const url = `${AGMARKNET_BASE_URL}/${AGMARKNET_RESOURCE_ID}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();
      return res.status(502).json({
        message: "Failed to fetch Agmarknet data",
        details: body,
      });
    }

    const data = await response.json();
    const rawRecords = Array.isArray(data.records) ? data.records : [];
    const mapped = rawRecords.map(mapRecord);

    const searchText = normalize(search);
    const filtered = searchText
      ? mapped.filter((item) => normalize(item.commodity).includes(searchText))
      : mapped;

    const states = [...new Set(mapped.map((item) => item.state).filter(Boolean))].sort();
    const commodities = [...new Set(mapped.map((item) => item.commodity).filter(Boolean))].sort();

    const payload = {
      source: "Agmarknet",
      totalInPage: filtered.length,
      limit: requestLimit,
      offset: requestOffset,
      filters: { state, commodity, search },
      states,
      commodities,
      records: filtered,
      trend: buildTrend(filtered),
      fetchedAt: new Date().toISOString(),
      cache: { hit: false, ttlMs: CACHE_TTL_MS },
    };

    setCachedResponse(cacheKey, payload);

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to retrieve mandi prices",
      details: error?.message || "Unknown error",
    });
  }
});

export default router;