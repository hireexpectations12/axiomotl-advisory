export function initialiseScrollStory(root: Element) {
  const page = root.querySelector<HTMLElement>("main.detail-page");
  if (!page || page.querySelector(".story-stack")) return;
  if (
    typeof ResizeObserver === "undefined" ||
    typeof CSS === "undefined" ||
    !CSS.supports("position", "sticky")
  )
    return;
  const chapters = [
    ...page.querySelectorAll<HTMLElement>(":scope > section:not(.page-hero)"),
  ];
  if (!chapters.length) return;
  const stack = document.createElement("div");
  stack.className = "story-stack";
  stack.setAttribute("data-story-enhanced", "true");
  const backdrop = document.createElement("div");
  backdrop.className = "story-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.textContent =
    page
      .querySelector(".svc-breadcrumb")
      ?.textContent?.split("/")
      .pop()
      ?.trim() || "Our approach";
  const artwork = page.querySelector<HTMLImageElement>(".page-hero-art img");
  if (artwork && !page.querySelector(".page-hero-approach"))
    backdrop.style.backgroundImage = `linear-gradient(90deg, rgba(49,22,83,.94), rgba(49,22,83,.65)), url("${artwork.src}")`;
  chapters[0].before(stack);
  stack.append(backdrop);
  const panels = chapters.map((chapter, index) => {
    const panel = document.createElement("div");
    panel.className = "story-panel";
    panel.style.zIndex = String(index + 1);
    panel.append(chapter);
    stack.append(panel);
    return panel;
  });
  // Tall panels scroll fully into view before they hold for the next panel.
  const measure = () => {
    for (const panel of panels) {
      const maximumTop = innerWidth <= 700 ? 84 : 190;
      panel.style.setProperty(
        "--panel-top",
        `${Math.min(maximumTop, innerHeight - panel.offsetHeight - 24)}px`,
      );
    }
  };
  const observer = new ResizeObserver(measure);
  panels.forEach((panel) => observer.observe(panel));
  window.addEventListener("resize", measure);
  const restorePanelOrder = () =>
    panels.forEach((panel, index) => {
      panel.style.zIndex = String(index + 1);
    });
  // A keyboard user must never focus a link underneath a later panel.
  const focus = (event: FocusEvent) => {
    if (
      !(event.target instanceof HTMLElement) ||
      !event.target.matches(":focus-visible")
    )
      return;
    const target = event.target;
    const panel = target.closest<HTMLElement>(".story-panel");
    if (!panel) return;
    restorePanelOrder();
    panel.style.zIndex = String(panels.length + 1);
    requestAnimationFrame(() => {
      const bounds = target.getBoundingClientRect();
      const visibleTop = (innerWidth <= 700 ? 84 : 190) + 12;
      const visibleBottom = innerHeight - 24;
      if (bounds.top < visibleTop)
        window.scrollBy({ top: bounds.top - visibleTop, behavior: "instant" });
      else if (bounds.bottom > visibleBottom)
        window.scrollBy({
          top: bounds.bottom - visibleBottom,
          behavior: "instant",
        });
    });
  };
  const blur = () =>
    requestAnimationFrame(() => {
      if (!stack.contains(document.activeElement)) restorePanelOrder();
    });
  stack.addEventListener("focusin", focus);
  stack.addEventListener("focusout", blur);
  measure();
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) return;
    observer.disconnect();
    window.removeEventListener("resize", measure);
    stack.removeEventListener("focusin", focus);
    stack.removeEventListener("focusout", blur);
  });
}
