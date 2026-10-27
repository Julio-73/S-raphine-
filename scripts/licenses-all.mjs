import fs from "node:fs/promises";
const a = JSON.parse(await fs.readFile("_commons.json", "utf8"));
const idx = [27,28,30,36,37,38,39,40,41,46,49,50,52,54,55,75,82,84,86,87,92,97,100,103];
const titles = idx.map((i) => a[i].title).join("|");
const u = new URL("https://commons.wikimedia.org/w/api.php");
u.search = new URLSearchParams({ action: "query", titles, prop: "imageinfo", iiprop: "extmetadata|size", format: "json", origin: "*" }).toString();
const res = await fetch(u, { headers: { "User-Agent": "SeraphineMaison/1.0 (contact: demo@example.com)" } });
const j = await res.json();
const strip = (s) => (s ?? "").replace(/<[^>]+>/g, "").trim();
for (const p of Object.values(j.query.pages)) {
  const m = p.imageinfo?.[0]?.extmetadata ?? {};
  console.log(`${p.title}\n\t${strip(m.LicenseShortName?.value)} | ${strip(m.Artist?.value)} | ${m.LicenseUrl?.value ?? ""}\n`);
}
