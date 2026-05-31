#!/usr/bin/env node
/**
 * One-off: turn each blog PDF into per-page PNGs under public/blog/<slug>/.
 *
 * Usage:
 *   node scripts/extract-blog-assets.mjs
 *
 * Reads PDFs from ../files-from-diana/blog-data/ and writes:
 *   public/blog/<slug>/page-<n>.png
 *
 * Uses pdfjs-dist (legacy) + @napi-rs/canvas directly so we can control the
 * cmap URL format (pdfjs-dist >=5 requires a forward-slash terminated URL,
 * which the higher-level wrappers get wrong on Windows).
 */

import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";

// pdfjs-dist legacy is a CJS-friendly ESM build that works in Node.
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const webRoot = path.resolve(__dirname, "..");

const require = createRequire(import.meta.url);
const pdfjsPkgPath = require.resolve("pdfjs-dist/package.json");
const pdfjsRoot = path.dirname(pdfjsPkgPath);
const cMapUrl = pathToFileURL(path.join(pdfjsRoot, "cmaps") + path.sep).href;
const standardFontDataUrl = pathToFileURL(
  path.join(pdfjsRoot, "standard_fonts") + path.sep
).href;

const sources = [
  {
    slug: "rome-liquid-empire",
    file: "blog fontane roma.pdf",
  },
  {
    slug: "salina-turda",
    file: "blog salina turda.pdf",
  },
  {
    slug: "transylvania-castles-peles-vs-bran",
    file: "Blog_ Transilvania castels.pdf",
  },
  {
    slug: "caravaggio-san-luigi-dei-francesi",
    file: "blog san luigi dei francesi.pdf",
  },
];

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function extractPdf(slug, pdfPath, outDir, scale = 2.0) {
  const data = new Uint8Array(await fs.readFile(pdfPath));
  const loadingTask = pdfjs.getDocument({
    data,
    cMapUrl,
    cMapPacked: true,
    standardFontDataUrl,
    disableFontFace: true,
    useSystemFonts: false,
    verbosity: 0,
  });
  const pdf = await loadingTask.promise;
  const canvasFactory = new NodeCanvasFactory();

  const results = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const cac = canvasFactory.create(viewport.width, viewport.height);
    await page.render({
      canvasContext: cac.context,
      viewport,
      canvasFactory,
    }).promise;
    const buf = await cac.canvas.encode("png");
    const outFile = path.join(outDir, `page-${i}.png`);
    await fs.writeFile(outFile, buf);
    results.push(path.relative(webRoot, outFile));
    canvasFactory.destroy(cac);
    page.cleanup();
  }
  await pdf.cleanup();
  await pdf.destroy();
  return results;
}

async function run() {
  const blogDir = path.join(repoRoot, "files-from-diana", "blog-data");
  const outRoot = path.join(webRoot, "public", "blog");

  for (const { slug, file } of sources) {
    const pdfPath = path.join(blogDir, file);
    const outDir = path.join(outRoot, slug);
    await ensureDir(outDir);

    console.log(`\n▸ ${slug}`);
    console.log(`  reading: ${pdfPath}`);

    try {
      await fs.access(pdfPath);
    } catch {
      console.warn(`  ! missing PDF, skipping`);
      continue;
    }

    try {
      const written = await extractPdf(slug, pdfPath, outDir);
      for (const w of written) console.log(`  wrote: ${w}`);
    } catch (err) {
      console.error(`  ! failed:`, err.message);
    }
  }

  console.log("\nDone.");
}

// Silence font loading warnings from @napi-rs/canvas.
void GlobalFonts;

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
