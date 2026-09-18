
(() => {
  "use strict";
  const hero = document.querySelector(".wave-hero");
  const visual = document.querySelector(".wave-visual");
  const canvas = document.getElementById("wave-canvas");
  if (!hero || !visual || !canvas) return;
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let nextAutoRipple = 0;
  let secondRippleAt = Infinity;
  let width = 0;
  let height = 0;
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let time = 0;
  let pointer = { x: 0.65, y: 0.5, active: false };
  let ripples = [];
  const particles = Array.from({ length: 180 }, (_, index) => ({
    x: 0.34 + ((index * 0.61803398875) % 1) * 0.65,
    y: (index * 0.754877666) % 1,
    size: 0.5 + (index % 4) * 0.3,
    phase: index * 1.73,
  }));

  function motionEnabled() {
    return (
      !reducedMotion.matches &&
      document.documentElement.dataset.motion !== "off"
    );
  }

  function draw() {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width / 1100, 1.3);
    for (const particle of particles) {
      let x = particle.x * width;
      let y = particle.y * height + Math.sin(time * 0.2 + particle.phase) * 12;
      let brightness = 0.2 + (Math.sin(particle.phase + time * 0.4) + 1) * 0.18;
      if (pointer.active && motionEnabled()) {
        const dx = pointer.x * width - x;
        const dy = pointer.y * height - y;
        const influence = Math.exp(-(dx * dx + dy * dy) / 24000);
        x += dx * influence * 0.12;
        y += dy * influence * 0.12;
        brightness += influence * 0.4;
      }
      for (const ripple of ripples) {
        const dx = x - ripple.x * width;
        const dy = y - ripple.y * height;
        const distance = Math.hypot(dx, dy);
        const age = time - ripple.start;
        const influence =
          Math.exp(-Math.pow((distance - age * 190) / 45, 2)) * (1 - age / 2.4);
        if (distance > 0) {
          x += (dx / distance) * influence * 17;
          y += (dy / distance) * influence * 17;
        }
        brightness += influence;
      }
      const edge = Math.sin(particle.y * Math.PI);
      context.fillStyle = `rgba(126, 216, 248, ${Math.min(brightness * edge, 0.95)})`;
      context.beginPath();
      context.arc(x, y, particle.size * scale, 0, Math.PI * 2);
      context.fill();
    }
    for (const ripple of ripples) {
      const age = time - ripple.start;
      const radius = age * 190 + 8;
      context.save();
      context.translate(ripple.x * width, ripple.y * height);
      context.scale(1, 0.6);
      context.lineWidth = 1;
      context.strokeStyle = `rgba(130, 226, 255, ${Math.max(0, (1 - age / 2.4) * 0.55)})`;
      context.shadowColor = "#61cfff";
      context.shadowBlur = 12;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  function animate(now) {
    frame = 0;
    if (!visible || document.hidden || !motionEnabled()) return;
    if (lastTime) time += Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (now >= nextAutoRipple) {
      ripple(0.65, 0.65);
      nextAutoRipple = now + 2000;
      secondRippleAt = now + 280;
    }
    if (now >= secondRippleAt) {
      ripple(0.65, 0.65);
      secondRippleAt = Infinity;
    }
    ripples = ripples.filter((ripple) => time - ripple.start < 2.4);
    draw();
    frame = requestAnimationFrame(animate);
  }

  function syncMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    nextAutoRipple = 0;
    secondRippleAt = Infinity;
    const enabled = motionEnabled();
    hero.dataset.waveMotion = enabled ? "on" : "off";
    if (!enabled) {
      visual.style.removeProperty("--wave-x");
      visual.style.removeProperty("--wave-y");
      ripples = [];
    }
    draw();
    if (enabled && visible && !document.hidden)
      frame = requestAnimationFrame(animate);
  }

  new ResizeObserver(() => {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }).observe(hero);

  hero.addEventListener("pointermove", (event) => {
    if (
      !motionEnabled() ||
      !finePointer.matches ||
      event.pointerType === "touch"
    )
      return;
    const bounds = hero.getBoundingClientRect();
    pointer = {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
      active: true,
    };
    visual.style.setProperty("--wave-x", `${(pointer.x - 0.5) * -18}px`);
    visual.style.setProperty("--wave-y", `${(pointer.y - 0.5) * -12}px`);
  });
  function resetPointer() {
    pointer.active = false;
    visual.style.removeProperty("--wave-x");
    visual.style.removeProperty("--wave-y");
  }
  hero.addEventListener("pointerleave", resetPointer);
  hero.addEventListener("pointercancel", resetPointer);

  function ripple(x, y) {
    if (!motionEnabled()) return;
    ripples.push({ x, y, start: time });
    if (ripples.length > 6) ripples.shift();
  }
  hero.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    const bounds = hero.getBoundingClientRect();
    ripple(
      (event.clientX - bounds.left) / bounds.width,
      (event.clientY - bounds.top) / bounds.height,
    );
  });
  new MutationObserver(syncMotion).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  reducedMotion.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncMotion();
  }).observe(hero);
  syncMotion();
})();



