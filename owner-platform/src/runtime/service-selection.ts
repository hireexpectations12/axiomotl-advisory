/** Let tall mobile cards finish scrolling before the next card covers them. */
export function initialiseMobileCardStack() {
  const cards = document.querySelectorAll<HTMLElement>(".scroll-stack-page > .scroll-stack-card");
  if (!cards.length || !("ResizeObserver" in window)) return;
  function measure() {
    cards.forEach((card) => {
      card.style.setProperty("--stack-card-height", `${card.offsetHeight}px`);
      card.classList.toggle("stack-card-tall", card.offsetHeight > innerHeight - 112);
    });
  }
  const observer = new ResizeObserver(measure);
  cards.forEach((card) => observer.observe(card));
  window.addEventListener("resize", measure);
  measure();
}

/** Keep the hero and one selected service visible, including on deep links. */
export function initialiseServiceSelection() {
  const page = document.querySelector<HTMLElement>("[data-service-selector]");
  if (!page) return;
  const panels = [
    ...page.querySelectorAll<HTMLElement>("[data-service-panel]"),
  ];
  const links = [
    ...page.querySelectorAll<HTMLAnchorElement>(".svc-index a[href]"),
  ];
  if (!panels.length) return;

  function selectFromHash() {
    const selected =
      panels.find((panel) => `#${panel.id}` === location.hash) || panels[0];
    panels.forEach((panel) => {
      panel.hidden = panel !== selected;
    });
    links.forEach((link) => {
      if (link.hash === `#${selected.id}`)
        link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }
  selectFromHash();
  window.addEventListener("hashchange", selectFromHash);
  links.forEach((link) =>
    link.addEventListener("click", (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      const selected = panels.find((panel) => `#${panel.id}` === link.hash);
      if (!selected) return;
      event.preventDefault();
      if (location.hash !== link.hash) history.pushState(null, "", link.hash);
      selectFromHash();
      selected.focus({ preventScroll: true });
      selected.scrollIntoView({ behavior: "instant", block: "start" });
    }),
  );
  window.addEventListener("popstate", selectFromHash);
}

/** Reveal whole industry cards upwards once, respecting both motion controls. */
export function initialiseIndustryCards() {
  const cards = document.querySelectorAll<HTMLElement>("[data-industry-card]");
  if (!cards.length || !("IntersectionObserver" in window)) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  let observer: IntersectionObserver | undefined;
  function refresh() {
    observer?.disconnect();
    cards.forEach((card) => card.classList.remove("industry-pending"));
    if (reduced.matches || root.dataset.motion === "off") return;
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("industry-pending");
          observer?.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    cards.forEach((card) => {
      if (card.getBoundingClientRect().top < innerHeight) return;
      card.classList.add("industry-pending");
      observer!.observe(card);
    });
  }
  refresh();
  reduced.addEventListener("change", refresh);
  new MutationObserver(refresh).observe(root, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
}
