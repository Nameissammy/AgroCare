# CLAUDE.md — AgroCare Project Reference

> **Living document** — update this file whenever the project structure, dependencies, or configuration changes.

## Project Overview

| Field       | Value                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**    | AgroCare                                                                                                                                                    |
| **Purpose** | Comprehensive farmer's portal with dashboard insights, mandi prices, AI-powered crop disease detection, agricultural education, and an AI chatbot assistant |
| **Origin**  | Generated via Google AI Studio, exported for local development                                                                                              |
| **Stack**   | React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Google Gemini AI                                                                                          |

## Tech Stack

- **Framework:** React 19 (react-jsx)
- **Build Tool:** Vite 6.2 with HMR
- **Language:** TypeScript 5.8 (strict mode, ES2022 target)
- **Styling:** Tailwind CSS 4.1 (via `@tailwindcss/vite` plugin)
- **Icons:** lucide-react 0.546
- **Animations:** motion 12.23 (Framer Motion successor)
- **AI:** @google/genai 1.29 (Google Gemini API — `gemini-3-flash-preview` model)

### Unused Backend Dependencies (shipped from AI Studio, not actively used)

- `express` 4.21 — HTTP server framework
- `better-sqlite3` 12.4 — SQLite3 bindings
- `dotenv` 17.2 — env var loader (Vite handles this via `loadEnv`)

## Directory Structure

```
agrocare/
├── CLAUDE.md              ← This file (project reference)
├── PRODUCTION.md          ← Production deployment guide, security caveats, recommendations
├── .env.example           ← Env var template
├── .env.local             ← Local env vars (gitignored) — put GEMINI_API_KEY here
├── .gitignore
├── index.html             ← Vite entry HTML (title: "My Google AI Studio App")
├── metadata.json          ← AI Studio metadata (name, description, permissions)
├── package.json           ← Dependencies & scripts
├── tsconfig.json          ← TypeScript config (strict, ES2022, path alias @/*)
├── vite.config.ts         ← Vite config (React + Tailwind plugins, GEMINI_API_KEY injection)
├── README.md              ← Project readme with setup instructions, feature list, tech stack
└── src/
    ├── main.tsx           ← React DOM entry point (StrictMode)
    ├── App.tsx            ← Main app shell — manages activeScreen state, renders layout
    ├── index.css          ← Tailwind import (@import "tailwindcss")
    ├── types.ts           ← Shared TypeScript types (Screen, MandiPrice, Article)
    └── components/
        ├── Sidebar.tsx          ← Left nav (5 screens) + branding + user profile
        ├── Header.tsx           ← Top bar with search, notifications, settings
        ├── Dashboard.tsx        ← Home screen — weather, live prices, crop health, articles, stats
        ├── MandiPrices.tsx      ← Agricultural market prices table, filters, trends, alerts
        ├── DiseaseDetection.tsx ← Upload crop image → Gemini AI analyzes for disease (vision)
        ├── KnowledgeHub.tsx     ← Educational articles, categories, government schemes
        └── Chatbot.tsx          ← Floating AI chatbot — agricultural expert via Gemini AI
```

## Environment Variables

| Variable         | Required | Description                                           |
| ---------------- | -------- | ----------------------------------------------------- |
| `GEMINI_API_KEY` | **Yes**  | Google Gemini API key for chatbot & disease detection |
| `APP_URL`        | No       | Host URL (used by AI Studio, not needed locally)      |
| `DISABLE_HMR`    | No       | Set `true` to disable Vite HMR (AI Studio internal)   |

**How the key reaches the frontend:** `vite.config.ts` uses `loadEnv()` to read `.env.local`, then injects the key via `define: { 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) }`. Components access it as `process.env.GEMINI_API_KEY`.

**Get a key:** https://aistudio.google.com/apikey

## NPM Scripts

| Script            | Command            | Description                               |
| ----------------- | ------------------ | ----------------------------------------- |
| `npm run dev`     | `vite --port=3000` | Start dev server at http://localhost:3000 |
| `npm run build`   | `vite build`       | Production build → `dist/`                |
| `npm run preview` | `vite preview`     | Preview production build locally          |
| `npm run clean`   | `rm -rf dist`      | Remove build output                       |
| `npm run lint`    | `tsc --noEmit`     | TypeScript type checking (no output)      |

## Component Details

### App.tsx — Application Shell

- Manages `activeScreen` state: `'dashboard' | 'mandi-prices' | 'disease-detection' | 'education' | 'chatbot'`
- Layout: Sidebar (left) + Header (top) + Content area + Chatbot overlay
- Uses `motion` library for animated page transitions (fade + slide)

### Sidebar.tsx — Navigation

- 5 nav items: Dashboard, Mandi Prices, Disease Detection, Education, Chatbot
- Branding: "AgroCare" with Tractor icon
- Placeholder user profile (Rajesh Kumar, Premium Farmer)
- Responsive: hidden on mobile, sticky on desktop (md breakpoint)

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

- The app is **frontend-only** despite having `express` and `better-sqlite3` in dependencies (shipped from AI Studio template but unused).
- All market data, weather info, and article content is **hardcoded/static** — no live data APIs.
- Camera permission is requested in `metadata.json` for disease detection image upload.
- The `.gitignore` protects all `.env*` files except `.env.example`.

---

_Last updated: 2026-03-09 — Added README.md (full project docs) and PRODUCTION.md (deployment guide & security caveats)._
