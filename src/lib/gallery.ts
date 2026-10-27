const pad = (value: number) => String(value).padStart(2, "0");

export function initGallery(): void {
  const gallery = document.querySelector<HTMLElement>("[data-gallery]");
  if (!gallery) return;

  const track = gallery.querySelector<HTMLElement>(".gallery__track");
  const slides = Array.from(gallery.querySelectorAll<HTMLElement>(".look"));
  const progress = document.querySelector<HTMLElement>("[data-gallery-progress]");
  const count = document.querySelector<HTMLElement>("[data-gallery-count]");
  const prev = document.querySelector<HTMLButtonElement>("[data-gallery-prev]");
  const next = document.querySelector<HTMLButtonElement>("[data-gallery-next]");

  if (!slides.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setProgress = () => {
    const max = gallery.scrollWidth - gallery.clientWidth;
    const ratio = max > 0 ? gallery.scrollLeft / max : 0;

    if (progress) {
      const first = slides[0].getBoundingClientRect().width;
      const visible = Math.min(1, gallery.clientWidth / (first * 1.12));
      const thumb = Math.max(0.12, visible / slides.length);
      progress.style.transform = `scaleX(${thumb + (1 - thumb) * ratio})`;
    }

    if (count) {
      const galleryRect = gallery.getBoundingClientRect();
      const padLeft = parseFloat(getComputedStyle(gallery).paddingLeft) || 0;
      const anchor = galleryRect.left + padLeft;
      let nearest = 0;
      let distance = Number.POSITIVE_INFINITY;

      slides.forEach((slide, index) => {
        const rect = slide.getBoundingClientRect();
        const delta = Math.abs(rect.left - anchor);
        if (delta < distance) {
          distance = delta;
          nearest = index;
        }
      });

      count.textContent = `${pad(nearest + 1)} — ${pad(slides.length)}`;
    }
  };

  let ticking = false;
  gallery.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setProgress();
        ticking = false;
      });
    },
    { passive: true }
  );

  const step = (direction: number) => {
    const slide = slides[0];
    const gap = parseFloat(getComputedStyle(track!).columnGap || "24") || 24;
    const amount = (slide.getBoundingClientRect().width + gap) * direction;

    gallery.scrollBy({
      left: amount,
      behavior: reduced.matches ? "auto" : "smooth",
    });
  };

  prev?.addEventListener("click", () => step(-1));
  next?.addEventListener("click", () => step(1));

  /* Horizontally off-screen lazy slides never load on their own. */
  const warmGallery = () => {
    slides.forEach((slide) => {
      const img = slide.querySelector<HTMLImageElement>("img");
      if (img && img.loading !== "eager") img.loading = "eager";
    });
  };

  if ("IntersectionObserver" in window) {
    const warmer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        warmGallery();
        warmer.disconnect();
      },
      { rootMargin: "600px 0px" }
    );
    warmer.observe(gallery);
  } else {
    warmGallery();
  }

  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  });

  /* Pointer drag for mouse users; touch keeps native momentum. */
  let dragging = false;
  let startX = 0;
  let startLeft = 0;

  gallery.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") return;
    dragging = true;
    startX = event.clientX;
    startLeft = gallery.scrollLeft;
    gallery.classList.add("is-dragging");
    gallery.setPointerCapture(event.pointerId);
  });

  gallery.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    gallery.scrollLeft = startLeft - delta;
  });

  const endDrag = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    gallery.classList.remove("is-dragging");
    if (gallery.hasPointerCapture(event.pointerId)) {
      gallery.releasePointerCapture(event.pointerId);
    }
  };

  gallery.addEventListener("pointerup", endDrag);
  gallery.addEventListener("pointercancel", endDrag);
  gallery.addEventListener("pointerleave", endDrag);

  window.addEventListener("resize", setProgress, { passive: true });
  setProgress();
}
