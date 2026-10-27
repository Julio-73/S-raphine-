export function initJournal(): void {
  const articles = Array.from(
    document.querySelectorAll<HTMLElement>("[data-article]")
  );
  const previews = Array.from(
    document.querySelectorAll<HTMLElement>(".journal__img")
  );
  if (!articles.length || !previews.length) return;

  const activate = (index: number) => {
    articles.forEach((article, i) =>
      article.classList.toggle("is-active", i === index)
    );
    previews.forEach((preview, i) =>
      preview.classList.toggle("is-active", i === index)
    );
  };

  articles.forEach((article, index) => {
    article.addEventListener("pointerenter", () => activate(index));
    article.addEventListener("focus", () => activate(index));
  });

  activate(0);
}
