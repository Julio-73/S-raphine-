import { scrollToTarget, startScroll, stopScroll } from "./smooth";

export function initNav(): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-menu]");
  const main = document.querySelector<HTMLElement>("main");
  const footer = document.querySelector<HTMLElement>(".site-footer");
  const progress = document.querySelector<HTMLElement>("[data-progress]");
  const navLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]")
  );

  /* ── Scroll state & reading progress ───────────────────────── */

  let frame = 0;

  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const y = window.scrollY;
      header?.classList.toggle("is-scrolled", y > 48);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, y / max) : 0;
      if (progress) progress.style.transform = `scaleX(${ratio})`;

      frame = 0;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu ───────────────────────────────────────────── */

  let isOpen = false;
  if (menu) menu.inert = true;

  const setOpen = (open: boolean, returnFocus = true) => {
    if (!menu || !toggle || open === isOpen) return;
    isOpen = open;

    document.body.classList.toggle("menu-open", open);
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    menu.inert = !open;

    if (main) main.inert = open;
    if (footer) footer.inert = open;

    if (open) {
      stopScroll();
      const first = menu.querySelector<HTMLAnchorElement>("a");
      window.setTimeout(() => first?.focus({ preventScroll: true }), 520);
    } else {
      startScroll();
      if (returnFocus) toggle.focus({ preventScroll: true });
    }
  };

  toggle?.addEventListener("click", () => setOpen(!isOpen));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) setOpen(false);
  });

  menu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false, false));
  });

  /* ── Anchor navigation ─────────────────────────────────────── */

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;

      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;

      event.preventDefault();

      if (isOpen) setOpen(false, false);

      const offset = -((header?.offsetHeight ?? 72) + 12);

      window.setTimeout(
        () => scrollToTarget(target, offset),
        isOpen ? 0 : 60
      );

      if (history.pushState) history.pushState(null, "", hash);
    });
  });

  /* ── Active section indicator ──────────────────────────────── */

  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      return id ? document.getElementById(id) : null;
    })
    .filter((section): section is HTMLElement => Boolean(section));

  let activeId = "";

  const setActive = (id: string) => {
    if (id === activeId) return;
    activeId = id;

    navLinks.forEach((link) => {
      const match = link.getAttribute("href") === `#${id}`;
      if (match) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const onActiveScroll = () => {
    const marker = window.scrollY + window.innerHeight * 0.42;
    let current = "";

    sections.forEach((section) => {
      const top = section.offsetTop;
      if (marker >= top && marker < top + section.offsetHeight) {
        current = section.id;
      }
    });

    setActive(current);
  };

  window.addEventListener("scroll", onActiveScroll, { passive: true });
  onActiveScroll();
}
