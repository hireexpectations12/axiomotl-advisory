import { initialiseWorkflow } from "./workflow";
import { initialiseScrollStory } from "./scroll-story";

export function initialiseClientFinal(email: string) {
  const root = document.querySelector("[data-client-final]");
  if (!root) return;
  initialiseWorkflow(root);
  initialiseScrollStory(root);
  if (root.querySelector(".page-hero-art")) {
    const script = document.createElement("script");
    script.src = "/runtime/parallax.js";
    script.async = true;
    document.head.append(script);
  }
  if (typeof IntersectionObserver !== "undefined") {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const seen = new WeakSet<Element>();
    const enabled = () =>
      !reduced.matches &&
      !document.hidden &&
      document.documentElement.dataset.motion !== "off";
    const reveal = (element: Element, distance: number, delay = 0) => {
      if (seen.has(element)) return;
      seen.add(element);
      if (!enabled()) return;
      const animation = element.animate(
        element.matches(".stage-icon")
          ? [
              {
                opacity: 0.65,
                translate: "0 16px",
                scale: "0.92",
                rotate: "-8deg",
              },
              { opacity: 1, translate: "0 0", scale: "1", rotate: "0deg" },
            ]
          : [
              { opacity: 0.65, translate: `0 ${distance}px` },
              { opacity: 1, translate: "0 0" },
            ],
        {
          duration: 600,
          delay,
          fill: "backwards",
          easing: "cubic-bezier(.23,1,.32,1)",
        },
      );
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
      animation.oncancel = () => animations.delete(animation);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const icons = [
            ...root.querySelectorAll(".approach-stages .stage-icon"),
          ];
          reveal(
            entry.target,
            16,
            Math.max(0, icons.indexOf(entry.target)) * 90,
          );
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );
    root
      .querySelectorAll(".approach-stages .stage-icon")
      .forEach((element) => observer.observe(element));
    const settle = () => {
      if (!enabled() || document.hidden) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      }
    };
    const motionObserver = new MutationObserver(settle);
    motionObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    reduced.addEventListener("change", settle);
    document.addEventListener("visibilitychange", settle);
    requestAnimationFrame(() => {
      const arrival = root.querySelector(".hero-art, .page-hero-art");
      if (arrival) reveal(arrival, 16);
    });
    window.addEventListener("pagehide", (event) => {
      animations.forEach((animation) => animation.cancel());
      if (!event.persisted) {
        observer.disconnect();
        motionObserver.disconnect();
        reduced.removeEventListener("change", settle);
        document.removeEventListener("visibilitychange", settle);
      }
    });
  }
  const sizeReference = () => {
    document.documentElement.style.setProperty(
      "--final-viewport",
      `${document.documentElement.clientWidth}px`,
    );
  };
  sizeReference();
  let viewportWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (viewportWidth === window.innerWidth) return;
    viewportWidth = window.innerWidth;
    sizeReference();
  });
  const form = root.querySelector<HTMLElement>(".final-contact-form");
  const submit = form?.querySelector<HTMLButtonElement>("button");
  const feedback = root.querySelector<HTMLElement>(".contact-feedback");
  if (submit) submit.disabled = false;
  const prepareEnquiry = () => {
    if (!form || !feedback) return;
    const fields = [
      ...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ];
    if (fields.some((field) => !field.reportValidity())) return;
    const values = Object.fromEntries(
      fields.map((field) => [field.name, field.value.trim()]),
    );
    const body = `Hello Axiomotl,\n\n${values.message}\n\n${values.name}\n${values.email}`;
    const draft = document.createElement("a");
    draft.href = `mailto:${email}?subject=${encodeURIComponent("Axiomotl project enquiry")}&body=${encodeURIComponent(body)}`;
    draft.textContent = "Open your email draft";
    feedback.replaceChildren(
      "Your enquiry is ready to review and send in your email application. ",
      draft,
    );
    feedback.hidden = false;
    draft.click();
  };
  submit?.addEventListener("click", prepareEnquiry);
  form?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      prepareEnquiry();
    }
  });
  const privacy = root.querySelector<HTMLDialogElement>(".privacy-dialog");
  root
    .querySelector(".privacy-trigger")
    ?.addEventListener("click", () => privacy?.showModal());
  root
    .querySelector(".privacy-close")
    ?.addEventListener("click", () => privacy?.close());
}
