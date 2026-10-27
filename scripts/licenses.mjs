import fs from "node:fs/promises";
const a = JSON.parse(await fs.readFile("_commons.json", "utf8"));
const idx = process.argv.slice(2).map(Number);

for (const i of idx) {
  const it = a[i];
  const title = it.title.replace(/^File:/, "");
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  u.search = new URLSearchParams({
    action: "query", titles: `File:${title}`, prop: "imageinfo",
    iiprop: "extmetadata|size", format: "json", origin: "*",
  }).toString();
  const res = await fetch(u, { headers: { "User-Agent": "SeraphineMaison/1.0" } });
  const j = await res.json();
  const page = Object.values(j.query.pages)[0];
  const m = page.imageinfo?.[0]?.extmetadata ?? {};
  const strip = (s) => (s ?? "").replace(/<[^>]+>/g, "").trim();
  console.log(`${i}\t${it.title}\n\tlicense: ${strip(m.LicenseShortName?.value)}\n\tartist: ${strip(m.Artist?.value)}\n\tcredit: ${strip(m.Credit?.value).slice(0, 120)}\n\turl: ${m.LicenseUrl?.value ?? ""}\n`);
}
