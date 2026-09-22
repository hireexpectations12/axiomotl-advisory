import { createRoot } from "react-dom/client";
import FormRunner from "../components/FormRunner";
import { initialiseHero } from "./hero";
import { initialisePageMotion } from "./page-motion";
import { initialiseClientFinal } from "./client-final";
import type { FormDefinition, SiteSettings } from "../lib/types";

const configElement = document.getElementById("axiomotl-config");
const config = configElement
  ? (JSON.parse(configElement.textContent || "{}") as {
      forms: FormDefinition[];
      settings: SiteSettings;
    })
  : null;
if (config) {
  initialiseClientFinal(config.settings.email);
  document
    .querySelectorAll<HTMLElement>("[data-axiomotl-form]")
    .forEach((mount) => {
      const form = config.forms.find(
        (form) => form.id === mount.dataset.axiomotlForm,
      );
      if (form) createRoot(mount).render(<FormRunner form={form} />);
    });
  const journey = config.forms.find((form) => form.id === "journey");
  if (journey) {
    const dialog = document.createElement("dialog");
    dialog.className = "axiomotl-journey";
    dialog.setAttribute("aria-label", journey.name);
    const close = document.createElement("button");
    close.className = "axiomotl-close";
    close.textContent = "Close conversation";
    close.type = "button";
    const mount = document.createElement("div");
    dialog.append(close, mount);
    document.body.append(dialog);
    const root = createRoot(mount);
    let opener: HTMLElement | null = null;
    let session = 0;
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      document.body.classList.remove("journey-open");
      opener?.focus();
    });
    document
      .querySelectorAll<HTMLElement>(".journey-trigger,[data-journey-answer]")
      .forEach((trigger) =>
        trigger.addEventListener("click", (event) => {
          event.preventDefault();
          opener = trigger;
          session++;
          root.render(
            <FormRunner
              key={session}
              form={journey}
              initialAnswers={
                trigger.dataset.journeyAnswer
                  ? { challenge: trigger.dataset.journeyAnswer }
                  : {}
              }
            />,
          );
          dialog.showModal();
          document.body.classList.add("journey-open");
          close.focus();
        }),
      );
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let motion = config.settings.motion && !reduced.matches;
  function updateMotion() {
    document.documentElement.dataset.motion = motion ? "on" : "off";
    document
      .querySelectorAll<HTMLButtonElement>("#site-motion, [data-motion-toggle]")
      .forEach((button) => {
        button.textContent = motion ? "Motion on" : "Motion off";
        button.setAttribute("aria-pressed", String(motion));
      });
  }
  document
    .querySelectorAll("#site-motion, [data-motion-toggle]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        motion = !motion && !reduced.matches;
        updateMotion();
      }),
    );
  reduced.addEventListener("change", () => {
    motion = config.settings.motion && !reduced.matches;
    updateMotion();
  });
  updateMotion();
}
initialiseHero();
initialisePageMotion();

const tabs = [...document.querySelectorAll<HTMLElement>("[data-showcase]")];
function selectTab(index: number, focus = false) {
  tabs.forEach((tab, i) => {
    tab.setAttribute("aria-selected", String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    const panel = document.getElementById(
      tab.getAttribute("aria-controls") || "",
    );
    if (panel) panel.hidden = i !== index;
  });
  if (focus) tabs[index]?.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(i));
  tab.addEventListener("keydown", (e) => {
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % tabs.length
        : e.key === "ArrowLeft"
          ? (i + tabs.length - 1) % tabs.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? tabs.length - 1
              : undefined;
    if (next !== undefined) {
      e.preventDefault();
      selectTab(next, true);
    }
  });
});
const menu = document.getElementById("mobile-nav"),
  toggle = document.getElementById("menu-toggle");
function closeMenu() {
  if (menu) menu.hidden = true;
  toggle?.setAttribute("aria-expanded", "false");
  toggle?.setAttribute("aria-label", "Open navigation");
}
closeMenu();
if (tabs.length)
  selectTab(
    Math.max(
      0,
      tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"),
    ),
  );
toggle?.addEventListener("click", () => {
  if (menu) {
    menu.hidden = !menu.hidden;
    toggle.setAttribute("aria-expanded", String(!menu.hidden));
    toggle.setAttribute(
      "aria-label",
      menu.hidden ? "Open navigation" : "Close navigation",
    );
  }
});
menu
  ?.querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu && !menu.hidden) {
    closeMenu();
    toggle?.focus();
  }
});
document.addEventListener("click", (event) => {
  if (
    event.target instanceof Node &&
    menu &&
    toggle &&
    !menu.contains(event.target) &&
    !toggle.contains(event.target)
  )
    closeMenu();
  document
    .querySelectorAll<HTMLDetailsElement>(".nav-dropdown[open]")
    .forEach((dropdown) => {
      if (event.target instanceof Node && !dropdown.contains(event.target))
        dropdown.open = false;
    });
});
