import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");

const src = path.join(webRoot, "public", "brand", "dextgo-wordmark.png");
const tmp = path.join(webRoot, "public", "brand", "_tmp-wordmark.png");

async function run() {
  const srcBuf = await fs.readFile(src);

  const { data, info } = await sharp(srcBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const out = Buffer.from(data);

  const whiteThreshold = 240;
  for (let i = 0; i < out.length; i += channels) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
      out[i + 3] = 0;
    }
  }

  const trimmed = await sharp(out, { raw: { width, height, channels } })
    .png()
    .trim({ threshold: 10 })
    .toBuffer();

  await sharp(trimmed).png().toFile(tmp);
  await fs.rename(tmp, src);

  const meta = await sharp(src).metadata();
  console.log(
    `Wrote ${src} — ${meta.width}x${meta.height}, alpha=${meta.hasAlpha}`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
