# CLAUDE.md — AgroCare Project Reference

> **Living document** — update this file whenever the project structure, dependencies, or configuration changes.

## Project Overview

| Field       | Value                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**    | AgroCare                                                                                                                                                    |
| **Purpose** | Comprehensive farmer's portal with dashboard insights, mandi prices, AI-powered crop disease detection, agricultural education, and an AI chatbot assistant |
| **Origin**  | Generated via Google AI Studio, exported for local development                                                                                              |
| **Stack**   | React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Express · MongoDB · Gemini/OpenAI-backed AI routes                                                        |

## Tech Stack

- **Framework:** React 19 (react-jsx)
- **Build Tool:** Vite 6.2 with HMR
- **Language:** TypeScript 5.8 (strict mode, ES2022 target)
- **Styling:** Tailwind CSS 4.1 (via `@tailwindcss/vite` plugin)
- **Icons:** lucide-react 0.546
- **Animations:** motion 12.23 (Framer Motion successor)
- **AI:** @google/genai 1.29 (+ optional OpenAI fallback via REST in backend `utils/aiText.js`)
- **Backend API:** Express 4.21 + CORS
- **Database:** MongoDB via Mongoose 9
- **Authentication:** JWT (`jsonwebtoken`) + `bcryptjs`

### Legacy / Partially Used Backend Artifacts

- `better-sqlite3` 12.4 — currently unused
- `server/controllers/authController.js` — CommonJS legacy controller, not used by active route mounting
- `server/package.json` — separate backend package metadata (root scripts currently run `server/index.js` directly)

## Directory Structure

```
agrocare/
├── CLAUDE.md              ← This file (project reference)
├── PRODUCTION.md          ← Production deployment guide, security caveats, recommendations
├── .env.example           ← Env var template
├── .env                   ← Local env vars (gitignored) — put GEMINI_API_KEY here
├── .gitignore
├── index.html             ← Vite entry HTML (title: "My Google AI Studio App")
├── metadata.json          ← AI Studio metadata (name, description, permissions)
├── package.json           ← Dependencies & scripts
├── tsconfig.json          ← TypeScript config (strict, ES2022, path alias @/*)
├── vite.config.ts         ← Vite config (React + Tailwind plugins, GEMINI_API_KEY injection, /api proxy → :4000)
├── README.md              ← Project readme with setup instructions, feature list, tech stack
├── server/
│   ├── index.js           ← Express API entrypoint (health + auth + mandi + tips + ai routes)
│   ├── config/
│   │   └── db.js          ← MongoDB connection and retry logic
│   ├── models/
│   │   └── User.js        ← User schema (name/email/password/role/phone/location)
│   ├── routes/
│   │   ├── auth.js        ← `/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password`
│   │   ├── mandi.js       ← `/api/mandi/prices` proxy for Agmarknet daily prices + trend
│   │   ├── tips.js        ← `/api/tips/daily` localized daily tip generation + fallback cache
│   │   ├── ai.js          ← `/api/ai/chat` multilingual assistant endpoint
│   │   └── weather.js     ← `/api/weather/current` live weather + forecast endpoint
│   ├── utils/
│   │   └── aiText.js      ← Provider order + Gemini/OpenAI fallback for backend text generation
│   ├── controllers/
│   │   └── authController.js ← Legacy CJS controller (unused)
│   └── package.json       ← Backend-only package metadata (not required by root scripts)
└── src/
    ├── main.tsx           ← React DOM entry point (StrictMode)
    ├── App.tsx            ← Auth-gated shell (login/register vs main app) + activeScreen management
    ├── index.css          ← Tailwind import (@import "tailwindcss")
    ├── types.ts           ← Shared app + auth TypeScript types
    ├── contexts/
    │   ├── AuthContext.tsx ← Frontend auth state + localStorage session persistence
    │   └── LanguageContext.tsx ← Selected language state + translation helper
    ├── i18n/
    │   └── translations.ts ← Localization catalog (en/hi/ta/te/kn/ml/or)
    └── components/
        ├── Sidebar.tsx          ← Left nav + real user info + logout
        ├── Header.tsx           ← Top bar with search, notifications, settings
        ├── Dashboard.tsx        ← Home screen — weather, live prices, crop health, articles, stats
        ├── MandiPrices.tsx      ← Agricultural market prices table, filters, trends, alerts
        ├── DiseaseDetection.tsx ← Upload crop image → Gemini AI analyzes for disease (vision)
        ├── KnowledgeHub.tsx     ← Educational articles, categories, government schemes
        ├── Chatbot.tsx          ← Floating AI chatbot — backend `/api/ai/chat` assistant
        └── auth/
            ├── Login.tsx        ← Login page UI
            ├── Register.tsx     ← Role-based registration page UI (farmer/buyer)
            ├── ForgotPassword.tsx ← Request password reset via email
            └── ResetPassword.tsx ← Reset password using token from reset link
```

