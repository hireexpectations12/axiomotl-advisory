(() => {
  const root = document.querySelector("[data-axiomotl-scrollcraft]");
  if (!root) return;
  window.ScrollCraft?.mount(root);
  root.classList.add("ax-enhanced");
  const section = root.querySelector("#approach");
  const sheet = root.querySelector("[data-handover-state]");
  const buttons = [...root.querySelectorAll("[data-handover-step]")];
  const email = root.querySelector("[data-handover-email]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const motionButton = root.querySelector("[data-advisory-motion]");
  let motionOff = reduced.matches;
  const compact = matchMedia("(max-width: 760px)");
  const subjects = [
    "Clarifying requirements",
    "Agreeing responsibilities",
    "Preparing for everyday operations",
  ];
  let manual = false;
  let frame = 0;
  let current = -1;
  function select(step, userInitiated = false) {
    if (step === current && !userInitiated) return;
    current = step;
    sheet.dataset.handoverState = String(step);
    buttons.forEach((button, index) =>
      button.setAttribute("aria-pressed", String(index === step)),
    );
    if (userInitiated) {
      email.href =
        "mailto:hello@axiomotl.com.au?subject=" +
        encodeURIComponent(subjects[step]) +
        "&body=" +
        encodeURIComponent(
          "Hello Axiomotl,\n\nI would like to discuss " +
            subjects[step].toLowerCase() +
            " for our organisation.\n\n",
        );
    }
  }
  function update() {
    frame = 0;
    if (
      document.hidden ||
      manual ||
      motionOff ||
      reduced.matches ||
      compact.matches
    )
      return;
    const rect = section.getBoundingClientRect();
    const travel = Math.max(section.offsetHeight - innerHeight, 1);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    select(progress < 0.3 ? 0 : progress < 0.66 ? 1 : 2);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  buttons.forEach((button, index) =>
    button.addEventListener("click", () => {
      manual = true;
      select(index, true);
    }),
  );
  function layout() {
    root.classList.toggle("ax-motion-off", motionOff || reduced.matches);
    motionButton.textContent =
      motionOff || reduced.matches ? "Motion off" : "Motion on";
    motionButton.setAttribute(
      "aria-pressed",
      String(!motionOff && !reduced.matches),
    );
    section.style.minHeight =
      motionOff || reduced.matches || compact.matches
        ? "0"
        : Math.max(innerHeight * 1.7, 1200) + "px";
    if (motionOff || reduced.matches || compact.matches) select(2);
    else update();
  }
  motionButton.addEventListener("click", () => {
    motionOff = !motionOff;
    layout();
  });
  root.querySelectorAll(".ax-mobile-menu a").forEach((link) =>
    link.addEventListener("click", () => {
      root.querySelector(".ax-mobile-menu").open = false;
    }),
  );
  root.querySelector(".ax-mobile-menu").addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary").focus();
    }
  });
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", layout, { passive: true });
  reduced.addEventListener("change", layout);
  document.addEventListener("visibilitychange", schedule);
  layout();
})();
