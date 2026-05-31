import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const USE_COLOR = process.stdout.isTTY ? "\x1b[36m" : "";
const RESET = process.stdout.isTTY ? "\x1b[0m" : "";

function log(message) {
  console.log(`${USE_COLOR}[db-sync]${RESET} ${message}`);
}

function cmd(bin) {
  return process.platform === "win32" ? `${bin}.cmd` : bin;
}

function syncDatabase() {
  if (process.env.SKIP_DB_SYNC === "1") {
    log("Skipping Supabase migration push (SKIP_DB_SYNC=1).");
    return;
  }

  log("Applying Supabase migrations (supabase db push)...");
  const dbPushScript = path.join(process.cwd(), "scripts", "supabase-db-push.mjs");
  const result = spawnSync(process.execPath, [dbPushScript], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status === 0) {
    log("Migrations are in sync.");
    return;
  }

  log(
    "Migration sync failed. Starting Next.js anyway. You can retry with: npm run db:push",
  );
}

function startNextDev() {
  const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, "dev", ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

syncDatabase();
startNextDev();
