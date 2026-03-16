# PRODUCTION.md — AgroCare Production Deployment Guide

> Read this before deploying AgroCare to any public environment.

---

## Table of Contents

- [Build for Production](#build-for-production)
- [API Key Exposure (Critical)](#api-key-exposure-critical)
- [Recommended Architecture for Production](#recommended-architecture-for-production)
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
```

The production build outputs to `dist/`. This folder is gitignored and should never be committed.

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

## Recommended Architecture for Production

To deploy AgroCare securely, you need to **move the Gemini API calls behind a backend proxy**. The frontend should never hold the API key directly.

### Option 1: Add a Backend API Proxy

```
Browser (React app)
    ↓ fetch("/api/chat", { message })
Backend (Express / Node.js)
    ↓ GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
Google Gemini API
```

**Steps:**

1. Create a backend server (the project already has `express` in dependencies).
2. Move the `GoogleGenAI` calls from `Chatbot.tsx` and `DiseaseDetection.tsx` to backend API routes.
3. Store `GEMINI_API_KEY` as a server-side environment variable only.
4. The frontend calls your backend endpoints instead of Gemini directly.
5. Add rate limiting and authentication to your backend to prevent abuse.

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

| Variable         | Location     | Behavior                                 |
| ---------------- | ------------ | ---------------------------------------- |
| `GEMINI_API_KEY` | `.env`       | Injected at build time via Vite `define` |

### Production (Recommended)

| Variable         | Location        | Behavior                                      |
| ---------------- | --------------- | --------------------------------------------- |
| `GEMINI_API_KEY` | Server env only | Never sent to the client; used by backend API |

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
| User Profile | Hardcoded "Rajesh Kumar"          | Implement authentication                                       |

---

## Security Checklist

Before deploying to production, verify the following:

- [ ] **API key is NOT in client-side code** — moved to a backend proxy
- [ ] **Rate limiting** is implemented on backend API routes
- [ ] **Authentication** is implemented (user login system)
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

The project ships with backend dependencies from the AI Studio template that are not actively used:

| Package          | Version | Purpose                   | Production Action                            |
| ---------------- | ------- | ------------------------- | -------------------------------------------- |
| `express`        | 4.21    | HTTP server framework     | Use if building backend proxy                |
| `better-sqlite3` | 12.4    | SQLite3 database bindings | Use for local data persistence               |
| `dotenv`         | 17.2    | Env var loader            | Vite handles this; remove or use for backend |

If you build a backend proxy, these dependencies are already available. Otherwise, they can be removed to reduce install size:

```bash
npm uninstall express better-sqlite3 dotenv @types/express
```

---

_Last updated: 2026-03-09_
