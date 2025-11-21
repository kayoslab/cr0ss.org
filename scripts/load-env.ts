/**
 * Environment variable loader
 * Loads .env files before any other imports
 */

import { config } from "dotenv";

// Load environment variables in order of precedence
config({ path: ".env" });
config({ path: ".env.development.local" });
config({ path: ".env.local" });

console.log("✅ Environment variables loaded");
