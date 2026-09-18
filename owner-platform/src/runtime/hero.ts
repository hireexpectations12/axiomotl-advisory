type Tween = {
  pause(): Tween;
  play(): Tween;
  reverse(): Tween;
  progress(value: number): Tween;
  kill(): void;
};
type Media = {
  add(query: string, callback: () => (() => void) | void, scope: Element): void;
  revert(): void;
};
type Gsap = {
  to(target: object, vars: Record<string, unknown>): Tween;
  set(target: object, vars: Record<string, unknown>): void;
  matchMedia(): Media;
};
const stages = [
  [
    "Analyse",
    "See the whole picture. Map the work, connect the evidence and uncover what is getting in the way.",
    "diagnostic",
  ],
  [
    "Design",
    "Shape a better way of working. Connect roles, controls and processes around a clear purpose.",
    "diagnostic",
  ],
  [
    "Decide",
    "Make the next step clear. Weigh the trade-offs, align the right people and give each decision an owner.",
    "decisions",
  ],
  [
    "Transition",
    "Put the change into practice. Prepare the people, handovers and support that make the new way work.",
    "transition",
  ],
  [
    "Sustain",
    "Make progress last. Keep ownership visible, measure what matters and improve as the operation evolves.",
    "embedded",
  ],
];

export function initialiseHero() {
  const hero = document.querySelector<HTMLElement>("[data-interactive-hero]");
  if (!hero) return;
  const buttons = [...hero.querySelectorAll<HTMLElement>("[data-stage]")];
  const heading = hero.querySelector<HTMLElement>("[data-stage-heading]")!;
  const description = hero.querySelector<HTMLElement>(
    "[data-stage-description]",
  )!;
  const link = hero.querySelector<HTMLAnchorElement>("[data-stage-link]")!;
  let selected = 0;

  function select(index: number) {
    selected = index;
    if (
      buttons[index].parentElement!.scrollWidth >
      buttons[index].parentElement!.clientWidth
    ) {
      buttons[index].scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "instant",
      });
    }
    if (!heading || !description || !link) return;
    buttons.forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
    const [name, detail, service] = stages[index];
    heading.textContent = `0${index + 1} / ${name}`;
    description.textContent = detail;
    link.href = `#${service}`;
    link.dataset.journeyAnswer = service;
    hero!.dataset.detailOpen = "true";
  }
  function dismiss() {
    delete hero!.dataset.detailOpen;
    buttons[selected].focus();
  }
  hero.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && hero.dataset.detailOpen) dismiss();
  });
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(index));
    button.addEventListener("keydown", (event) => {
      const next =
        event.key === "ArrowRight"
          ? (index + 1) % 5
          : event.key === "ArrowLeft"
            ? (index + 4) % 5
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? 4
                : -1;
      if (next < 0) return;
      event.preventDefault();
      buttons[next].focus();
      select(next);
    });
  });

  const gsap = (window as unknown as { gsap?: Gsap }).gsap;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  let signals: Tween[] = [];
  let hoverStates: (() => void)[] = [];
  const canMove = () =>
    visible &&
    !document.hidden &&
    !reduced.matches &&
    document.documentElement.dataset.motion !== "off";
  function syncMotion() {
    const moving = canMove();
    hero!.dataset.heroPaused = String(!moving);
    signals.forEach((tween) => (moving ? tween.play() : tween.pause()));
    hoverStates.forEach((sync) => sync());
  }
  if (!gsap) {
    hero.dataset.heroPaused = "true";
    return;
  }
  hero.dataset.animation = "gsap";
  const media = gsap.matchMedia();
  media.add(
    "(prefers-reduced-motion: no-preference)",
    () => {
      const path = hero.querySelector<SVGPathElement>(
        "#reference-signal-path",
      )!;
      const length = path.getTotalLength();
      const events = new AbortController();
      signals = [
        ...hero.querySelectorAll<SVGCircleElement>("[data-signal]"),
      ].map((dot, index) => {
        const progress = { value: index / 3 };
        gsap.set(dot, { opacity: 0.85 });
        return gsap.to(progress, {
          value: index / 3 + 1,
          duration: 7,
          repeat: -1,
          ease: "none",
          onUpdate: () => {
            const point = path.getPointAtLength((progress.value % 1) * length);
            gsap.set(dot, { x: point.x, y: point.y });
          },
        });
      });
      hero
        .querySelectorAll<SVGPathElement>("[data-arc]")
        .forEach((arc, index) => {
          signals.push(
            gsap.to(arc, {
              strokeDashoffset: -1625,
              duration: 10 + index * 3,
              repeat: -1,
              ease: "none",
            }),
          );
        });
      hero
        .querySelectorAll<HTMLElement>(".hero-glow")
        .forEach((glow, index) => {
          signals.push(
            gsap.to(glow, {
              x: index ? -24 : 24,
              y: index ? 14 : -14,
              scale: 1.12,
              opacity: 0.85,
              duration: 6 + index * 2,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            }),
          );
        });
      const workflowPath = hero.querySelector<SVGPathElement>("#workflow-path");
      if (workflowPath) {
        const distance = workflowPath.getTotalLength();
        hero
          .querySelectorAll<SVGCircleElement>("[data-workflow-dot]")
          .forEach((dot, index) => {
            const progress = { value: index / 3 };
            signals.push(
              gsap.to(progress, {
                value: index / 3 + 1,
                duration: 9,
                repeat: -1,
                ease: "none",
                onUpdate: () => {
                  const point = workflowPath.getPointAtLength(
                    (progress.value % 1) * distance,
                  );
                  gsap.set(dot, { x: point.x, y: point.y });
                },
              }),
            );
          });
      }
      const title = hero.querySelector("h1");
      if (title) {
        gsap.set(title, { y: 10, opacity: 0.7 });
        signals.push(
          gsap.to(title, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            clearProps: "transform,opacity",
          }),
        );
      }
      hero.querySelectorAll<HTMLElement>("[data-count]").forEach((element) => {
        const final = Number(element.dataset.count);
        const count = { value: 0 };
        signals.push(
          gsap.to(count, {
            value: final,
            duration: 0.6,
            ease: "power2.out",
            onUpdate: () => {
              element.textContent = `${element.dataset.countPrefix || ""}${Math.round(count.value)}${element.dataset.countSuffix || ""}`;
            },
          }),
        );
      });
      const pathway = hero.querySelector<SVGElement>(".workflow-trails");
      const pointer = { x: 0, y: 0 };
      if (pathway) {
        hero.addEventListener(
          "pointermove",
          (event) => {
            if (!canMove() || event.pointerType === "touch") return;
            const bounds = hero.getBoundingClientRect();
            pointer.x =
              ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
            pointer.y =
              ((event.clientY - bounds.top) / bounds.height - 0.5) * 6;
            gsap.set(pathway, { x: pointer.x, y: pointer.y });
          },
          { signal: events.signal },
        );
        hero.addEventListener(
          "pointerleave",
          () => gsap.set(pathway, { x: 0, y: 0 }),
          { signal: events.signal },
        );
      }
      buttons.forEach((button) => {
        const hover = gsap.to(button, {
          "--tile-brightness": 1.22,
          duration: 0.3,
          ease: "power2.out",
          paused: true,
        });
        let inside = false;
        let focused = false;
        const fine = matchMedia("(hover: hover) and (pointer: fine)");
        const syncHover = () => {
          if (!canMove()) hover.pause().progress(0);
          else if (inside || focused) hover.play();
          else hover.reverse();
        };
        hoverStates.push(syncHover);
        button.addEventListener(
          "pointerenter",
          (event) => {
            inside = fine.matches && event.pointerType !== "touch";
            syncHover();
          },
          { signal: events.signal },
        );
        for (const type of ["pointerleave", "pointercancel"])
          button.addEventListener(
            type,
            () => {
              inside = false;
              syncHover();
            },
            { signal: events.signal },
          );
        button.addEventListener(
          "focus",
          () => {
            focused = true;
            syncHover();
          },
          { signal: events.signal },
        );
        button.addEventListener(
          "blur",
          () => {
            focused = false;
            syncHover();
          },
          { signal: events.signal },
        );
      });
      syncMotion();
      return () => {
        events.abort();
        hoverStates = [];

        hero
          .querySelectorAll<HTMLElement>("[data-count]")
          .forEach((element) => {
            element.textContent = `${element.dataset.countPrefix || ""}${element.dataset.count}${element.dataset.countSuffix || ""}`;
          });
        if (pathway) gsap.set(pathway, { clearProps: "transform" });
        signals = [];
      };
    },
    hero,
  );
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncMotion();
  });
  intersection.observe(hero);
  const observer = new MutationObserver(syncMotion);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  reduced.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);
  window.addEventListener("pagehide", (event) => {
    signals.forEach((tween) => tween.pause());
    if (event.persisted) return;
    media.revert();
    intersection.disconnect();
    observer.disconnect();
    reduced.removeEventListener("change", syncMotion);
    document.removeEventListener("visibilitychange", syncMotion);
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) syncMotion();
  });
  syncMotion();
}
