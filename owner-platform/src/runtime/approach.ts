const explorers = document.querySelectorAll<HTMLElement>(
  "[data-approach-explorer]",
);

for (const explorer of explorers) {
  const tabs = [
    ...explorer.querySelectorAll<HTMLButtonElement>("[data-approach-tab]"),
  ];
  const panels = [
    ...explorer.querySelectorAll<HTMLElement>("[data-approach-preview]"),
  ];
  const image = explorer.querySelector<HTMLImageElement>("[data-approach-image]");
  const imageLink = explorer.querySelector<HTMLAnchorElement>("[data-approach-image-link]");
  const caption = explorer.querySelector<HTMLElement>("[data-approach-image-caption]");

  const select = (index: number, focus = false) => {
    const selected = tabs[index];
    if (image && selected.dataset.approachImageSrc) {
      image.src = selected.dataset.approachImageSrc;
      image.alt = selected.dataset.approachImageAlt || selected.textContent || "";
      if (imageLink) imageLink.href = image.src;
      if (caption) caption.textContent = `${selected.textContent} — ${panels[index].querySelector("h3")?.textContent || ""}`;
    }
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[tabIndex].hidden = !active;
      panels[tabIndex].classList.toggle("is-active", active);
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown")
        next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
        next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(next, true);
    });
  });

  const openCardImage = (stage: string | undefined) => {
    if (stage === "together") {
      const overviewImage = document.querySelector<HTMLImageElement>("#approach-governance-diagram");
      const overviewLink = overviewImage?.closest<HTMLAnchorElement>("a");
      if (overviewImage) {
        overviewImage.src = "/site-assets/revision/approach/Axotol.svg";
        overviewImage.alt = "RSMS Pattern Transformation: from BAU fragility to scale-ready stability, illustrated with an axolotl mascot.";
        if (overviewLink) overviewLink.href = overviewImage.src;
        overviewImage.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    const index = tabs.findIndex((tab) => tab.dataset.approachTab === stage);
    if (index < 0) return;
    select(index);
    panels[index].scrollIntoView({ behavior: "smooth", block: "start" });
  };

  document.querySelectorAll<HTMLElement>("[data-approach-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest("a, button, input, select, textarea")) return;
      openCardImage(card.dataset.approachCard);
    });
    card.addEventListener("keydown", (event) => {
      if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      openCardImage(card.dataset.approachCard);
    });
  });

  document.querySelectorAll<HTMLAnchorElement>("[data-approach-card-image]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openCardImage(link.dataset.approachCardImage);
    });
  });
}
