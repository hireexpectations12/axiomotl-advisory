import * as THREE from "three";

// JudyZZ/threejs-parallax: colour-correct planes, smoothed viewport progress.
// Keep the original image in the layout and accessibility tree as a fallback.
const art = document.querySelector<HTMLElement>(".detail-page .page-hero-art");
const source = art?.querySelector<HTMLImageElement>("img");
if (art && source) initialiseParallax(art, source);

function initialiseParallax(art: HTMLElement, source: HTMLImageElement) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 700px)");
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  const enabled = () =>
    !reduced.matches && document.documentElement.dataset.motion !== "off";
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const canvas = renderer.domElement;
  canvas.className = "parallax-canvas";
  canvas.setAttribute("aria-hidden", "true");
  art.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 5;
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const layer = new THREE.Mesh(geometry, material);
  layer.renderOrder = 1;
  scene.add(layer);
  const icons = [
    ...document.querySelectorAll<HTMLElement>(
      ".detail-page .practice-icon, .detail-page .service-brand-icon, .detail-page .workflow-card > img",
    ),
  ];
  let frame = 0,
    progress = 0,
    target = 0,
    mouseX = 0,
    mouseY = 0,
    x = 0,
    y = 0;
  let visible = true,
    disposed = false,
    request = 0;
  let width = 0,
    height = 0;

  function schedule() {
    if (!frame && !disposed && !document.hidden && enabled())
      frame = requestAnimationFrame(render);
  }
  function measure() {
    const bounds = source.getBoundingClientRect();
    const parent = art.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    if (!width || !height) return;
    // Overscan leaves room for movement without cutting off the existing artwork.
    canvas.style.left = `${bounds.left - parent.left - 32}px`;
    canvas.style.top = `${bounds.top - parent.top - 160}px`;
    renderer.setSize(width + 64, height + 320);
    camera.left = -(width + 64) / 2;
    camera.right = (width + 64) / 2;
    camera.top = (height + 320) / 2;
    camera.bottom = -(height + 320) / 2;
    camera.updateProjectionMatrix();
    const aspect = source.naturalWidth / source.naturalHeight || width / height;
    const imageWidth = Math.min(width, height * aspect);
    layer.scale.set(imageWidth, imageWidth / aspect, 1);
    update();
  }
  function update() {
    const bounds = art.getBoundingClientRect();
    target = Math.max(
      -1.4,
      Math.min(
        1.4,
        (innerHeight / 2 - bounds.top - bounds.height / 2) /
          (innerHeight / 2 + bounds.height / 2),
      ),
    );
    schedule();
  }
  function render() {
    frame = 0;
    if (disposed || !enabled() || document.hidden) return;
    progress += (target - progress) * 0.06;
    x += (mouseX - x) * 0.065;
    y += (mouseY - y) * 0.065;
    const amount = narrow.matches ? 24 : 100;
    layer.position.set(x * 5, -progress * amount + y * 4, 0);
    const caption = art.querySelector<HTMLElement>("figcaption");
    if (caption) caption.style.translate = `0 ${progress * amount}px`;
    if (visible && material.map) renderer.render(scene, camera);
    for (const icon of icons) {
      const bounds = icon.parentElement!.getBoundingClientRect();
      const p = Math.max(
        -1,
        Math.min(
          1,
          (innerHeight / 2 - bounds.top - bounds.height / 2) / innerHeight,
        ),
      );
      icon.style.translate = `0 ${-p * (narrow.matches ? 10 : 36)}px`;
    }
    if (
      visible &&
      (Math.abs(target - progress) > 0.001 ||
        Math.abs(mouseX - x) > 0.001 ||
        Math.abs(mouseY - y) > 0.001)
    )
      schedule();
  }
  function sync() {
    const active = enabled() && !!material.map;
    art.classList.toggle("parallax-ready", active);
    canvas.hidden = !active;
    if (!enabled() || document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      icons.forEach((icon) => icon.style.removeProperty("translate"));
      art
        .querySelector<HTMLElement>("figcaption")
        ?.style.removeProperty("translate");
    } else {
      update();
    }
  }
  async function load() {
    const version = ++request;
    art.classList.remove("parallax-ready");
    canvas.hidden = true;
    try {
      const texture = await new THREE.TextureLoader().loadAsync(
        source.currentSrc || source.src,
      );
      if (disposed || version !== request) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map?.dispose();
      material.map = texture;
      material.needsUpdate = true;
      sync();
      measure();
      renderer.render(scene, camera);
    } catch {
      // An unavailable texture leaves the native image and link usable.
    }
  }
  function move(event: PointerEvent) {
    if (!pointer.matches) return;
    const bounds = art.getBoundingClientRect();
    mouseX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    mouseY = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
    schedule();
  }
  function leave() {
    mouseX = mouseY = 0;
    schedule();
  }
  const resize = new ResizeObserver(measure);
  resize.observe(source);
  const visibility = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) update();
  });
  visibility.observe(art);
  const motion = new MutationObserver(sync);
  motion.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  source.addEventListener("load", load);
  art.addEventListener("pointermove", move);
  art.addEventListener("pointerleave", leave);
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", measure);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  if (source.complete && source.naturalWidth) void load();
  function hide(event: PageTransitionEvent) {
    cancelAnimationFrame(frame);
    frame = 0;
    if (event.persisted) return;
    disposed = true;
    resize.disconnect();
    visibility.disconnect();
    motion.disconnect();
    source.removeEventListener("load", load);
    art.removeEventListener("pointermove", move);
    art.removeEventListener("pointerleave", leave);
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", measure);
    window.removeEventListener("pageshow", sync);
    window.removeEventListener("pagehide", hide);
    document.removeEventListener("visibilitychange", sync);
    reduced.removeEventListener("change", sync);
    material.map?.dispose();
    material.dispose();
    geometry.dispose();
    renderer.dispose();
    canvas.remove();
    art.classList.remove("parallax-ready");
    icons.forEach((icon) => icon.style.removeProperty("translate"));
    art
      .querySelector<HTMLElement>("figcaption")
      ?.style.removeProperty("translate");
  }
  canvas.addEventListener("webglcontextlost", () => {
    art.classList.remove("parallax-ready");
    canvas.hidden = true;
    hide(new PageTransitionEvent("pagehide"));
  });
  window.addEventListener("pagehide", hide);
  window.addEventListener("pageshow", sync);
}
