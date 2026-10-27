import { chromium } from "playwright-core";

const width = Number(process.argv[2] ?? 390);
const height = Number(process.argv[3] ?? 844);
const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--disable-gpu", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width, height } });
await page.goto("http://localhost:4173/?qa=" + Date.now(), { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

const result = await page.evaluate(() => {
  const base = document.documentElement.scrollWidth;
  const rows = [];
  for (const el of [...document.body.children]) {
    const prev = el.style.display;
    el.style.display = "none";
    const after = document.documentElement.scrollWidth;
    el.style.display = prev;
    rows.push({
      tag: el.tagName,
      cls: String(el.className).slice(0, 60),
      base,
      after,
      delta: base - after,
    });
  }

  const all = [...document.querySelectorAll("*")]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        cls: String(el.className).slice(0, 60),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        pos: getComputedStyle(el).position,
      };
    })
    .filter((x) => x.right > window.innerWidth + 1 && x.left < window.innerWidth + 900)
    .sort((a, b) => b.right - a.right)
    .slice(0, 25);

  return { base, rows, all };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
