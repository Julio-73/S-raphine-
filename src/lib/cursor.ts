export function initCursor(): void {
  const fine = window.matchMedia("(pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduced || window.innerWidth < 1024) return;

  const root = document.createElement("div");
  root.className = "cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML =
    '<span class="cursor__dot"></span><span class="cursor__ring"><span class="cursor__label"></span></span>';
  document.body.appendChild(root);
  document.body.classList.add("has-cursor");

  const ring = root.querySelector<HTMLElement>(".cursor__ring")!;
  const label = root.querySelector<HTMLElement>(".cursor__label")!;

  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const follow = { x: pointer.x, y: pointer.y };
  let visible = false;

  const setVisible = (value: boolean) => {
    visible = value;
    root.classList.toggle("is-hidden", !value);
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      const target = event.target as HTMLElement | null;
      const overField = Boolean(
        target?.closest("input, textarea, select, [data-cursor-hide]")
      );
      setVisible(!overField);

      const holder = target?.closest<HTMLElement>("[data-cursor]");
      if (holder) {
        root.classList.add("is-view");
        label.textContent = holder.dataset.cursor ?? "Ver";
      } else {
        root.classList.remove("is-view");
      }
    },
    { passive: true }
  );

  document.addEventListener("pointerdown", () =>
    root.classList.add("is-down")
  );
  document.addEventListener("pointerup", () =>
    root.classList.remove("is-down")
  );
  document.documentElement.addEventListener("pointerleave", () =>
    setVisible(false)
  );
  document.documentElement.addEventListener("pointerenter", () =>
    setVisible(true)
  );
  window.addEventListener("blur", () => setVisible(false));

  const loop = () => {
    follow.x += (pointer.x - follow.x) * 0.16;
    follow.y += (pointer.y - follow.y) * 0.16;

    root.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    ring.style.translate = `${follow.x - pointer.x}px ${follow.y - pointer.y}px`;

    if (!visible && !root.classList.contains("is-hidden")) {
      root.classList.add("is-hidden");
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}
