/**
 * Upload local media files to Cloudflare R2 and optionally persist the uploaded
 * key into Supabase CMS tables in the same run.
 *
 * Usage:
 *   node scripts/import-media-and-link.mjs scripts/media-import.manifest.json
 *
 * Manifest example:
 * {
 *   "items": [
 *     {
 *       "source": "public/images/gallery/new-01.jpg",
 *       "prefix": "gallery",
 *       "targets": [
 *         { "table": "gallery_items", "match": { "id": "uuid" }, "column": "image_url" }
 *       ]
 *     },
 *     {
 *       "source": "public/images/hero/home-cover.jpg",
 *       "prefix": "hero/home",
 *       "targets": [
 *         { "table": "hero_media", "match": { "page_slug": "home" }, "column": "image_url" }
 *       ]
 *     }
 *   ]
 * }
 */
import { readFile, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const here = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(here, "..");
await loadEnv(join(projectRoot, ".env.local"));

const manifestArg = process.argv[2];
if (!manifestArg) {
  console.error("Usage: node scripts/import-media-and-link.mjs <manifest.json>");
  process.exit(1);
}

const manifestPath = resolve(projectRoot, manifestArg);
const manifestRaw = JSON.parse(await readFile(manifestPath, "utf8"));
const items = Array.isArray(manifestRaw?.items) ? manifestRaw.items : [];
if (items.length === 0) {
  console.error("[media-import] Manifest has no items.");
  process.exit(1);
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET ?? "dextgo-media";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("[media-import] Missing R2 credentials in .env.local");
  process.exit(1);
}
if (!supabaseUrl || !serviceRole) {
  console.error("[media-import] Missing Supabase service role credentials in .env.local");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});
const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

for (const item of items) {
  const source = resolve(projectRoot, item.source);
  await ensureFile(source);

  const key = item.key || buildKey(item.prefix || "uploads", basename(source));
  const body = await readFile(source);
  const contentType = guessMime(source);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  console.log(`[media-import] uploaded ${item.source} -> ${key}`);

  const targets = Array.isArray(item.targets) ? item.targets : [];
  for (const target of targets) {
    await applyTargetUpdate({ supabase, target, key });
  }
}

console.log("[media-import] Complete.");

async function applyTargetUpdate({ supabase, target, key }) {
  const table = target.table;
  const column = target.column;
  const match = target.match;
  const mode = target.mode || "set";
  if (!table || !column || !match || typeof match !== "object") {
    throw new Error("[media-import] Invalid target definition");
  }

  const entries = Object.entries(match);
  if (!entries.length) throw new Error("[media-import] Target match cannot be empty");
  const [matchColumn, matchValue] = entries[0];

  if (mode === "append-array") {
    const { data: existing, error: readError } = await supabase
      .from(table)
      .select(column)
      .eq(matchColumn, matchValue)
      .maybeSingle();
    if (readError) throw readError;
    const previous = Array.isArray(existing?.[column]) ? existing[column] : [];
    const next = Array.from(new Set([...previous, key]));
    const { error } = await supabase
      .from(table)
      .update({ [column]: next })
      .eq(matchColumn, matchValue);
    if (error) throw error;
    console.log(
      `[media-import] ${table}.${column} appended (${matchColumn}=${matchValue})`,
    );
    return;
  }

  const { error } = await supabase
    .from(table)
    .update({ [column]: key })
    .eq(matchColumn, matchValue);
  if (error) throw error;
  console.log(`[media-import] ${table}.${column} set (${matchColumn}=${matchValue})`);
}

function buildKey(prefix, filename) {
  const cleanPrefix = String(prefix).replace(/(^\/+|\/+$)/g, "");
  const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const stamp = Date.now().toString(36);
  return `${cleanPrefix}/${stamp}-${safeName}`;
}

function guessMime(pathname) {
  const ext = pathname.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "avif") return "image/avif";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  return "application/octet-stream";
}

async function ensureFile(pathname) {
  const s = await stat(pathname).catch(() => null);
  if (!s?.isFile()) {
    throw new Error(`[media-import] Source file not found: ${pathname}`);
  }
}

async function loadEnv(pathname) {
  const s = await stat(pathname).catch(() => null);
  if (!s?.isFile()) return;
  const text = await readFile(pathname, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, valueRaw] = match;
    if (process.env[key]) continue;
    process.env[key] = valueRaw.replace(/^['"]|['"]$/g, "");
  }
}
