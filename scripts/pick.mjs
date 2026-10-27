import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const a = JSON.parse(await fs.readFile("_commons.json", "utf8"));
const picks = [27, 28, 30, 36, 41, 46, 49, 50, 52, 54, 55, 82, 86, 87, 92, 100];
const OUT = path.resolve("_picks");
await fs.mkdir(OUT, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const thumbUrl = (full, width) => {
  const u = new URL(full.split("?")[0]);
  const parts = u.pathname.split("/");
  const file = parts.pop();
  const hash2 = parts.pop(), hash1 = parts.pop();
  parts.push("thumb", hash1, hash2, file, `${width}px-${file}`);
  return "https://thumb.wikimedia.org" + parts.join("/");
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const meta = [];

for (const i of picks) {
  const it = a[i];
  const file = path.join(OUT, `${i}.jpg`);
  try { await fs.access(file); } catch {
    let ok = false;
    for (const width of [1920, 1280, 960]) {
      let res;
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch(thumbUrl(it.full, width), {
          headers: { "User-Agent": UA, Referer: "https://commons.wikimedia.org/", Accept: "image/avif,image/webp,image/jpeg,*/*" },
          signal: AbortSignal.timeout(120000),
        });
        if (res.status === 429) { await sleep(15000 * (attempt + 1)); continue; }
        break;
      }
      if (!res || !res.ok) { console.log("fail", i, width, res?.status); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      try {
        await sharp(buf).jpeg({ quality: 92 }).toFile(file);
        console.log("ok", i, width, Math.round(buf.length / 1024) + "KB");
        ok = true;
        break;
      } catch { console.log("sharp fail", i, width); }
    }
    if (!ok) console.log("MISSING", i);
    await sleep(1200);
  }
  try {
    const m = await sharp(file).metadata();
    meta.push({ i, w: m.width, h: m.height });
    console.log("dim", i, m.width, m.height);
  } catch { console.log("missing", i); }
}

const COLS = 4, CW = 400, CH = 520, PAD = 10, LABEL = 26;
const composites = [];
for (let n = 0; n < meta.length; n++) {
  const it = a[meta[n].i];
  const thumb = await sharp(path.join(OUT, `${meta[n].i}.jpg`)).resize(CW, CH, { fit: "contain", background: "#e8e4dc" }).toBuffer();
  const left = PAD + (n % COLS) * (CW + PAD);
  const top = PAD + Math.floor(n / COLS) * (CH + LABEL + PAD);
  composites.push({ input: thumb, left, top: top + LABEL });
  composites.push({
    input: Buffer.from(`<svg width="${CW}" height="${LABEL}"><rect width="100%" height="100%" fill="#111"/><text x="5" y="18" font-family="Arial" font-size="13" fill="#fff">${meta[n].i} — ${it.title.slice(5, 45)}</text></svg>`),
    left, top,
  });
}
if (composites.length) {
  await sharp({ create: { width: COLS * (CW + PAD) + PAD, height: Math.ceil(meta.length / COLS) * (CH + LABEL + PAD) + PAD, channels: 3, background: "#e8e4dc" } })
    .composite(composites).jpeg({ quality: 85 }).toFile("_picks-sheet.jpg");
}
