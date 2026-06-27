import { rmSync } from "node:fs";
import { join } from "node:path";

const nextDir = join(process.cwd(), ".next");

try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("[clean-next] Removed .next cache");
} catch (error) {
  console.warn("[clean-next] Could not remove .next:", error);
}
