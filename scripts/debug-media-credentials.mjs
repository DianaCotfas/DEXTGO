/**
 * One-off diagnostic: R2 connectivity, CMS image paths, live URL probes.
 * Usage: node scripts/debug-media-credentials.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHmac } from "node:crypto";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..");
loadEnv(join(projectRoot, ".env.local"));

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2Secret = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET || "dextgo-media";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL || "https://dextgo.com";

console.log("=== ENV SUMMARY ===");
for (const k of [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "NEXT_PUBLIC_R2_PUBLIC_BASE",
  "MEDIA_PROXY_SIGNING_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]) {
  const v = process.env[k] ?? "";
  console.log(`${k}: ${v ? `SET (${v.length} chars)` : "EMPTY"}`);
}

console.log("\n=== R2 CREDENTIAL TEST ===");
try {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey: r2Secret },
  });
  const list = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 8 }),
  );
  console.log(
    "R2 list: OK",
    (list.Contents ?? []).map((o) => o.Key),
  );
} catch (e) {
  console.log("R2 list: FAILED", e.name, e.message);
}

console.log("\n=== SUPABASE CMS IMAGE URLS (latest) ===");
const sb = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false },
});
const tables = [
  ["gallery_items", "image_url"],
  ["blog_posts", "cover_url"],
  ["itineraries", "hero_image_url"],
];
for (const [table, col] of tables) {
  const orderCol = table === "blog_posts" ? "published_at" : "updated_at";
  const selectCols =
    table === "blog_posts" ? `slug,title,${col}` : `id,title,slug,${col}`;
  const { data, error } = await sb
    .from(table)
    .select(selectCols)
    .order(orderCol, { ascending: false })
    .limit(3);
  if (error) console.log(`${table}: ERROR`, error.message);
  else console.log(`${table}:`, JSON.stringify(data, null, 2));
}

console.log("\n=== SIGNED URL PROBE (using local signing secret) ===");
const signingSecret =
  process.env.MEDIA_PROXY_SIGNING_SECRET ||
  process.env.R2_SECRET_ACCESS_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "dextgo-dev-media-secret";

function signMediaKey(key) {
  const ttl = 31536000;
  const now = Math.floor(Date.now() / 1000);
  const window = 3600;
  const rounded = Math.floor(now / window) * window;
  const exp = rounded + ttl;
  const sig = createHmac("sha256", signingSecret).update(`${key}:${exp}`).digest("hex");
  const enc = key.split("/").map(encodeURIComponent).join("/");
  return `${site}/api/media/${enc}?exp=${exp}&sig=${sig}`;
}

const galleryRow = await sb
  .from("gallery_items")
  .select("image_url")
  .order("position", { ascending: true })
  .limit(1)
  .maybeSingle();
const blogRow = await sb
  .from("blog_posts")
  .select("cover_url,slug")
  .order("published_at", { ascending: false })
  .limit(1)
  .maybeSingle();
const itinRow = await sb
  .from("itineraries")
  .select("hero_image_url,slug")
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();

const probeKeys = [
  ["gallery", galleryRow.data?.image_url],
  ["blog", blogRow.data?.cover_url],
  ["itinerary", itinRow.data?.hero_image_url],
  ["static", "/images/itineraries/rome-for-kids/rome-04.png"],
];

for (const [label, path] of probeKeys) {
  if (!path) {
    console.log(`${label}: no path in DB`);
    continue;
  }
  if (/^https?:/.test(path)) {
    const r = await fetch(path, { method: "HEAD" });
    console.log(`${label}: ${path} -> ${r.status} (external)`);
    continue;
  }
  if (path.startsWith("/images/")) {
    const url = `${site}${path}`;
    const r = await fetch(url, { method: "HEAD" });
    console.log(`${label}: ${path} -> ${r.status} (bundled public)`);
    continue;
  }
  const key = path.replace(/^\/api\/media\//, "").replace(/^\/+/, "");
  const url = signMediaKey(key);
  const r = await fetch(url, { method: "GET" });
  const detail = r.ok
    ? `OK ${r.headers.get("content-type")}`
    : await r.text();
  console.log(`${label}: ${key} -> ${r.status} ${detail.slice(0, 150)}`);
}

console.log("\n=== HOMEPAGE IMAGE CHECK (decoded URLs) ===");
const html = await (await fetch(site)).text();
const imgSrc = [...html.matchAll(/src="([^"]+)"/g)]
  .map((m) => m[1].replace(/&amp;/g, "&"))
  .filter((s) => s.includes("/api/media/"));
console.log("Sample homepage media src:", imgSrc.slice(0, 3));
for (const src of imgSrc.slice(0, 3)) {
  const url = src.startsWith("http") ? src : `${site}${src}`;
  const r = await fetch(url, { method: "GET" });
  const detail = r.ok
    ? `OK ${r.headers.get("content-type")}`
    : await r.text();
  console.log(`  ${r.status} ${detail.slice(0, 120)}`);
  console.log(`  ${url.slice(0, 120)}`);
}

console.log("\n=== CMS UPLOAD ENDPOINT (expect 401 without auth) ===");
try {
  const r = await fetch(`${site}/api/admin/upload`, { method: "POST" });
  const body = await r.text();
  console.log(`POST /api/admin/upload -> ${r.status}`, body.slice(0, 300));
} catch (e) {
  console.log("upload probe failed", e.message);
}

function loadEnv(path) {
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1);
    if (!process.env[k]) process.env[k] = v;
  }
}
