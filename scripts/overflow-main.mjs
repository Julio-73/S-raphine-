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

  const test = (parent) =>
    [...parent.children].map((el) => {
      const prev = el.style.display;
      el.style.display = "none";
      const after = document.documentElement.scrollWidth;
      el.style.display = prev;
      return {
        tag: el.tagName,
        cls: String(el.className).slice(0, 60),
        id: el.id,
        after,
        delta: base - after,
      };
    });

  const main = document.querySelector("main");
  const sections = test(main);

  const worst = sections
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta)[0];

  let within = [];
  if (worst) {
    const el = [...main.children].find(
      (child) => String(child.className).slice(0, 60) === worst.cls && child.tagName === worst.tag
    );
    if (el) {
      within = [...el.querySelectorAll("*")]
        .map((node) => {
          const prev = node.style.display;
          node.style.display = "none";
          const after = document.documentElement.scrollWidth;
          node.style.display = prev;
          return {
            tag: node.tagName,
            cls: String(node.className).slice(0, 60),
            after,
            delta: base - after,
          };
        })
        .filter((r) => r.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 12);
    }
  }

  return { base, sections, within };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
