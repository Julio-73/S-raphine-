/* Reveal, split-text and parallax orchestration. */

const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function splitLines(): void {
  const targets = document.querySelectorAll<HTMLElement>("[data-split]");

  targets.forEach((target) => {
    const lines = target.querySelectorAll<HTMLElement>(".line");

    lines.forEach((line, index) => {
      if (line.querySelector(":scope > .line__inner")) return;

      const inner = document.createElement("span");
      inner.className = "line__inner";
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
      line.style.setProperty("--line-i", String(index));
    });

    target.classList.add("is-prepared");
  });
}

function observeReveals(): void {
  const items = Array.from(
    document.querySelectorAll<HTMLElement>("[data-reveal], [data-split]")
  );

  items.forEach((item) => {
    const delay = Number(item.dataset.delay ?? 0);
    if (delay) item.style.setProperty("--reveal-delay", String(delay * 130));
  });

  const reveal = (item: HTMLElement) => item.classList.add("is-inview");

  /* Position sweep — guarantees reveals even if observers stall. */
  let pending = items.slice();

  const sweep = (threshold = -60) => {
    const viewport = window.innerHeight;
    pending = pending.filter((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < viewport - threshold && rect.bottom > threshold) {
        reveal(item);
        return false;
      }
      return true;
    });

    if (!pending.length && sweepTimer) {
      window.clearInterval(sweepTimer);
      sweepTimer = 0;
    }
  };

  let sweepTimer = window.setInterval(sweep, 1100);
  if (!pending.length) {
    window.clearInterval(sweepTimer);
    sweepTimer = 0;
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      sweep();
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  /* Everything already on screen reveals immediately. */
  sweep(0);

  window.addEventListener("load", () => sweep(0), { once: true });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
          pending = pending.filter((item) => item !== entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    pending.forEach((item) => observer.observe(item));
  } else {
    items.forEach((item) => reveal(item));
  }
}

function initParallax(): void {
  if (prefersReduced() || window.innerWidth <= 900) return;

  const rails = Array.from(
    document.querySelectorAll<HTMLElement>("[data-parallax]")
  );
  if (!rails.length) return;

  let ticking = false;

  const update = () => {
    const viewport = window.innerHeight;

    rails.forEach((rail) => {
      const rect = rail.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > viewport + 100) return;

      const progress =
        (rect.top + rect.height / 2 - viewport / 2) / viewport;
      const shift = Math.max(-1, Math.min(1, progress)) * -5.5;
      rail.style.transform = `translate3d(0, ${shift.toFixed(2)}%, 0)`;
    });

    ticking = false;
  };

  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request, { passive: true });
  request();
}

export function initMotion(): void {
  if (!prefersReduced()) splitLines();
  observeReveals();
  initParallax();
}
