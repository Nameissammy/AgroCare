# PRODUCTION.md — AgroCare Production Deployment Guide

> Read this before deploying AgroCare to any public environment.

---

## Table of Contents

- [Build for Production](#build-for-production)
- [Runtime Topology](#runtime-topology)
- [API Key Exposure (Critical)](#api-key-exposure-critical)
- [Authentication Status](#authentication-status)
- [Environment Variables](#environment-variables)
- [Static Data Limitations](#static-data-limitations)
- [Security Checklist](#security-checklist)
- [Deployment Options](#deployment-options)

---

## Build for Production

```bash
# Create an optimized production build
npm run build

# Preview the build locally before deploying
npm run preview

# Clean build output
npm run clean

# Start API server
npm run server
```

The production frontend build outputs to `dist/`. This folder is gitignored and should never be committed.

---

## Runtime Topology

Current architecture is full-stack:

- **Frontend**: Vite React app on port `3000`
- **Backend**: Express API on port `4000` (default)
- **Database**: MongoDB (local or Atlas)

In development, Vite proxies `/api/*` to `http://localhost:4000`.

---

## API Key Exposure (Critical)

**This is the most important production concern for this project.**

Vite inlines the `GEMINI_API_KEY` into the built JavaScript bundle via the `define` option in `vite.config.ts`:

```ts
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
}
```

### What This Means

- The `dist/` build output contains your **actual API key in plain text** inside the JS bundle.
- `dist/` is gitignored, so this is **not a git leak concern**.
- However, if you deploy the built app publicly, **anyone can extract your API key** by inspecting the JavaScript source in their browser's DevTools.
- A leaked API key means anyone can make Gemini API calls billed to your account.

### Why It's Fine for Local Development

- The key only exists in `.env` (gitignored) and in the in-memory dev server bundle.
- No one else has access to your local machine's network.

### Why It's a Problem in Production

- Client-side JavaScript is fully visible to end users.
- Minification/obfuscation does **not** protect the key — it can still be extracted trivially.
- Google API keys can be abused for quota exhaustion or unauthorized billing.

---

## Authentication Status

Authentication is now implemented with:

- `POST /api/auth/register`
- `POST /api/auth/login`
- User roles: `farmer` and `buyer`
- Password hashing: `bcryptjs`
- Session token: JWT (7-day expiry)

Current frontend session storage uses browser `localStorage` for JWT + user profile.

### Production Recommendation for Auth

- Move from `localStorage` tokens to **HTTP-only secure cookies** to reduce XSS token theft risk.
- Add token refresh/rotation and logout invalidation.
- Add authorization middleware for protected backend routes.
- Add request rate limiting on auth endpoints.

---

## Recommended Architecture for Production

To deploy AgroCare securely, keep API secrets server-side and expand the existing backend:

### Option 1: Use Existing Express Backend as API Proxy

```
Browser (React app)
    ↓ fetch("/api/chat", { message })
Backend (Express / Node.js)
    ↓ GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
Google Gemini API
```

**Steps:**

1. Add backend routes for Gemini use cases (`/api/chat`, `/api/disease-detect`).
2. Move `GoogleGenAI` calls from `Chatbot.tsx` and `DiseaseDetection.tsx` into those routes.
3. Store `GEMINI_API_KEY` in backend env only.
4. Keep frontend calls limited to your own `/api/*` endpoints.
5. Add auth + rate limiting + validation on these endpoints.

**Components to refactor:**

- `src/components/Chatbot.tsx` (line 48) — move `GoogleGenAI` call to backend
- `src/components/DiseaseDetection.tsx` (line 57) — move `GoogleGenAI` call to backend

### Option 2: Use Google Cloud API Gateway

- Deploy the app on Google Cloud.
- Set up an API Gateway with API key restrictions (HTTP referrer, IP, etc.).
- Use Google Cloud's built-in key management instead of exposing raw keys.

### Option 3: Serverless Functions

Use serverless functions (Vercel Functions, Cloudflare Workers, AWS Lambda) as a lightweight proxy:

```
Browser → Serverless Function (holds API key) → Gemini API
```

This avoids maintaining a full backend server while keeping the key server-side.

---

## Environment Variables

### Local Development (Current Setup)

| Variable         | Location          | Behavior                                 |
| ---------------- | ----------------- | ---------------------------------------- |
| `GEMINI_API_KEY` | `.env/.env.local` | Injected at build time via Vite `define` |
| `MONGODB_URI`    | `.env/.env.local` | Backend MongoDB connection string        |
| `JWT_SECRET`     | `.env/.env.local` | Backend JWT signing secret               |
| `CORS_ORIGIN`    | `.env/.env.local` | Allowed origin for Express API           |
| `PORT`           | `.env/.env.local` | Express server port (default `4000`)     |

### Production (Recommended)

| Variable         | Location        | Behavior                                             |
| ---------------- | --------------- | ---------------------------------------------------- |
| `GEMINI_API_KEY` | Server env only | Never sent to the client; used by backend API routes |
| `MONGODB_URI`    | Server env only | Used by backend for user/auth and application data   |
| `JWT_SECRET`     | Server env only | Used by backend auth token issuance/verification     |
| `CORS_ORIGIN`    | Server env only | Lock to deployed frontend domain                     |

**Never hardcode API keys in source code or commit them to version control.**

---

## Static Data Limitations

The following data is hardcoded and will not update dynamically in production:

| Feature      | Current State                     | Production Recommendation                                      |
| ------------ | --------------------------------- | -------------------------------------------------------------- |
| Mandi Prices | 4 static crops with fixed prices  | Integrate [Agmarknet API](https://agmarknet.gov.in) or similar |
| Weather      | Hardcoded "28°C Sunny"            | Integrate OpenWeatherMap or Weather API                        |
| Articles     | Static content in component files | Use a CMS or database                                          |
| Gov Schemes  | 4 static scheme cards             | Fetch from government data portals                             |
| Images       | Unsplash CDN URLs (hardcoded)     | Host images locally or use your own CDN                        |
| Scan History | Static "12 Total"                 | Persist to a database                                          |
| Farm Health  | Static "88/100"                   | Calculate from actual scan results                             |
| User Profile | Real user from auth session       | Add profile edit/settings APIs                                 |

---

## Security Checklist

Before deploying to production, verify the following:

- [ ] **API key is NOT in client-side code** — moved to a backend proxy
- [ ] **Rate limiting** is implemented on backend API routes
- [x] **Authentication baseline** is implemented (register/login + JWT)
- [ ] **JWT stored in HTTP-only cookies** (recommended upgrade from localStorage)
- [ ] **Protected route middleware** is implemented for non-public APIs
- [ ] **CORS** is configured to only allow your frontend domain
- [ ] **HTTPS** is enforced on all endpoints
- [ ] **Content Security Policy (CSP)** headers are set
- [ ] **`.env*` files** are excluded from version control (verify `.gitignore`)
- [ ] **`dist/` folder** is not committed to git
- [ ] **Unsplash images** usage complies with their license terms
- [ ] **Input sanitization** on any user-generated content
- [ ] **Error messages** do not leak internal details (API keys, stack traces)
- [ ] **Dependencies** are audited (`npm audit`) and up to date

---

## Deployment Options

| Platform            | Type               | Notes                                                  |
| ------------------- | ------------------ | ------------------------------------------------------ |
| Vercel              | Static + Functions | Easy deploy; use Vercel Functions as API proxy         |
| Netlify             | Static + Functions | Similar to Vercel; use Netlify Functions               |
| Google Cloud Run    | Container          | Full control; originally designed for this (AI Studio) |
| AWS S3 + CloudFront | Static             | Frontend only; pair with Lambda for API proxy          |
| Railway / Render    | Full-stack         | Deploy Express backend + React frontend together       |

### Quick Deploy (Static Only — NOT Recommended for Production)

```bash
npm run build
# Deploy the dist/ folder to any static host
```

> **Warning:** This exposes your API key. Only use for demos or internal tools behind a VPN.

---

## Unused Dependencies

Some dependencies/files are still legacy artifacts and should be reviewed before production:

| Package/File                           | Current Use                             | Production Action                                              |
| -------------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `better-sqlite3`                       | Unused in current runtime               | Remove if not needed                                           |
| `server/controllers/authController.js` | Legacy CJS controller, unused by routes | Remove or migrate to ESM if you plan to use controllers        |
| `server/package.json`                  | Separate backend package metadata       | Keep only if intentionally running backend as separate package |

If you remove unused dependencies from the root app:

```bash
npm uninstall better-sqlite3
```

---

_Last updated: 2026-03-16_
