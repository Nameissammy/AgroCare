import express from "express";

const router = express.Router();

const AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const AGMARKNET_BASE_URL = "https://api.data.gov.in/resource";
const DEFAULT_API_KEY = "579b464db66ec23bdd00000125f4f54e93e7d04f6f8f1954";
const CACHE_TTL_MS = 5 * 60 * 1000;
const mandiCache = new Map();

// Fallback mock data for when Agmarknet API is unavailable
const FALLBACK_MOCK_DATA = [
  {
    state: "Punjab",
    district: "Ludhiana",
    market: "Ludhiana Mandi",
    commodity: "Wheat",
    variety: "Common",
    grade: "Fair Average Quality",
    arrival_date: "15/01/2026",
    min_price: "2150",
    max_price: "2280",
    modal_price: "2200",
  },
  {
    state: "Punjab",
    district: "Ludhiana",
    market: "Ludhiana Mandi",
    commodity: "Rice",
    variety: "Common",
    grade: "Common",
    arrival_date: "15/01/2026",
    min_price: "2800",
    max_price: "3050",
    modal_price: "2950",
  },
  {
    state: "Maharashtra",
    district: "Nashik",
    market: "Nashik Mandi",
    commodity: "Onion",
    variety: "White",
    grade: "Good",
    arrival_date: "14/01/2026",
    min_price: "1800",
    max_price: "2100",
    modal_price: "1950",
  },
  {
    state: "Maharashtra",
    district: "Nashik",
    market: "Nashik Mandi",
    commodity: "Tomato",
    variety: "Regular",
    grade: "Good",
    arrival_date: "14/01/2026",
    min_price: "800",
    max_price: "1200",
    modal_price: "1000",
  },
  {
    state: "Karnataka",
    district: "Belgaum",
    market: "Belgaum Mandi",
    commodity: "Sugarcane",
    variety: "Common",
    grade: "Good",
    arrival_date: "13/01/2026",
    min_price: "2500",
    max_price: "2800",
    modal_price: "2650",
  },
  {
    state: "Tamil Nadu",
    district: "Madurai",
    market: "Madurai Mandi",
    commodity: "Cotton",
    variety: "Medium Staple",
    grade: "Good",
    arrival_date: "12/01/2026",
    min_price: "5200",
    max_price: "5800",
    modal_price: "5500",
  },
  {
    state: "Uttar Pradesh",
    district: "Meerut",
    market: "Meerut Mandi",
    commodity: "Potato",
    variety: "Common",
    grade: "Good",
    arrival_date: "14/01/2026",
    min_price: "900",
    max_price: "1300",
    modal_price: "1100",
  },
  {
    state: "Madhya Pradesh",
    district: "Indore",
    market: "Indore Mandi",
    commodity: "Soyabean",
    variety: "Yellow",
    grade: "Good",
    arrival_date: "12/01/2026",
    min_price: "4500",
    max_price: "4950",
    modal_price: "4700",
  },
  {
    state: "Gujarat",
    district: "Ahmedabad",
    market: "Ahmedabad Mandi",
    commodity: "Groundnut",
    variety: "Bold",
    grade: "Good",
    arrival_date: "11/01/2026",
    min_price: "5800",
    max_price: "6500",
    modal_price: "6100",
  },
  {
    state: "Rajasthan",
    district: "Jodhpur",
    market: "Jodhpur Mandi",
    commodity: "Mustard",
    variety: "Common",
    grade: "Good",
    arrival_date: "10/01/2026",
    min_price: "5500",
    max_price: "6200",
    modal_price: "5850",
  },
];

const FALLBACK_TREND = [
  { date: "2026-01-09", modalPrice: 2150 },
  { date: "2026-01-10", modalPrice: 2165 },
  { date: "2026-01-11", modalPrice: 2175 },
  { date: "2026-01-12", modalPrice: 2185 },
  { date: "2026-01-13", modalPrice: 2190 },
  { date: "2026-01-14", modalPrice: 2195 },
  { date: "2026-01-15", modalPrice: 2200 },
];

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

  return sorted.length > 0 ? sorted : FALLBACK_TREND;
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

    let apiResponse = null;
    let apiError = null;
    let dataSource = "agmarknet";

    // Try to fetch from real API
    try {
      const response = await fetch(url, { timeout: 8000 });

      if (response.ok) {
        apiResponse = await response.json();
      } else {
        apiError = `API returned status ${response.status}`;
        console.warn(`[Mandi API] Real API failed with status ${response.status}`);
      }
    } catch (error) {
      apiError = error?.message || "Network error";
      console.warn(`[Mandi API] Real API fetch error:`, apiError);
    }

    // Use real data if available, otherwise fallback to mock
    const rawRecords = Array.isArray(apiResponse?.records)
      ? apiResponse.records
      : FALLBACK_MOCK_DATA;

    if (!Array.isArray(apiResponse?.records)) {
      dataSource = "mock";
      console.log(
        "[Mandi API] Using fallback mock data. Reason:",
        apiError || "No API response"
      );
    }

    const mapped = rawRecords.map(mapRecord);

    const searchText = normalize(search);
    const filtered = searchText
      ? mapped.filter((item) => normalize(item.commodity).includes(searchText))
      : mapped;

    const states = [...new Set(mapped.map((item) => item.state).filter(Boolean))].sort();
    const commodities = [...new Set(mapped.map((item) => item.commodity).filter(Boolean))].sort();

    const payload = {
      source: dataSource,
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
      ...(apiError && { apiError }),
    };

    setCachedResponse(cacheKey, payload);

    return res.json(payload);
  } catch (error) {
    console.error("[Mandi API] Unexpected error:", error);
    // Even on unexpected errors, return fallback data
    const filtered = FALLBACK_MOCK_DATA;
    const states = [...new Set(FALLBACK_MOCK_DATA.map((item) => item.state).filter(Boolean))].sort();
    const commodities = [...new Set(FALLBACK_MOCK_DATA.map((item) => item.commodity).filter(Boolean))].sort();

    return res.json({
      source: "mock",
      totalInPage: filtered.length,
      limit: 100,
      offset: 0,
      filters: { state: "", commodity: "", search: "" },
      states,
      commodities,
      records: filtered,
      trend: FALLBACK_TREND,
      fetchedAt: new Date().toISOString(),
      cache: { hit: false, ttlMs: CACHE_TTL_MS },
      apiError: error?.message || "Unknown error",
    });
  }
});

export default router;