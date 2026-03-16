# CLAUDE.md — AgroCare Project Reference

> **Living document** — update this file whenever the project structure, dependencies, or configuration changes.

## Project Overview

| Field       | Value                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**    | AgroCare                                                                                                                                                    |
| **Purpose** | Comprehensive farmer's portal with dashboard insights, mandi prices, AI-powered crop disease detection, agricultural education, and an AI chatbot assistant |
| **Origin**  | Generated via Google AI Studio, exported for local development                                                                                              |
| **Stack**   | React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Express · MongoDB · Google Gemini AI                                                                      |

## Tech Stack

- **Framework:** React 19 (react-jsx)
- **Build Tool:** Vite 6.2 with HMR
- **Language:** TypeScript 5.8 (strict mode, ES2022 target)
- **Styling:** Tailwind CSS 4.1 (via `@tailwindcss/vite` plugin)
- **Icons:** lucide-react 0.546
- **Animations:** motion 12.23 (Framer Motion successor)
- **AI:** @google/genai 1.29 (Google Gemini API — `gemini-3-flash-preview` model)
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
│   ├── index.js           ← Express API entrypoint (health + auth routes)
│   ├── config/
│   │   └── db.js          ← MongoDB connection and retry logic
│   ├── models/
│   │   └── User.js        ← User schema (name/email/password/role/phone/location)
│   ├── routes/
│   │   └── auth.js        ← `/api/auth/register` and `/api/auth/login`
│   ├── controllers/
│   │   └── authController.js ← Legacy CJS controller (unused)
│   └── package.json       ← Backend-only package metadata (not required by root scripts)
└── src/
    ├── main.tsx           ← React DOM entry point (StrictMode)
    ├── App.tsx            ← Auth-gated shell (login/register vs main app) + activeScreen management
    ├── index.css          ← Tailwind import (@import "tailwindcss")
    ├── types.ts           ← Shared app + auth TypeScript types
    ├── contexts/
    │   └── AuthContext.tsx ← Frontend auth state + localStorage session persistence
    └── components/
        ├── Sidebar.tsx          ← Left nav + real user info + logout
        ├── Header.tsx           ← Top bar with search, notifications, settings
        ├── Dashboard.tsx        ← Home screen — weather, live prices, crop health, articles, stats
        ├── MandiPrices.tsx      ← Agricultural market prices table, filters, trends, alerts
        ├── DiseaseDetection.tsx ← Upload crop image → Gemini AI analyzes for disease (vision)
        ├── KnowledgeHub.tsx     ← Educational articles, categories, government schemes
        └── Chatbot.tsx          ← Floating AI chatbot — agricultural expert via Gemini AI
        └── auth/
            ├── Login.tsx        ← Login page UI
            └── Register.tsx     ← Role-based registration page UI (farmer/buyer)
```

## Environment Variables

| Variable         | Required | Description                                           |
| ---------------- | -------- | ----------------------------------------------------- |
| `GEMINI_API_KEY` | **Yes**  | Google Gemini API key for chatbot & disease detection |
| `MONGODB_URI`    | **Yes**  | MongoDB URI for backend user/auth storage             |
| `JWT_SECRET`     | **Yes**  | Secret key for signing auth JWTs                      |
| `CORS_ORIGIN`    | No       | Allowed frontend origin for backend CORS              |
| `PORT`           | No       | Backend API port (default `4000`)                     |
| `APP_URL`        | No       | Host URL (used by AI Studio, not needed locally)      |
| `DISABLE_HMR`    | No       | Set `true` to disable Vite HMR (AI Studio internal)   |

**How the key reaches the frontend:** `vite.config.ts` uses `loadEnv()` to read `.env` / `.env.local` (and mode-specific overrides), then injects the key via `define: { 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) }`. Components access it as `process.env.GEMINI_API_KEY`.

**Backend env loading:** `server/index.js` and `server/config/db.js` load `.env` then `.env.local`, with `.env.local` taking precedence.

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

### Backend Auth Routes — `server/routes/auth.js`

- `POST /api/auth/register`: validates fields, enforces role (`farmer|buyer`), hashes password, returns JWT
- `POST /api/auth/login`: verifies credentials, returns JWT
- Returns sanitized user object (without password)
- Includes DB readiness check and validation error handling

### Header.tsx — Top Bar

- Search input, notification bell (red dot), settings gear icon
- Sticky position (z-10)

### Dashboard.tsx — Home Screen

- Weather display (28°C Sunny, hardcoded)
- Live Mandi Prices cards (Wheat, Rice, Tomato with trends)
- Crop Health AI call-to-action
- Knowledge Hub featured articles (Unsplash images)
- Footer stats: season progress, yield prediction, income estimate, subsidy status

### MandiPrices.tsx — Market Price Data

- Filters: State, Mandi, Date
- Summary cards: Most Volatile, Top Performer, Market Sentiment, Arrivals
- Price table: 4 crops (Wheat, Basmati Rice, Cotton, Potato) with min/max/modal prices
- Mini bar chart price visualization
- Market news & alerts section

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

- **Uses Gemini AI** (`gemini-3-flash-preview` model, text generation)
- System instruction: "agricultural expert for Indian farmers"
- Floating chat bubble (bottom-right), expandable window
- Quick action buttons: Check Wheat Prices, Disease Help, Weather Alert
- Message bubbles: user (green, right) / bot (white, left)
- Loading state: "Thinking..." indicator
- Error fallback message on API failure

## External Services

1. **Google Gemini AI API** — Text generation (chatbot) + Vision analysis (disease detection)
   - Model: `gemini-3-flash-preview`
   - Auth: API key via environment variable
2. **Unsplash CDN** — Article/thumbnail images in Dashboard and KnowledgeHub (hardcoded URLs)

## Path Aliases

- `@/*` → project root (configured in both `tsconfig.json` and `vite.config.ts`)

## Notes

- The app is now **full-stack** (frontend + Express backend) for authentication.
- Gemini chat and disease detection are still called directly from frontend using `GEMINI_API_KEY` injection; this remains a production security caveat.
- All market data, weather info, and article content is **hardcoded/static** — no live data APIs.
- Camera permission is requested in `metadata.json` for disease detection image upload.
- The `.gitignore` protects all `.env*` files except `.env.example`.

---

_Last updated: 2026-03-16 — Added backend auth architecture (Express + MongoDB + JWT), frontend auth flow docs, and updated scripts/env/config references._
