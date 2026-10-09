export function initialiseWorkflow(root: Element) {
  const image = root.querySelector<HTMLImageElement>("[data-workflow-image]");
  const link = root.querySelector<HTMLAnchorElement>("[data-workflow-full]");
  const status = root.querySelector<HTMLElement>("[data-workflow-status]");
  const cards = [
    ...root.querySelectorAll<HTMLButtonElement>("[data-workflow-stage]"),
  ];
  if (!image || !link || !status || !cards.length) return;
  const preview = image.closest<HTMLElement>("figure") || link;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const motionEnabled = () =>
    !reduced.matches && document.documentElement.dataset.motion !== "off";
  let fade: Animation | undefined;
  let selection = 0;
  let displayedCard = cards.find(
    (card) => card.getAttribute("aria-pressed") === "true",
  );
  for (const card of cards) {
    card.addEventListener("click", async () => {
      const request = ++selection;
      fade?.cancel();
      const stage = card.dataset.workflowStage!;
      const source = card.dataset.workflowSrc!;
      cards.forEach((button) =>
        button.setAttribute("aria-pressed", String(button === card)),
      );
      status.textContent = `Loading ${stage} diagram…`;
      image.setAttribute("aria-busy", "true");
      const next = new Image();
      next.src = source;
      try {
        await next.decode();
        if (request !== selection) return;
        if (motionEnabled()) {
          fade = preview.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 140,
            fill: "forwards",
            easing: "ease-out",
          });
          await fade.finished.catch(() => {});
          if (request !== selection) return;
        }
        image.src = source;
        displayedCard = card;
        image.alt = card.dataset.workflowAlt!;
        link.href = source;
        link.setAttribute("aria-label", `Open ${stage} diagram in full size`);
        status.textContent = `${stage} — ${card.dataset.workflowDescription}`;
        fade?.cancel();
        if (motionEnabled()) {
          fade = preview.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 260,
            easing: "ease-out",
          });
        }
      } catch {
        if (request !== selection) return;
        cards.forEach((button) =>
          button.setAttribute("aria-pressed", String(button === displayedCard)),
        );
        status.textContent = `${stage} diagram could not load. Select the card to retry.`;
      } finally {
        if (request === selection) image.removeAttribute("aria-busy");
      }
    });
  }
  const settle = () => {
    if (!motionEnabled() || document.hidden) fade?.finish();
  };
  const observer = new MutationObserver(settle);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  reduced.addEventListener("change", settle);
  document.addEventListener("visibilitychange", settle);
  window.addEventListener("pagehide", (event) => {
    fade?.cancel();
    if (!event.persisted) {
      observer.disconnect();
      reduced.removeEventListener("change", settle);
      document.removeEventListener("visibilitychange", settle);
    }
  });
}
