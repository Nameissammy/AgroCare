# 🌾 AgroCare — AI-Powered Farmer's Portal

A comprehensive agricultural platform built with **React 19**, **TypeScript**, **Vite 6**, **Tailwind CSS 4**, **Express**, **MongoDB**, and **Google Gemini AI**.

## Features

- **Authentication** — Role-based registration/login for **Farmer** and **Buyer** users with JWT sessions
- **Password Recovery** — Forgot/reset password flow with expiring reset tokens
- **Multi-language UX** — Localized UI and assistant responses for `en`, `hi`, `ta`, `te`, `kn`, `ml`, `or`
- **Dashboard** — Weather overview, live mandi price cards, crop health CTA, featured articles, and farm stats
- **Daily Farmer Tip** — `/api/tips/daily` endpoint with AI generation, language support, and cached fallback tips
- **Mandi Prices** — Live Agmarknet daily commodity prices with crop/state search, dropdown filters, and 7-day trend chart
- **Disease Detection** — Upload a crop photo and get AI-powered disease diagnosis using Gemini Vision (real API)
- **Knowledge Hub** — Educational articles, category tabs, difficulty levels, and government scheme listings
- **AI Chatbot** — Floating agricultural expert assistant powered through backend `/api/ai/chat` with provider fallback

## Tech Stack

| Layer      | Technology                                                  |
| ---------- | ----------------------------------------------------------- |
| Framework  | React 19                                                    |
| Language   | TypeScript 5.8 (strict mode)                                |
| Build Tool | Vite 6.2                                                    |
| Backend    | Express 4 + MongoDB (Mongoose)                              |
| Auth       | JWT (`jsonwebtoken`) + `bcryptjs`                           |
| Styling    | Tailwind CSS 4.1 (`@tailwindcss/vite` plugin)               |
| Icons      | lucide-react 0.546                                          |
| Animations | motion 12.23 (Framer Motion successor)                      |
| AI         | Gemini + optional OpenAI fallback (`/api/ai/chat`, `/api/tips/daily`) |

## Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- A **MongoDB** instance (local or Atlas)
- A **Google Gemini API key** — get one at https://aistudio.google.com/apikey
- An **OpenWeatherMap API key** for live weather — get one at https://openweathermap.org/api

## Getting Started

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd agrocare

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env

# 4. Configure required variables in `.env`
# GEMINI_API_KEY=your_actual_key_here
# MONGODB_URI=mongodb://127.0.0.1:27017/agrocare
# JWT_SECRET=use-a-long-random-secret

