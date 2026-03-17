import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import mandiRoutes from "./routes/mandi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// load env from project .env if present
// (connectDB also loads it, but keep this for any immediate env reads)
try {
  // Load primary .env only
  const dotenv = await import("dotenv");
  dotenv.config({ path: resolve(__dirname, "../.env") });
} catch (e) {
  // ignore
}

const app = express();
// Default to 4000 to match common dev expectation (you can override with PORT env var)
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

// Auth routes removed by request. If you need auth later, restore routes/auth.js and re-enable mounting here.

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// root route for browser convenience
app.get("/", (_req, res) => {
  res.send("API is running");
});

// Mount auth routes
app.use("/api/auth", authRoutes);
app.use("/api/mandi", mandiRoutes);

// Start listening immediately so the app is reachable even if DB is still connecting.
app.listen(PORT, () => {
  console.log(`AgroCare API server running on http://localhost:${PORT}`);
  console.log("Attempting MongoDB connection in background...");
});

// Connect DB in background. If connection fails we log recommendations but keep server alive.
connectDB().catch((err) => {
  console.error(
    "Background MongoDB connection failed:",
    err && err.message ? err.message : err,
  );
  console.error(
    "If you are using Atlas, ensure MONGODB_URI is set in .env or exported in your shell and your IP is whitelisted.",
  );
});
