import Lenis from "lenis";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "../components/react-bits/SplitText/SplitText";

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const desktop = matchMedia(
  "(min-width: 761px) and (hover: hover) and (pointer: fine)",
);
let lenis: Lenis | undefined;
const headings: { mount: HTMLSpanElement; text: Text; react: Root }[] = [];
let introduced = false;
let accessibleHeading:
  { element: HTMLElement; label: string | null } | undefined;

function restoreHeading() {
  for (const { mount, text, react } of headings.splice(0)) {
    flushSync(() => react.unmount());
    mount.replaceWith(text);
  }
  if (accessibleHeading) {
    const { element, label } = accessibleHeading;
    if (label === null) element.removeAttribute("aria-label");
    else element.setAttribute("aria-label", label);
    accessibleHeading = undefined;
  }
}

function refresh() {
  const enabled = root.dataset.motion !== "off" && !reduced.matches;
  if (!enabled || !desktop.matches || document.hidden) {
    lenis?.destroy();
    lenis = undefined;
    root.classList.remove("has-smooth-motion");
  } else if (!lenis) {
    root.classList.add("has-smooth-motion");
    lenis = new Lenis({
      autoRaf: true,
      lerp: 0.12,
      anchors: {
        offset:
          -parseFloat(getComputedStyle(root).scrollPaddingTop || "0") || 0,
      },
      prevent: (node) =>
        node.matches(
          "textarea, select, [contenteditable], [data-lenis-prevent]",
        ),
    });
    lenis.on("scroll", ScrollTrigger.update);
  }
  const blocked = document.querySelector(
    'dialog[open], [aria-modal="true"], #mobile-nav:not([hidden])',
  );
  if (blocked) lenis?.stop();
  else lenis?.start();

  if (!enabled) restoreHeading();
  if (enabled && !introduced && !document.hidden) {
    introduced = true;
    const heading = document.querySelector<HTMLElement>("main h1");
    if (!heading) return;
    accessibleHeading = {
      element: heading,
      label: heading.getAttribute("aria-label"),
    };
    heading.setAttribute(
      "aria-label",
      heading.innerText.replace(/\s+/g, " ").trim(),
    );
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (text.textContent?.trim()) texts.push(text);
    }
    for (const text of texts) {
      const mount = document.createElement("span");
      mount.dataset.reactBitsHeading = "";
      text.replaceWith(mount);
      const react = createRoot(mount);
      headings.push({ mount, text, react });
      flushSync(() =>
        react.render(
          <>
            {text.data.match(/^\s*/)?.[0]}
            <SplitText
              text={text.data.trim()}
              tag="span"
              textAlign="left"
              splitType="words"
              delay={35}
              duration={0.45}
              from={{ opacity: 0.7, y: 8 }}
              to={{ opacity: 1, y: 0 }}
              rootMargin="0px"
            />
            {text.data.match(/\s*$/)?.[0]}
          </>,
        ),
      );
    }
  }
}

const observer = new MutationObserver(refresh);
observer.observe(root, {
  subtree: true,
  attributes: true,
  attributeFilter: ["data-motion", "open", "hidden", "aria-modal"],
});
reduced.addEventListener("change", refresh);
desktop.addEventListener("change", refresh);
document.addEventListener("visibilitychange", refresh);
window.addEventListener("pagehide", () => {
  lenis?.destroy();
  lenis = undefined;
  root.classList.remove("has-smooth-motion");
  restoreHeading();
});
window.addEventListener("pageshow", refresh);
refresh();
