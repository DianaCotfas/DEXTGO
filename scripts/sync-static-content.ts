/**
 * One-shot sync of static content (countries, regions, itineraries, blog,
 * itinerary steps with new structured fields) into the configured Supabase
 * database. Uses the service role key so it bypasses RLS.
 *
 * Run with:
 *   npx tsx scripts/sync-static-content.ts
 */

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { syncStaticContentToDatabase } from "@/lib/admin/content-sync";
import type { Database } from "@/lib/supabase/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadEnv({ path: resolve(__dirname, "..", ".env.local") });
loadEnv({ path: resolve(__dirname, "..", ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "[sync] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("[sync] Pushing static content to:", url);
  await syncStaticContentToDatabase(supabase);
  console.log("[sync] Done. Itineraries, regions, blog posts and steps are up to date.");
}

main().catch((err) => {
  console.error("[sync] Failed:", err);
  process.exit(1);
});
