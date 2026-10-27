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
await page.evaluate(() => window.scrollTo(0, 0));

const result = await page.evaluate(() => {
  const vw = window.innerWidth;
  const offenders = [];
  document.querySelectorAll("*").forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    if (cs.position === "fixed") return;
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1 && cs.overflowX === "visible") {
      offenders.push({
        tag: el.tagName,
        cls: el.className && String(el.className).slice(0, 80),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        overflowX: cs.overflowX,
      });
    }
  });
  return {
    innerWidth: vw,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    offenders: offenders.slice(0, 30),
  };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