## Environment Variables

| Variable         | Required | Description                                           |
| ---------------- | -------- | ----------------------------------------------------- |
| `GEMINI_API_KEY` | **Yes**  | Google Gemini API key for chatbot & disease detection |
| `OPENAI_API_KEY` | No       | Optional OpenAI key for backend AI fallback            |
| `AI_PROVIDER`    | No       | Preferred text provider: `auto`, `gemini`, or `openai` |
| `GEMINI_TEXT_MODEL` | No    | Override Gemini text model for backend routes          |
| `OPENAI_MODEL`   | No       | Override OpenAI chat model for backend routes          |
| `APP_DEFAULT_LANGUAGE` | No | Fallback initial app language                          |
| `MONGODB_URI`    | **Yes**  | MongoDB URI for backend user/auth storage             |
| `JWT_SECRET`     | **Yes**  | Secret key for signing auth JWTs                      |
| `RESET_TOKEN_EXPIRY_MINUTES` | No | Reset token expiry window in minutes            |
| `TIP_REFRESH_HOURS` | No    | Daily tip cache refresh interval                       |
| `TIP_FALLBACK_RETRY_MINUTES` | No | Retry window after AI tip fallback               |
| `CORS_ORIGIN`    | No       | Allowed frontend origin for backend CORS              |
| `AGMARKNET_API_KEY` | No    | Optional Data.gov.in API key for mandi rate limits     |
| `OPENWEATHER_API_KEY` | **Yes** | OpenWeatherMap key for live dashboard weather     |
| `WEATHER_CACHE_MINUTES` | No | In-memory weather cache TTL (minutes)                |
| `PORT`           | No       | Backend API port (default `4000`)                     |
| `APP_URL`        | No       | Host URL (used by AI Studio, not needed locally)      |
| `DISABLE_HMR`    | No       | Set `true` to disable Vite HMR (AI Studio internal)   |

**How the key reaches the frontend:** `vite.config.ts` loads project `.env` via `dotenv.config(...)`, then injects `GEMINI_API_KEY` through `define: { 'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY) }`. Components access it as `process.env.GEMINI_API_KEY`.

**Backend env loading:** `server/index.js` and `server/config/db.js` load project `.env`.

**Get a key:** https://aistudio.google.com/apikey

## NPM Scripts

