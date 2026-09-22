(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const stages = [
    { name: 'Analyse', title: 'Find the real problem.', description: 'Connect the evidence, map the current state and understand where the work breaks down.', output: 'A shared view of the problem and the decisions that matter.' },
    { name: 'Design', title: 'Make the work operable.', description: 'Shape requirements, processes and interfaces around the people who need to use them.', output: 'Traceable requirements and clear process and decision maps.' },
    { name: 'Decide', title: 'Put evidence behind the choice.', description: 'Bring options, trade-offs and decision ownership into the same conversation.', output: 'A clear basis for decisions, procurement and evaluation.' },
    { name: 'Transition', title: 'Make the handover hold.', description: 'Prepare the people, roles and support arrangements needed for everyday operations.', output: 'Readiness, handover and a practical support model.' },
    { name: 'Sustain', title: 'Keep ownership alive.', description: 'Keep governance useful with healthchecks, assurance and course correction as the work changes.', output: 'Clear ownership and a way to keep improving the operating model.' }
  ];
  const pieces = $$('.piece');
  const tabs = $$('[data-stage]');
  const slider = $('#clarity');
  const alignButton = $('#align-button');
  const caption = $('#demo-caption');
  const motionButton = $('#motion-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hasGsap = Boolean(window.gsap);
  let activeStage = 0;
  let motionEnabled = !reduced.matches;
  let animationContext;
  let alignTween;
  let panelTween;
  let pointerCleanup = () => {};
  const clarityState = { value: 0 };
  const scattered = [{ x: -90, y: -144, r: -12 }, { x: 102, y: -74, r: 9 }, { x: -102, y: 12, r: -7 }, { x: 98, y: 88, r: 10 }, { x: -82, y: 163, r: -8 }];

  function renderClarity() {
    $('.stage-tabs').setAttribute('aria-orientation', window.innerWidth <= 800 ? 'horizontal' : 'vertical');
    const progress = clarityState.value / 100;
    const narrow = window.innerWidth <= 480;
    const horizontalScale = Math.min(1, Math.max(.43, ($('#composition').clientWidth - (narrow ? 183 : window.innerWidth <= 1100 && window.innerWidth > 800 ? 195 : 224)) / 222));
    pieces.forEach((piece, index) => {
      const start = scattered[index];
      const x = start.x * horizontalScale * (1 - progress);
      const y = start.y * (1 - progress) + (index - 2) * (narrow ? 70 : 80) * progress;
      const rotation = start.r * (1 - progress);
      if (hasGsap) gsap.set(piece, { x, y, rotation });
      else piece.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
    });
    $('.path-line').style.transform = `scaleY(${progress})`;
    slider.value = String(Math.round(clarityState.value));
    slider.setAttribute('aria-valuetext', progress === 0 ? 'Scattered pieces' : progress === 1 ? 'A connected path through five stages' : `${Math.round(progress * 100)} percent aligned`);
    alignButton.firstChild.textContent = progress > .95 ? 'Scatter again ' : 'Align the pieces ';
  }

  function selectStage(index, focus = false) {
    activeStage = (index + stages.length) % stages.length;
    const stage = stages[activeStage];
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === activeStage));
      tab.tabIndex = i === activeStage ? 0 : -1;
    });
    $('#stage-panel').setAttribute('aria-labelledby', `stage-${activeStage}`);
    $('#stage-title').textContent = stage.title;
    $('#stage-description').textContent = stage.description;
    $('#stage-output').textContent = stage.output;
    $('#stage-count').textContent = `${String(activeStage + 1).padStart(2, '0')} / 05`;
    $('.stage-big-number').textContent = String(activeStage + 1).padStart(2, '0');
    caption.textContent = `${String(activeStage + 1).padStart(2, '0')} / ${stage.name}. ${stage.output}`;
    if (focus) tabs[activeStage].focus();
    if (hasGsap) {
      panelTween?.kill();
      gsap.set('.stage-content', { opacity: 1, y: 0 });
      if (motionEnabled) panelTween = gsap.fromTo('.stage-content', { opacity: .6, y: 8 }, { opacity: 1, y: 0, duration: .35, ease: 'expo.out', overwrite: true });
      const patterns = [[-24, 16, -8], [0, 0, 0], [45, -45, 0], [0, 30, 0], [-15, 0, 15]];
      gsap.to('.art-bar', { rotation: (i) => patterns[activeStage][i], duration: motionEnabled ? .5 : 0, ease: 'expo.out', overwrite: true });
    }
  }

  slider.addEventListener('input', () => {
    alignTween?.kill();
    clarityState.value = Number(slider.value);
    renderClarity();
    caption.textContent = clarityState.value > 95 ? 'One connected path: Analyse, Design, Decide, Transition, Sustain.' : 'Slide to connect the pieces. Select a piece to explore the method.';
  });
  alignButton.addEventListener('click', () => {
    alignTween?.kill();
    const target = clarityState.value > 95 ? 0 : 100;
    caption.textContent = target === 100 ? 'One connected path: Analyse, Design, Decide, Transition, Sustain.' : 'Slide to connect the pieces. Select a piece to explore the method.';
    if (hasGsap && motionEnabled) alignTween = gsap.to(clarityState, { value: target, duration: .85, ease: 'expo.out', onUpdate: renderClarity });
    else { clarityState.value = target; renderClarity(); }
  });
  pieces.forEach((piece, i) => piece.addEventListener('click', () => selectStage(i)));
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectStage(i));
    tab.addEventListener('keydown', (event) => {
      let target;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') target = activeStage + 1;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') target = activeStage - 1;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = 4;
      if (target !== undefined) { event.preventDefault(); selectStage(target, true); }
    });
  });
  $('#next-stage').addEventListener('click', () => selectStage(activeStage + 1));

  function configureMotion() {
    pointerCleanup();
    animationContext?.revert();
    panelTween?.kill();
    if (alignTween?.isActive()) alignTween.progress(1);
    document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off';
    motionButton.setAttribute('aria-pressed', String(motionEnabled));
    motionButton.querySelector('span').textContent = motionEnabled ? 'Motion on' : 'Motion off';
    if (!hasGsap) return;
    gsap.set('.stage-content', { opacity: 1, y: 0 });
    if (!motionEnabled) return;
    animationContext = gsap.context(() => {
      if (window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        gsap.to('.red-disc', { y: -90, rotation: 24, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .7 } });
        $$('.piece-scroll').forEach((layer) => gsap.to(layer, { y: Number(layer.dataset.depth), ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .7 } }));
        gsap.fromTo('.strip-track', { x: -30 }, { x: -260, ease: 'none', scrollTrigger: { trigger: '.moving-strip', start: 'top bottom', end: 'bottom top', scrub: .8 } });
        gsap.fromTo('.art-circle', { y: -10 }, { y: 38, ease: 'none', scrollTrigger: { trigger: '.stage-panel', start: 'top bottom', end: 'bottom top', scrub: .7 } });
      }
      if (finePointer.matches) {
        const panel = $('#composition');
        const pointers = $$('.piece-pointer').map((layer, i) => ({ x: gsap.quickTo(layer, 'x', { duration: .6, ease: 'power3.out' }), y: gsap.quickTo(layer, 'y', { duration: .6, ease: 'power3.out' }), depth: (i - 2) * 3 }));
        const move = (event) => {
          const bounds = panel.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - .5;
          const y = (event.clientY - bounds.top) / bounds.height - .5;
          pointers.forEach((point) => { point.x(x * point.depth * 2); point.y(y * point.depth * 2); });
        };
        const leave = () => pointers.forEach((point) => { point.x(0); point.y(0); });
        panel.addEventListener('pointermove', move);
        panel.addEventListener('pointerleave', leave);
        pointerCleanup = () => { panel.removeEventListener('pointermove', move); panel.removeEventListener('pointerleave', leave); };
      }
    });
  }
  motionButton.addEventListener('click', () => { motionEnabled = !motionEnabled; configureMotion(); });
  reduced.addEventListener('change', () => { motionEnabled = !reduced.matches; configureMotion(); });
  finePointer.addEventListener('change', configureMotion);
  window.addEventListener('resize', renderClarity);
  $$('details').forEach((detail) => detail.addEventListener('toggle', () => { if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh(); }));
  renderClarity();
  configureMotion();
  document.fonts.ready.then(() => { if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh(); });
})();
