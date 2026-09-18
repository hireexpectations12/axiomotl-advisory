type MotionTween = {
  play(): void;
  reverse(): void;
  progress(value: number): MotionTween;
  pause(): void;
};
type MotionMedia = {
  add(query: string, setup: () => () => void): void;
  revert(): void;
};
type MotionGsap = {
  matchMedia(): MotionMedia;
  to(target: Element, vars: Record<string, unknown>): MotionTween;
  fromTo(
    target: Element,
    from: Record<string, unknown>,
    to: Record<string, unknown>,
  ): MotionTween;
};

/** Small feedback cues for the combined public page; native controls own behaviour. */
export function initialisePageMotion() {
  const gsap = (window as unknown as { gsap?: MotionGsap }).gsap;
  if (!gsap || !document.querySelector(".analysis-examples")) return;
  const root = document.documentElement;
  let media: MotionMedia | undefined;
  function refresh() {
    media?.revert();
    media = undefined;
    if (document.hidden || root.dataset.motion === "off") return;
    media = gsap!.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const events = new AbortController();
      const fine = matchMedia("(hover: hover) and (pointer: fine)");
      document
        .querySelectorAll<HTMLElement>(
          ".finder-choices > a, .analysis-image, .governance-visual > a",
        )
        .forEach((control) => {
          const cue = control.querySelector("span:last-child");
          if (!cue) return;
          const diagonal =
            control.parentElement?.classList.contains("finder-choices");
          const tween = gsap!.to(cue, {
            x: 4,
            y: diagonal ? -3 : 0,
            duration: 0.18,
            ease: "power2.out",
            paused: true,
          });
          let inside = false;
          let focused = false;
          const sync = () =>
            inside || focused ? tween.play() : tween.reverse();
          control.addEventListener(
            "pointerenter",
            (event) => {
              inside = fine.matches && event.pointerType !== "touch";
              sync();
            },
            { signal: events.signal },
          );
          for (const type of ["pointerleave", "pointercancel"])
            control.addEventListener(
              type,
              () => {
                inside = false;
                sync();
              },
              { signal: events.signal },
            );
          control.addEventListener(
            "focus",
            () => {
              focused = true;
              sync();
            },
            { signal: events.signal },
          );
          control.addEventListener(
            "blur",
            () => {
              focused = false;
              sync();
            },
            { signal: events.signal },
          );
        });
      document
        .querySelectorAll<HTMLDetailsElement>(
          ".service-card details, .reading-details",
        )
        .forEach((details) => {
          const content = details.querySelector(
            ".service-detail, .reading-content",
          );
          if (!content) return;
          const reveal = gsap!.fromTo(
            content,
            { y: 6, opacity: 0.7 },
            {
              y: 0,
              opacity: 1,
              duration: 0.22,
              ease: "power2.out",
              paused: true,
              immediateRender: false,
              clearProps: "transform,opacity",
            },
          );
          details.addEventListener(
            "toggle",
            () => {
              if (details.open) {
                reveal.progress(0);
                reveal.play();
              } else {
                reveal.progress(1).pause();
              }
            },
            { signal: events.signal },
          );
        });
      return () => events.abort();
    });
  }
  const observer = new MutationObserver(refresh);
  observer.observe(root, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("pagehide", (event) => {
    media?.revert();
    if (!event.persisted) {
      observer.disconnect();
      document.removeEventListener("visibilitychange", refresh);
    }
  });
  window.addEventListener("pageshow", refresh);
  refresh();
}