| Script             | Command                                       | Description                                              |
| ------------------ | --------------------------------------------- | -------------------------------------------------------- |
| `npm run dev`      | `vite --port=3000 --host=0.0.0.0`             | Start frontend dev server (http://localhost:3000)        |
| `npm run server`   | `node server/index.js`                        | Start backend API server (default http://localhost:4000) |
| `npm run dev:full` | `concurrently "npm run dev" "npm run server"` | Start frontend and backend together                      |
| `npm run build`    | `vite build`                                  | Production build → `dist/`                               |
| `npm run preview`  | `vite preview`                                | Preview production build locally                         |
| `npm run clean`    | `rm -rf dist`                                 | Remove build output                                      |
| `npm run lint`     | `tsc --noEmit`                                | TypeScript type checking (no output)                     |

## Component Details

### App.tsx — Application Shell

- Wraps application with `AuthProvider`
- Shows auth screens (`Login` / `Register`) when user is not authenticated
- Shows app layout (Sidebar + Header + content + Chatbot overlay) when user is authenticated
- Uses `motion` library for animated page transitions (fade + slide)

### Sidebar.tsx — Navigation

- 4 nav items: Dashboard, Mandi Prices, Disease Detection, Education
- Branding: "AgroCare" with Tractor icon
- Uses authenticated user from `AuthContext` (name + role)
- Includes logout action
- Responsive: hidden on mobile, sticky on desktop (md breakpoint)

### AuthContext.tsx — Frontend Auth State

- Stores authenticated user and token state
- Provides `login`, `register`, and `logout` actions
- Persists auth session in `localStorage` (`agrocare_token`, `agrocare_user`)
- Calls backend routes: `/api/auth/login` and `/api/auth/register`

### LanguageContext.tsx — Frontend Localization State

- Persists selected language in `localStorage` (`agrocare_language`)
- Supports 7 languages: `en`, `hi`, `ta`, `te`, `kn`, `ml`, `or`
- Provides `t(key, fallback)` translation helper used across screens

### Backend Auth Routes — `server/routes/auth.js`

- `POST /api/auth/register`: validates fields, enforces role (`farmer|buyer`), hashes password, returns JWT
- `POST /api/auth/login`: verifies credentials, returns JWT
- `POST /api/auth/forgot-password`: generates expiring reset token and logs reset link
- `POST /api/auth/reset-password`: validates token hash + expiry and updates password
- Returns sanitized user object (without password)
- Includes DB readiness check and validation error handling

### Header.tsx — Top Bar

- Search input, notification bell (red dot), settings gear icon
- Sticky position (z-10)

### Dashboard.tsx — Home Screen

- Live weather fetched using browser geolocation via backend `/api/weather/current`
- Live Mandi Prices cards (Wheat, Rice, Tomato with trends)
- Crop Health AI call-to-action
- Daily tip card fetched from `/api/tips/daily` with language-aware fallback
- Knowledge Hub featured articles (Unsplash images)
- Footer stats: season progress, yield prediction, income estimate, subsidy status

### MandiPrices.tsx — Market Price Data

- Live fetch from backend `/api/mandi/prices` (Agmarknet API via Data.gov.in)
- Search by crop/commodity name + dropdown filters for State and Commodity
- Clean data table with Market, Min Price, Max Price, Modal Price
- Chart.js 7-day modal price trend line chart

### DiseaseDetection.tsx — AI Crop Disease Analysis

- **Uses Gemini AI** (`gemini-3-flash-preview` model, vision capability)
- Upload flow: drag-and-drop or file picker → converts to base64 → sends to Gemini
- Prompt requests JSON response with: condition, scientificName, confidence, description, chemicalControl, organicMethods, preventiveMeasures
- Displays diagnosis card with confidence score, treatments, and prevention tips
- Error handling with retry, loading spinner

### KnowledgeHub.tsx — Agricultural Education

- Featured hero article + category tabs (6 categories)
- Article cards with difficulty levels (Beginner/Intermediate/Advanced)
- Government scheme cards (4 schemes)
- All images from Unsplash CDN

### Chatbot.tsx — AI Assistant

- Calls backend `/api/ai/chat` with conversation history and selected language
- Backend uses provider fallback (Gemini/OpenAI) with rule-based backup response
- System instruction: "agricultural expert for Indian farmers"
- Floating chat bubble (bottom-right), expandable window
- Quick action buttons: Check Wheat Prices, Disease Help, Weather Alert
- Message bubbles: user (green, right) / bot (white, left)
- Loading state: "Thinking..." indicator
- Error fallback message on API failure

## External Services

1. **Google Gemini AI API** — Vision analysis for disease detection + optional backend text generation
    - Vision model in frontend: `gemini-3-flash-preview`
2. **OpenAI Chat Completions API** — Optional backend text generation fallback
3. **OpenWeatherMap API** — Live weather and forecast data for dashboard
4. **Unsplash CDN** — Article/thumbnail images in Dashboard and KnowledgeHub (hardcoded URLs)

## Path Aliases

- `@/*` → project root (configured in both `tsconfig.json` and `vite.config.ts`)

## Notes

- The app is now **full-stack** (frontend + Express backend) for authentication, mandi prices, daily tips, and chat.
- Chat and daily tips are served through backend routes (`/api/ai/chat`, `/api/tips/daily`); disease detection still calls Gemini directly from frontend.
- Weather is now live via backend weather route; article content remains **hardcoded/static**.
- Mandi prices are now live via Agmarknet API proxy (`/api/mandi/prices`).
- Camera permission is requested in `metadata.json` for disease detection image upload.
- The `.gitignore` protects all `.env*` files except `.env.example`.

---

_Last updated: 2026-03-22 — Added multilingual + password reset flows, backend AI/tips routes, updated environment variables, and corrected runtime architecture notes._