# 5. Start frontend + backend together
npm run dev:full
```

Frontend runs at **http://localhost:3000** and backend API runs at **http://localhost:4000**.

> `vite.config.ts` proxies `/api/*` to `http://localhost:4000`, so frontend code can call `/api/auth/...` directly.
> Secrets are loaded from **`.env` only** (not `.env.local`).

## Environment Variables

| Variable         | Required | Description                                              |
| ---------------- | -------- | -------------------------------------------------------- |
| `GEMINI_API_KEY` | **Yes**  | Google Gemini API key for chatbot & disease detection    |
| `OPENAI_API_KEY` | No       | Optional OpenAI key for backend AI fallback              |
| `AI_PROVIDER`    | No       | Preferred text AI provider: `auto`, `gemini`, or `openai` |
| `GEMINI_TEXT_MODEL` | No    | Gemini text model override for backend AI routes         |
| `OPENAI_MODEL`   | No       | OpenAI model override for backend AI routes              |
| `APP_DEFAULT_LANGUAGE` | No | Fallback app language when browser/local storage is unavailable |
| `MONGODB_URI`    | **Yes**  | MongoDB connection string for user/auth data             |
| `JWT_SECRET`     | **Yes**  | Secret used to sign JWT auth tokens                      |
| `RESET_TOKEN_EXPIRY_MINUTES` | No | Password reset token expiry window (default `15`) |
| `TIP_REFRESH_HOURS` | No    | Daily tip cache refresh interval on backend (default `24`) |
| `TIP_FALLBACK_RETRY_MINUTES` | No | Retry window after AI failure for tips (default `60`) |
| `CORS_ORIGIN`    | No       | Allowed API origin (defaults to `http://localhost:3000`) |
| `AGMARKNET_API_KEY` | No    | Data.gov.in/Agmarknet API key for higher rate limits      |
| `OPENWEATHER_API_KEY` | **Yes** | OpenWeatherMap API key for live dashboard weather      |
| `WEATHER_CACHE_MINUTES` | No | Backend weather cache TTL in minutes (default `20`)     |
| `PORT`           | No       | Backend API port (defaults to `4000`)                    |
| `APP_URL`        | No       | Host URL (AI Studio internal, not needed locally)        |
| `DISABLE_HMR`    | No       | Set `true` to disable Vite HMR (AI Studio internal)      |

The API key is injected into the frontend at build time via Vite's `define` option in `vite.config.ts`. Components access it as `process.env.GEMINI_API_KEY`.

MongoDB/JWT variables are consumed by the Express backend in `server/index.js` and `server/config/db.js`.

## Available Scripts

| Script             | Command                                       | Description                        |
| ------------------ | --------------------------------------------- | ---------------------------------- |
| `npm run dev`      | `vite --port=3000 --host=0.0.0.0`             | Start frontend dev server          |
| `npm run server`   | `node server/index.js`                        | Start Express + MongoDB API server |
| `npm run dev:full` | `concurrently "npm run dev" "npm run server"` | Run frontend + backend together    |
| `npm run build`    | `vite build`                                  | Production build → `dist/`         |
| `npm run preview`  | `vite preview`                                | Preview production build locally   |
| `npm run clean`    | `rm -rf dist`                                 | Remove build output                |
| `npm run lint`     | `tsc --noEmit`                                | TypeScript type checking           |

## Auth API Endpoints

- `POST /api/auth/register`
  - Body: `{ name, email, password, role, phone?, location? }`
  - `role` must be either `farmer` or `buyer`
- `POST /api/auth/login`
  - Body: `{ email, password }`
- `POST /api/auth/forgot-password`
  - Body: `{ email }`
  - Always returns a generic message to reduce email enumeration risk
- `POST /api/auth/reset-password`
  - Body: `{ token, newPassword }`
  - `newPassword` must be at least 8 characters

Both endpoints return:

- `token` (JWT, 7-day expiry)
- `user` (sanitized profile object)

## AI & Tips API Endpoints

- `POST /api/ai/chat`
  - Body: `{ message, history?, language? }`
  - Returns AI response plus provider/model metadata; serves fallback response if live generation fails
- `GET /api/tips/daily?language=<code>`
  - Returns one localized daily farming tip
  - Uses in-memory caching and deterministic fallback tips when live AI generation is unavailable

## Weather API Endpoint

- `GET /api/weather/current?lat=<number>&lon=<number>&language=<code>`
  - Returns live current weather and daily forecast from OpenWeatherMap
  - Used by Dashboard with browser geolocation
  - Returns explicit errors when location or provider fetch fails

## Project Structure

```
agrocare/
├── server/
│   ├── index.js             # Express API server entrypoint
│   ├── config/
│   │   └── db.js            # MongoDB connection logic
│   ├── models/
│   │   └── User.js          # Mongoose user model (farmer/buyer)
│   ├── routes/
│   │   ├── auth.js          # Register/login + forgot/reset password routes
│   │   ├── mandi.js         # Agmarknet market prices proxy + trend
│   │   ├── tips.js          # Daily tip API with cache + fallback
│   │   ├── ai.js            # Chat assistant endpoint
│   │   └── weather.js       # Live weather endpoint (OpenWeatherMap + cache)
│   ├── utils/
│   │   └── aiText.js        # Provider selection + Gemini/OpenAI fallback logic
│   └── controllers/
│       └── authController.js # Legacy file (not used by current server routes)
├── index.html             # Vite entry HTML
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript config (strict, ES2022, @/* alias)
├── vite.config.ts         # Vite config (React + Tailwind + API key injection)
├── .env.example           # Environment variable template
├── .env                   # Your local secrets (gitignored)
├── CLAUDE.md              # Project reference for AI assistants
├── PRODUCTION.md          # Production deployment guide & caveats
└── src/
    ├── main.tsx           # React DOM entry point
    ├── App.tsx            # Auth-gated shell + screen routing + layout
    ├── index.css          # Tailwind CSS import
    ├── types.ts           # Shared app + auth types
    ├── contexts/
    │   ├── AuthContext.tsx      # Auth state, session persistence, login/register/logout
    │   └── LanguageContext.tsx  # App language state + translation helper
    ├── i18n/
    │   └── translations.ts      # Localized string catalog
    └── components/
        ├── Sidebar.tsx          # Left navigation + branding
        ├── Header.tsx           # Top bar with search & notifications
        ├── Dashboard.tsx        # Home screen with weather, prices, stats
        ├── MandiPrices.tsx      # Market price tables & filters
        ├── DiseaseDetection.tsx # AI crop disease analysis (Gemini Vision)
        ├── KnowledgeHub.tsx     # Educational articles & gov schemes
        ├── Chatbot.tsx          # Floating AI chatbot (backend /api/ai/chat)
        └── auth/
            ├── Login.tsx        # Login UI
            ├── Register.tsx     # Farmer/Buyer registration UI
            ├── ForgotPassword.tsx # Request password reset link
            └── ResetPassword.tsx  # Complete password reset with token
```

## What's Real vs. Static

| Feature           | Data Source                          |
| ----------------- | ------------------------------------ |
| Disease Detection | **Real** — Gemini AI Vision API      |
| Chatbot           | **Real** — Backend `/api/ai/chat` (Gemini/OpenAI with fallback) |
| Daily Tip         | **Real** — Backend `/api/tips/daily` (AI + cached fallback) |
| Authentication    | **Real** — Express + MongoDB + JWT   |
| Mandi Prices      | **Real** — Agmarknet API via Express proxy |
| Weather           | **Real** — Backend `/api/weather/current` via OpenWeatherMap |
| Articles          | Static — hardcoded content           |
| Images            | External — Unsplash CDN URLs         |

## Production Deployment

See [PRODUCTION.md](PRODUCTION.md) for deployment guide, security caveats, and recommendations.
