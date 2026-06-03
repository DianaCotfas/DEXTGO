import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const src = path.join(webRoot, "public", "brand", "dextgo-wordmark.png");

async function run() {
  const meta = await sharp(src).metadata();
  const cropWidth = Math.min(meta.width ?? 256, Math.round((meta.height ?? 256) * 1.1));
  const iconSource = await sharp(src)
    .extract({ left: 0, top: 0, width: cropWidth, height: meta.height ?? 256 })
    .png()
    .toBuffer();

  const brandIcon = path.join(webRoot, "public", "brand", "dextgo-icon.png");
  const appIcon = path.join(webRoot, "src", "app", "icon.png");
  const appleIcon = path.join(webRoot, "src", "app", "apple-icon.png");

  await sharp(iconSource)
    .resize(512, 512, { fit: "contain", background: { r: 29, g: 29, b: 31, alpha: 1 } })
    .png()
    .toFile(brandIcon);

  await sharp(iconSource)
    .resize(32, 32, { fit: "contain", background: { r: 29, g: 29, b: 31, alpha: 1 } })
    .png()
    .toFile(appIcon);

  await sharp(iconSource)
    .resize(180, 180, { fit: "contain", background: { r: 29, g: 29, b: 31, alpha: 1 } })
    .png()
    .toFile(appleIcon);

  const faviconIco = path.join(webRoot, "src", "app", "favicon.ico");
  await fs.rm(faviconIco, { force: true });
  console.log("Generated:", brandIcon, appIcon, appleIcon);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
