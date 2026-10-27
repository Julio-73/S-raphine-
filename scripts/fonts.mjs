import fs from "node:fs/promises";
import path from "node:path";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const url = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Jost:ital,wght@0,300..600;1,300..500&display=swap";
const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();

const dir = path.resolve("public/fonts");
await fs.mkdir(dir, { recursive: true });

const blocks = [];
const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([\s\S]*?)\}/g;
let m;
let i = 0;
while ((m = re.exec(css))) {
  const subset = m[1];
  if (!["latin", "latin-ext"].includes(subset)) continue;
  const body = m[2];
  const family = /font-family: '([^']+)'/.exec(body)?.[1];
  const style = /font-style: (\w+)/.exec(body)?.[1];
  const weight = /font-weight: ([\d ]+)/.exec(body)?.[1]?.trim();
  const src = /url\((https:[^)]+)\)/.exec(body)?.[1];
  if (!family || !src) continue;
  const slug = `${family.toLowerCase().replace(/\s+/g, "-")}-${style}-${subset}`;
  const file = `${slug}.woff2`;
  const res = await fetch(src, { headers: { "User-Agent": UA } });
  await fs.writeFile(path.join(dir, file), Buffer.from(await res.arrayBuffer()));
  blocks.push({ family, style, weight, file, subset });
  i++;
  console.log(file, weight);
}

const out = blocks.map((b) => `@font-face {
  font-family: "${b.family}";
  font-style: ${b.style};
  font-weight: ${b.weight};
  font-display: swap;
  src: url("/fonts/${b.file}") format("woff2");
  unicode-range: ${b.subset === "latin" ? "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" : "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"};
}`).join("\n\n");

await fs.writeFile(path.resolve("src/fonts.css"), out);
console.log("fonts.css written", blocks.length);
