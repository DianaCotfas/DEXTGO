import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function cmd(bin) {
  return process.platform === "win32" ? `${bin}.cmd` : bin;
}

function runSupabase(args, env) {
  const result = spawnSync(cmd("npx"), ["supabase", ...args], {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
    windowsHide: true,
  });
  if (result.error) {
    console.error("[db-push] Failed to execute Supabase CLI:", result.error.message);
  }
  return result;
}

function deriveProjectRef(env) {
  if (env.SUPABASE_PROJECT_REF) return env.SUPABASE_PROJECT_REF;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname; // <project-ref>.supabase.co
    return host.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

const fileEnv = {
  ...parseEnvFile(path.join(process.cwd(), ".env")),
  ...parseEnvFile(path.join(process.cwd(), ".env.local")),
};
const mergedEnv = { ...process.env, ...fileEnv };
const accessToken = mergedEnv.SUPABASE_ACCESS_TOKEN;

const projectRef = deriveProjectRef(mergedEnv);
if (!projectRef) {
  console.error(
    "[db-push] Missing project ref. Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL.",
  );
  process.exit(1);
}

if (!accessToken) {
  console.error("[db-push] Missing SUPABASE_ACCESS_TOKEN in .env.local.");
  process.exit(1);
}

const loginResult = runSupabase(["login", "--token", accessToken, "--yes"], mergedEnv);
if ((loginResult.status ?? 1) !== 0) {
  console.error("[db-push] Supabase login failed. Check SUPABASE_ACCESS_TOKEN.");
  process.exit(loginResult.status ?? 1);
}

const linkArgs = ["link", "--project-ref", projectRef, "--yes"];
if (mergedEnv.SUPABASE_DB_PASSWORD) {
  linkArgs.push("--password", mergedEnv.SUPABASE_DB_PASSWORD);
}
const linkResult = runSupabase(linkArgs, mergedEnv);
if ((linkResult.status ?? 1) !== 0) {
  console.error(
    "[db-push] Supabase link failed. Set SUPABASE_ACCESS_TOKEN (and SUPABASE_DB_PASSWORD if prompted) in .env.local.",
  );
  process.exit(linkResult.status ?? 1);
}

const result = runSupabase(["db", "push", "--yes"], mergedEnv);

process.exit(result.status ?? 1);
