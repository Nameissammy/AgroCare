# 🌾 AgroCare — AI-Powered Farmer's Portal

A comprehensive agricultural platform built with **React 19**, **TypeScript**, **Vite 6**, **Tailwind CSS 4**, **Express**, **MongoDB**, and **Google Gemini AI**.

## Features

- **Authentication** — Role-based registration/login for **Farmer** and **Buyer** users with JWT sessions
- **Dashboard** — Weather overview, live mandi price cards, crop health CTA, featured articles, and farm stats
- **Mandi Prices** — Live Agmarknet daily commodity prices with crop/state search, dropdown filters, and 7-day trend chart
- **Disease Detection** — Upload a crop photo and get AI-powered disease diagnosis using Gemini Vision (real API)
- **Knowledge Hub** — Educational articles, category tabs, difficulty levels, and government scheme listings
- **AI Chatbot** — Floating agricultural expert assistant powered by Gemini AI (real API)

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
| AI         | @google/genai 1.29 — Google Gemini `gemini-3-flash-preview` |

## Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- A **MongoDB** instance (local or Atlas)
- A **Google Gemini API key** — get one at https://aistudio.google.com/apikey

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
| `MONGODB_URI`    | **Yes**  | MongoDB connection string for user/auth data             |
| `JWT_SECRET`     | **Yes**  | Secret used to sign JWT auth tokens                      |
| `CORS_ORIGIN`    | No       | Allowed API origin (defaults to `http://localhost:3000`) |
| `AGMARKNET_API_KEY` | No    | Data.gov.in/Agmarknet API key for higher rate limits      |
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

Both endpoints return:

- `token` (JWT, 7-day expiry)
- `user` (sanitized profile object)

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
│   │   └── auth.js          # Register/login routes
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
    │   └── AuthContext.tsx # Auth state, session persistence, login/register/logout
    └── components/
        ├── Sidebar.tsx          # Left navigation + branding
        ├── Header.tsx           # Top bar with search & notifications
        ├── Dashboard.tsx        # Home screen with weather, prices, stats
        ├── MandiPrices.tsx      # Market price tables & filters
        ├── DiseaseDetection.tsx # AI crop disease analysis (Gemini Vision)
        ├── KnowledgeHub.tsx     # Educational articles & gov schemes
        └── Chatbot.tsx          # Floating AI chatbot (Gemini Text)
        └── auth/
            ├── Login.tsx        # Login UI
            └── Register.tsx     # Farmer/Buyer registration UI
```

## What's Real vs. Static

| Feature           | Data Source                          |
| ----------------- | ------------------------------------ |
| Disease Detection | **Real** — Gemini AI Vision API      |
| Chatbot           | **Real** — Gemini AI Text Generation |
| Authentication    | **Real** — Express + MongoDB + JWT   |
| Mandi Prices      | **Real** — Agmarknet API via Express proxy |
| Weather           | Static — hardcoded (28°C Sunny)      |
| Articles          | Static — hardcoded content           |
| Images            | External — Unsplash CDN URLs         |

## Production Deployment

See [PRODUCTION.md](PRODUCTION.md) for deployment guide, security caveats, and recommendations.
