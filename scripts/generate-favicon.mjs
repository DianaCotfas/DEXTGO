import sharp from "sharp";
import toIco from "to-ico";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const logoSource = path.join(webRoot, "public", "brand", "dextgo-logo-source.png");
const fallbackSource = path.join(webRoot, "public", "brand", "dextgo-wordmark.png");

async function resolveSourcePath() {
  try {
    await fs.access(logoSource);
    return logoSource;
  } catch {
    return fallbackSource;
  }
}

async function loadTransparentIconSource() {
  const sourcePath = await resolveSourcePath();
  const sourceMeta = await sharp(sourcePath).metadata();
  let pipeline = sharp(sourcePath);

  // Fallback wordmark is wide: crop a square-ish mark from the left.
  if (sourcePath === fallbackSource) {
    const cropWidth = Math.min(
      sourceMeta.width ?? 256,
      Math.round((sourceMeta.height ?? 256) * 1.1),
    );
    pipeline = pipeline.extract({
      left: 0,
      top: 0,
      width: cropWidth,
      height: sourceMeta.height ?? 256,
    });
  }

  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Remove light backgrounds while keeping dark logo strokes opaque.
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const alphaFactor = Math.max(0, Math.min(1, (225 - luminance) / 85));
    const nextAlpha = Math.round(a * alphaFactor);
    data[i + 3] = nextAlpha;
    if (nextAlpha > 0) {
      // Keep logo transparent but raise contrast for dark browser tabs.
      data[i] = 112;
      data[i + 1] = 126;
      data[i + 2] = 142;
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
}

async function run() {
  const iconSource = await loadTransparentIconSource();

  const brandIcon = path.join(webRoot, "public", "brand", "dextgo-icon.png");
  const appIcon = path.join(webRoot, "src", "app", "icon.png");
  const appleIcon = path.join(webRoot, "src", "app", "apple-icon.png");
  const appFavicon = path.join(webRoot, "src", "app", "favicon.ico");
  const publicFavicon = path.join(webRoot, "public", "favicon.ico");

  await sharp(iconSource)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(brandIcon);

  await sharp(iconSource)
    .resize(32, 32, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(appIcon);

  await sharp(iconSource)
    .resize(180, 180, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(appleIcon);

  const png16 = await sharp(iconSource)
    .resize(16, 16, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
  const png32 = await sharp(iconSource)
    .resize(32, 32, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
  const ico = await toIco([png16, png32]);

  await fs.writeFile(appFavicon, ico);
  await fs.writeFile(publicFavicon, ico);

  console.log("Generated:", brandIcon, appIcon, appleIcon, appFavicon, publicFavicon);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
