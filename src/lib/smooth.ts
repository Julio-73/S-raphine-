import Lenis from "lenis";

let lenis: Lenis | null = null;

/**
 * Smooth scrolling is a progressive enhancement: it only runs on precise
 * pointers and when the visitor has not asked for reduced motion.
 */
export function initSmoothScroll(): Lenis | null {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (reduce || !fine) return null;

  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.5,
  });

  const raf = (time: number) => {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  document.documentElement.classList.add("lenis");
  return lenis;
}

export function getLenis(): Lenis | null {
  return lenis;
}

export function stopScroll(): void {
  lenis?.stop();
  document.body.classList.add("is-locked");
}

export function startScroll(): void {
  lenis?.start();
  document.body.classList.remove("is-locked");
}

export function scrollToTarget(target: HTMLElement, offset = -72): void {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4 });
    return;
  }
  const top = target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: "smooth" });
}
