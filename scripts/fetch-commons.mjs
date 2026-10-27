import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("_commons");
await fs.mkdir(OUT, { recursive: true });

const queries = [
  "haute couture fashion show",
  "Paris Fashion Week runway",
  "fashion model runway gown",
  "haute couture dress",
  "fashion editorial model",
  "evening gown couture",
  "fashion atelier sewing",
  "fashion backstage model",
  "silk fabric drape",
  "couture embroidery detail",
];

const api = new URL("https://commons.wikimedia.org/w/api.php");
api.search = new URLSearchParams({
  action: "query",
  generator: "search",
  gsrnamespace: "6",
  gsrlimit: "30",
  prop: "imageinfo",
  iiprop: "url|size|mime",
  iiurlwidth: "540",
  format: "json",
  origin: "*",
}).toString();

const seen = new Set();
const items = [];

for (const q of queries) {
  const url = new URL(api);
  url.searchParams.set("gsrsearch", q);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { "User-Agent": "SeraphineMaison/1.0 (design demo)" } });
    const json = await res.json();
    const pages = Object.values(json?.query?.pages ?? {});
    for (const p of pages) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      if (!/jpeg|png|webp/.test(ii.mime ?? "")) continue;
      if (ii.width < 1200 || ii.height < 900) continue;
      if (seen.has(p.title)) continue;
      seen.add(p.title);
      items.push({ title: p.title, q, w: ii.width, h: ii.height, thumb: ii.thumburl, full: ii.url, page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}` });
    }
  } catch (e) {
    console.log("QFAIL", q, e.message);
  }
}

console.log("collected", items.length);

const usable = [];
for (let i = 0; i < items.length; i++) {
  const it = items[i];
  const file = path.join(OUT, `${String(i).padStart(3, "0")}.jpg`);
  try {
    const res = await fetch(it.thumb, { signal: AbortSignal.timeout(30000), headers: { "User-Agent": "SeraphineMaison/1.0" } });
    if (!res.ok) continue;
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    const meta = await sharp(file).metadata();
    if (!meta.width || meta.width < 200) continue;
    usable.push({ ...it, file, previewW: meta.width, previewH: meta.height, index: usable.length });
  } catch { /* skip */ }
}

await fs.writeFile(path.resolve("_commons.json"), JSON.stringify(usable, null, 2));

// contact sheets, 20 per sheet
const COLS = 5, CW = 300, CH = 340, PAD = 8, LABEL = 24;
for (let s = 0; s < Math.ceil(usable.length / 20); s++) {
  const slice = usable.slice(s * 20, s * 20 + 20);
  const rows = Math.ceil(slice.length / COLS);
  const composites = [];
  for (let i = 0; i < slice.length; i++) {
    const it = slice[i];
    const buf = await sharp(it.file).resize(CW, CH, { fit: "cover" }).toBuffer();
    const left = PAD + (i % COLS) * (CW + PAD);
    const top = PAD + Math.floor(i / COLS) * (CH + LABEL + PAD);
    composites.push({ input: buf, left, top: top + LABEL });
    composites.push({
      input: Buffer.from(`<svg width="${CW}" height="${LABEL}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="17" font-family="Arial" font-size="13" fill="#fff">${it.index} · ${it.w}x${it.h} · ${it.title.replace(/[^a-zA-Z0-9 ]/g, "").slice(5, 34)}</text></svg>`),
      left, top,
    });
  }
  await sharp({ create: { width: COLS * (CW + PAD) + PAD, height: rows * (CH + LABEL + PAD) + PAD, channels: 3, background: "#e8e4dc" } })
    .composite(composites).jpeg({ quality: 82 }).toFile(path.resolve(`_commons-sheet-${s + 1}.jpg`));
}
console.log("done", usable.length, "sheets", Math.ceil(usable.length / 20));
