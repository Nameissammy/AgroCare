# 🌾 AgroCare — AI-Powered Farmer's Portal

A comprehensive agricultural dashboard built with **React 19**, **TypeScript**, **Vite 6**, **Tailwind CSS 4**, and **Google Gemini AI**.

## Features

- **Dashboard** — Weather overview, live mandi price cards, crop health CTA, featured articles, and farm stats
- **Mandi Prices** — Agricultural market price tables with filters, trends, summary cards, and alerts
- **Disease Detection** — Upload a crop photo and get AI-powered disease diagnosis using Gemini Vision (real API)
- **Knowledge Hub** — Educational articles, category tabs, difficulty levels, and government scheme listings
- **AI Chatbot** — Floating agricultural expert assistant powered by Gemini AI (real API)

## Tech Stack

| Layer      | Technology                                                  |
| ---------- | ----------------------------------------------------------- |
| Framework  | React 19                                                    |
| Language   | TypeScript 5.8 (strict mode)                                |
| Build Tool | Vite 6.2                                                    |
| Styling    | Tailwind CSS 4.1 (`@tailwindcss/vite` plugin)               |
| Icons      | lucide-react 0.546                                          |
| Animations | motion 12.23 (Framer Motion successor)                      |
| AI         | @google/genai 1.29 — Google Gemini `gemini-3-flash-preview` |

## Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- A **Google Gemini API key** — get one at https://aistudio.google.com/apikey

## Getting Started

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd agrocare

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local

# 4. Add your Gemini API key to .env.local
# GEMINI_API_KEY=your_actual_key_here

# 5. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

## Environment Variables

| Variable         | Required | Description                                           |
| ---------------- | -------- | ----------------------------------------------------- |
| `GEMINI_API_KEY` | **Yes**  | Google Gemini API key for chatbot & disease detection |
| `APP_URL`        | No       | Host URL (AI Studio internal, not needed locally)     |
| `DISABLE_HMR`    | No       | Set `true` to disable Vite HMR (AI Studio internal)   |

The API key is injected into the frontend at build time via Vite's `define` option in `vite.config.ts`. Components access it as `process.env.GEMINI_API_KEY`.

## Available Scripts

| Script            | Command            | Description                      |
| ----------------- | ------------------ | -------------------------------- |
| `npm run dev`     | `vite --port=3000` | Start dev server with HMR        |
| `npm run build`   | `vite build`       | Production build → `dist/`       |
| `npm run preview` | `vite preview`     | Preview production build locally |
| `npm run clean`   | `rm -rf dist`      | Remove build output              |
| `npm run lint`    | `tsc --noEmit`     | TypeScript type checking         |

## Project Structure

```
agrocare/
├── index.html             # Vite entry HTML
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript config (strict, ES2022, @/* alias)
├── vite.config.ts         # Vite config (React + Tailwind + API key injection)
├── .env.example           # Environment variable template
├── .env.local             # Your local secrets (gitignored)
├── CLAUDE.md              # Project reference for AI assistants
├── PRODUCTION.md          # Production deployment guide & caveats
└── src/
    ├── main.tsx           # React DOM entry point
    ├── App.tsx            # App shell — screen routing + layout
    ├── index.css          # Tailwind CSS import
    ├── types.ts           # Shared TypeScript types
    └── components/
        ├── Sidebar.tsx          # Left navigation + branding
        ├── Header.tsx           # Top bar with search & notifications
        ├── Dashboard.tsx        # Home screen with weather, prices, stats
        ├── MandiPrices.tsx      # Market price tables & filters
        ├── DiseaseDetection.tsx # AI crop disease analysis (Gemini Vision)
        ├── KnowledgeHub.tsx     # Educational articles & gov schemes
        └── Chatbot.tsx          # Floating AI chatbot (Gemini Text)
```

## What's Real vs. Static

| Feature           | Data Source                          |
| ----------------- | ------------------------------------ |
| Disease Detection | **Real** — Gemini AI Vision API      |
| Chatbot           | **Real** — Gemini AI Text Generation |
| Mandi Prices      | Static — hardcoded sample data       |
| Weather           | Static — hardcoded (28°C Sunny)      |
| Articles          | Static — hardcoded content           |
| Images            | External — Unsplash CDN URLs         |

## Production Deployment

See [PRODUCTION.md](PRODUCTION.md) for deployment guide, security caveats, and recommendations.

