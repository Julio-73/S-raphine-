/**
 * Asset pipeline — Maison Séraphine
 * Crops, grades and encodes every editorial image into AVIF + WebP at
 * responsive widths. Source photography is 4K+ archival material.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve("_picks");
const OUT = path.resolve("public/media");
await fs.mkdir(OUT, { recursive: true });

const WIDTHS = [480, 720, 1080, 1440, 1920];
const WIDTHS_BY_SLUG = {
  campaign: [720, 1080, 1440, 1920, 2560, 3840],
};

/** slug, source id, aspect (w/h), crop position, monochrome? */
const images = [
  ["hero-origami", 52, 4 / 5, "north", true],
  ["maison-drape", 49, 3 / 4, "centre", true],
  ["maison-noir", 100, 16 / 10, "centre", false],
  ["collection-nocturne", 36, 3 / 4, "centre", false],
  ["collection-origami", 50, 3 / 4, "centre", true],
  ["collection-archive", 82, 3 / 4, "centre", true],
  ["look-01", 27, 4 / 5, "north", false],
  ["look-02", 55, 4 / 5, "centre", true],
  ["look-03", 28, 4 / 5, "north", false],
  ["look-04", 46, 4 / 5, "north", false],
  ["look-05", 41, 4 / 5, "centre", true],
  ["look-06", 30, 4 / 5, "north", false],
  ["campaign", 54, 3 / 2, "north", true],
  ["atelier", 92, 4 / 5, "centre", true],
  ["journal-01", 87, 4 / 3, "centre", true],
  ["journal-02", 97, 4 / 3, "centre", true],
  ["journal-03", 82, 4 / 3, "centre", true],
  ["cita", 41, 3 / 4, "centre", true],
];

const round = (n) => Math.round(n);

for (const [slug, id, aspect, position, mono] of images) {
  const source = path.join(SRC, `${id}.jpg`);
  const meta = await sharp(source).metadata();
  const srcW = meta.width ?? 1920;
  const widths = WIDTHS_BY_SLUG[slug] ?? WIDTHS;

  for (const width of widths) {
    if (width > srcW * 1.05) continue;
    const w = Math.min(width, 3840);
    const h = round(w / aspect);
    let pipeline = sharp(source)
      .resize(w, h, { fit: "cover", position, kernel: "lanczos3" });

    if (mono) {
      pipeline = pipeline
        .tint({ r: 247, g: 240, b: 229 })
        .linear(1.03, -3);
    } else {
      pipeline = pipeline
        .modulate({ saturation: 0.72, brightness: 1.015 })
        .linear(1.025, -3);
    }

    const base = pipeline.sharpen({ sigma: 0.4 });

    await Promise.all([
      base.clone().avif({ quality: 56, effort: 6, chromaSubsampling: "4:2:0" }).toFile(path.join(OUT, `${slug}-${w}.avif`)),
      base.clone().webp({ quality: 76, effort: 5 }).toFile(path.join(OUT, `${slug}-${w}.webp`)),
    ]);
  }
  console.log("✓", slug);
}

/* ── OG image ─────────────────────────────────────────────────── */
const ogBase = await sharp(path.join(SRC, "52.jpg"))
  .resize(1200, 630, { fit: "cover", position: "north" })
  .tint({ r: 247, g: 240, b: 229 })
  .linear(1.03, -3)
  .modulate({ brightness: 0.94 })
  .toBuffer();

const ogOverlay = Buffer.from(`
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f1ece3" stop-opacity="0.96"/>
      <stop offset="0.48" stop-color="#f1ece3" stop-opacity="0.82"/>
      <stop offset="0.75" stop-color="#f1ece3" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="70" y="96" font-family="Jost, Arial, sans-serif" font-size="15" letter-spacing="5" fill="#5c191e">MAISON DE HAUTE COUTURE — MADRID · PARÍS</text>
  <text x="64" y="290" font-family="Bodoni MT, Didot, Georgia, serif" font-size="92" fill="#14110f">Séraphine</text>
  <text x="70" y="352" font-family="Bodoni MT, Didot, Georgia, serif" font-size="34" font-style="italic" fill="#5c191e">El arte de vestir el silencio.</text>
  <line x1="70" y1="410" x2="500" y2="410" stroke="#14110f" stroke-opacity="0.25"/>
  <text x="70" y="452" font-family="Jost, Arial, sans-serif" font-size="15" letter-spacing="4" fill="#14110f" fill-opacity="0.7">A/W 26 — NOCTURNE · EDICIÓN DE 24 PIEZAS</text>
</svg>`);

await sharp(ogBase)
  .composite([{ input: ogOverlay }])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(path.resolve("public/og.jpg"));

/* ── Grain tile ───────────────────────────────────────────────── */
const size = 220;
const noise = Buffer.alloc(size * size * 4);
for (let i = 0; i < size * size; i++) {
  const v = 90 + Math.floor(Math.random() * 100);
  noise[i * 4] = v;
  noise[i * 4 + 1] = v;
  noise[i * 4 + 2] = v;
  noise[i * 4 + 3] = 26;
}
await sharp(noise, { raw: { width: size, height: size, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(OUT, "grain.png"));

/* ── Apple touch icon ─────────────────────────────────────────── */
await sharp(path.resolve("public/favicon.svg"))
  .resize(180, 180, { fit: "contain", background: "#14110f" })
  .png()
  .toFile(path.resolve("public/apple-touch-icon.png"));

console.log("assets done");
