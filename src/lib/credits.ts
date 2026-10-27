import { startScroll, stopScroll } from "./smooth";

export function initCredits(): void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-credits]");
  const openers = document.querySelectorAll<HTMLButtonElement>("[data-credits-open]");
  const close = document.querySelector<HTMLButtonElement>("[data-credits-close]");

  if (!dialog || !openers.length) return;

  const open = () => {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    stopScroll();
  };

  const shut = () => {
    dialog.close();
    startScroll();
  };

  openers.forEach((button) => button.addEventListener("click", open));
  close?.addEventListener("click", shut);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) shut();
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    shut();
  });

  dialog.addEventListener("close", startScroll);
}