(() => {
  "use strict";

  const tabs = [...document.querySelectorAll("[data-connection]")];
  const visual = document.querySelector(".connection-visual");
  if (!visual || !tabs.length) return;
  let current = 0;

  function selectConnection(index, moveFocus = false) {
    const changed = current !== index;
    current = index;
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute("aria-controls")); if (panel) panel.hidden = !selected;
    });
    visual.dataset.view = tabs[index].dataset.connection;
    if (changed) document.dispatchEvent(new CustomEvent("axiomotl:connectionchange", {
      detail: { panelId: tabs[index].getAttribute("aria-controls") },
    }));
    if (moveFocus) tabs[index].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectConnection(index));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectConnection(next, true);
      }
    });
  });

  document.querySelector(".connection-sculpture").addEventListener("click", () => {
    selectConnection((current + 1) % tabs.length);
  });
})();

(() => {
  if (!window.gsap) return;
  const media = gsap.matchMedia();
  const sculpture = document.querySelector('.connection-sculpture');
  if (!sculpture) return;
  media.add('(prefers-reduced-motion: no-preference)', () => {
    if (document.documentElement.dataset.motion === 'off') return;
    let visible = false;
    const drift = gsap.to(sculpture, { y: -18, rotation: 3, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true });
    const sync = () => visible && !document.hidden ? drift.play() : drift.pause();
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(sculpture);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  });
  new MutationObserver(() => gsap.matchMediaRefresh()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
})();



(() => {
  "use strict";

  const gsap = window.gsap;
  if (!gsap) return;

  const root = document.documentElement;
  const media = gsap.matchMedia();
  let methodIntroduced = false;

  media.add("(prefers-reduced-motion: no-preference)", () => {
    if (root.dataset.motion === "off" || document.hidden) return;

    root.classList.add("has-gsap-micro");
    const events = new AbortController();
    const animatedElements = document.querySelectorAll(
      "header .button, main .button, .method-icon, .method-glyph, .connection-readout [role='tabpanel'] > *",
    );
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const presses = [];
    const listen = (element, type, handler) =>
      element.addEventListener(type, handler, { signal: events.signal });

    function addFeedback(control, target, hoverValues) {
      const hover = gsap.to(target, {
        ...hoverValues,
        duration: 0.2,
        ease: "power2.out",
        paused: true,
      });
      const press = gsap.to(target, {
        scale: 0.97,
        duration: 0.09,
        ease: "power2.out",
        paused: true,
      });
      presses.push(press);
      let pointerInside = false;
      let focused = false;
      const updateHover = () => {
        if (pointerInside || focused) hover.play();
        else hover.reverse();
      };
      listen(control, "pointerenter", (event) => {
        pointerInside = event.pointerType !== "touch" && finePointer.matches;
        updateHover();
      });
      listen(control, "pointerleave", () => {
        pointerInside = false;
        updateHover();
      });
      listen(control, "focus", () => {
        focused = true;
        updateHover();
      });
      listen(control, "blur", () => {
        focused = false;
        press.reverse();
        updateHover();
      });
      listen(control, "pointerdown", (event) => {
        if (event.button === 0) press.play();
      });
      listen(control, "keydown", (event) => {
        if (!event.repeat && (event.key === "Enter" ||
            (event.key === " " && control.tagName === "BUTTON"))) press.play();
      });
    }

    document.querySelectorAll("header .button, main .button").forEach((button) => {
      addFeedback(button, button, { y: -2 });
    });
    const turns = { analyse: -5, design: 6, decide: -4, transition: 0, sustain: 8 };
    document.querySelectorAll(".method-step").forEach((step) => {
      addFeedback(step, step.querySelector(".method-icon"), {
        y: -3,
        x: step.dataset.method === "transition" ? 3 : 0,
        rotation: turns[step.dataset.method],
        transformOrigin: "50% 50%",
      });
    });
    const release = () => presses.forEach((press) => press.reverse());
    ["pointerup", "pointercancel", "keyup"].forEach((type) => listen(document, type, release));
    listen(window, "blur", release);

    const panelTweens = new Map();
    document.querySelectorAll(".connection-readout [role='tabpanel']").forEach((panel) => {
      panelTweens.set(panel.id, gsap.fromTo(panel.children,
        { y: 7, autoAlpha: 0.65 },
        {
          y: 0, autoAlpha: 1, duration: 0.22, stagger: 0.025,
          ease: "power2.out", paused: true, immediateRender: false,
          clearProps: "transform,opacity,visibility",
        },
      ));
    });
    listen(document, "axiomotl:connectionchange", (event) => {
      panelTweens.forEach((tween) => tween.progress(1).pause());
      panelTweens.get(event.detail.panelId)?.restart();
    });

    const introduction = gsap.timeline({
      paused: true,
      defaults: { duration: 0.28, ease: "power2.out" },
    }).fromTo(".method-glyph", { y: 8, scale: 0.92, autoAlpha: 0.5 }, {
      y: 0, scale: 1, autoAlpha: 1, stagger: 0.045,
      immediateRender: false, clearProps: "transform,opacity,visibility",
    });
    const methodObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      if (!methodIntroduced) {
        methodIntroduced = true;
        introduction.play();
      }
      methodObserver.disconnect();
    }, { threshold: 0.2 });
    const methodTiles = document.querySelector(".method-tiles"); if (methodTiles) methodObserver.observe(methodTiles);

    return () => {
      events.abort();
      methodObserver.disconnect();
      gsap.set(animatedElements, {
        clearProps: "transform,transformOrigin,opacity,visibility",
      });
      root.classList.remove("has-gsap-micro");
    };
  });

  const refreshMotion = () => gsap.matchMediaRefresh();
  new MutationObserver(refreshMotion).observe(root, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  document.addEventListener("visibilitychange", refreshMotion);
  window.addEventListener("pagehide", () => media.revert());
  window.addEventListener("pageshow", refreshMotion);
})();
