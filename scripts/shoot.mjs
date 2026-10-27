import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const name = process.argv[2] ?? "desktop";
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 900);
const motion = process.argv[5] ?? "reduce";
const path = process.argv[6] ?? "/";

await mkdir("_shots", { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  reducedMotion: motion === "reduce" ? "reduce" : "no-preference",
  isMobile: width < 700,
  hasTouch: width < 700,
});
const page = await context.newPage();
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(`http://localhost:4173${path}?qa=${Date.now()}`, {
  waitUntil: "networkidle",
});
await page.evaluate(() => document.fonts.ready);

// Walk the page so lazy images load and reveals settle.
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.7);
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo(0, document.documentElement.scrollHeight);
  await new Promise((r) => setTimeout(r, 400));
});
await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(motion === "reduce" ? 400 : 1800);

const metrics = await page.evaluate(() => {
  const maxWidth = Math.max(
    document.documentElement.scrollWidth,
    document.body.scrollWidth
  );
  const hidden = [
    ...document.querySelectorAll(
      "[data-reveal], [data-split], .hero__figure"
    ),
  ]
    .filter((el) => {
      const cs = getComputedStyle(el);
      return (
        Number(cs.opacity) < 0.5 ||
        (el.dataset.reveal === "clip" &&
          cs.clipPath !== "none" &&
          !el.classList.contains("is-inview"))
      );
    })
    .map((el) => el.className || el.tagName);
  return {
    viewport: [window.innerWidth, window.innerHeight],
    scrollWidth: maxWidth,
    scrollHeight: document.documentElement.scrollHeight,
    overflowX: maxWidth > window.innerWidth + 1,
    unrevealed: hidden,
    images: [...document.images].map((img) => ({
      src: img.currentSrc.split("/").pop(),
      ok: img.complete && img.naturalWidth > 0,
    })),
  };
});

await page.screenshot({
  path: `_shots/${name}-fold.png`,
  fullPage: false,
});
console.log(JSON.stringify({ name, ...metrics, errors }, null, 2));
await browser.close();
