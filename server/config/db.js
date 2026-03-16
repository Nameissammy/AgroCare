import dotenv from "dotenv";
import mongoose from "mongoose";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load project .env only.
dotenv.config({ path: resolve(__dirname, "../../.env") });

const connectDB = async () => {
  const raw = process.env.MONGODB_URI || process.env.MONGO_URI;
  const defaultLocal = "mongodb://127.0.0.1:27017/agrocare";
  const uri = raw && raw.trim() ? raw.trim() : defaultLocal;

  if (raw && !raw.trim()) {
    console.warn(
      "MONGODB_URI/MONGO_URI is set but empty. Falling back to default localhost URI. Please check .env.",
    );
  }

  const serverSelectionTimeoutMS = 5000;
  const maxAttempts = 4;
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const tryConnect = async (u) =>
    mongoose.connect(u, { serverSelectionTimeoutMS });

  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const useUri =
        attempt > 1 && uri.includes("localhost")
          ? uri.replace("localhost", "127.0.0.1")
          : uri;
      if (attempt > 1)
        console.warn(
          `[db] retry #${attempt} connecting to MongoDB using ${useUri}`,
        );
      await tryConnect(useUri);

      try {
        const masked = (() => {
          if (!useUri.includes("@")) return useUri;
          return useUri.replace(
            /(mongodb(?:\+srv)?:\/\/)(.*@)(.*)/,
            (m, p1, p2, p3) => `${p1}****@${p3}`,
          );
        })();
        console.log("MongoDB connected. Using URI:", masked);
      } catch (e) {
        console.log("MongoDB connected");
      }
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`[db] connect attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxAttempts) await delay(1500 * attempt);
    }
  }

  console.error(
    "MongoDB connection error after retries:",
    lastErr && lastErr.message ? lastErr.message : lastErr,
  );
  console.error("Common fixes:");
  console.error(
    "- Ensure mongod is running locally: `brew services start mongodb-community@6.0` or run `mongod --dbpath server/mongo-data`",
  );
  console.error(
    "- If using Atlas, verify MONGODB_URI/MONGO_URI, whitelist your IP and URL-encode any special characters in the password.",
  );
  console.error("- Make sure .env contains only KEY=VALUE lines (no JS).");
  // do not exit immediately; throw so caller can decide (keeps nodemon alive if desired)
  throw lastErr;
};

export default connectDB;
