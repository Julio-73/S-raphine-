import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const name = process.argv[2] ?? "desktop";
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 900);
const motion = process.argv[5] ?? "reduce";

await mkdir("_shots", { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--disable-gpu", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  reducedMotion: motion === "reduce" ? "reduce" : "no-preference",
});
const page = await context.newPage();
console.log("launched", width, height);
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(`http://localhost:4173/?qa=${Date.now()}`, {
  waitUntil: "networkidle",
});
await page.evaluate(() => document.fonts.ready);

// Load lazy media by walking the page once.
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.75);
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 80));
  }
  await new Promise((r) => setTimeout(r, 300));
});
await page.waitForTimeout(600);

const targets = [
  ["00-hero", "#inicio"],
  ["01-maison", "#maison"],
  ["02-colecciones", "#colecciones"],
  ["03-lookbook", "#lookbook"],
  ["04-campaign", ".campaign"],
  ["05-atelier", "#atelier"],
  ["06-diario", "#diario"],
  ["07-cita", "#cita"],
  ["08-footer", ".site-footer"],
];

const report = { name, viewport: [width, height], sections: [], errors };

for (const [label, selector] of targets) {
  const ok = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const y = window.scrollY;
    const top = el.getBoundingClientRect().top + y;
    window.scrollTo(0, Math.max(0, top - 70));
    return true;
  }, selector);

  if (!ok) continue;
  await page.waitForTimeout(motion === "reduce" ? 350 : 1500);

  const info = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const maxWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth
    );
    const broken = [...el.querySelectorAll("img")]
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute("src"));
    const hidden = [...el.querySelectorAll("[data-reveal], [data-split]")]
      .filter((node) => {
        const cs = getComputedStyle(node);
        return (
          Number(cs.opacity) < 0.5 ||
          (node.dataset.reveal === "clip" &&
            cs.clipPath !== "none" &&
            !node.classList.contains("is-inview"))
        );
      })
      .map((node) => node.className || node.tagName);
    return {
      box: [Math.round(r.width), Math.round(r.height)],
      broken,
      hidden,
      overflowX: maxWidth > window.innerWidth + 1,
    };
  }, selector);

  await page.screenshot({ path: `_shots/${name}-${label}.png` });
  report.sections.push({ label, ...info });
}

console.log(JSON.stringify(report, null, 2));
await browser.close();
