(() => {
  'use strict';

  const stages = [
    { name: 'Analyse', icon: 'analyse', title: 'See how work really moves.', description: 'Map the evidence, handoffs and hidden workarounds.' },
    { name: 'Design', icon: 'design', title: 'Give the system a clear structure.', description: 'Resolve root causes with explicit roles, controls and pathways.' },
    { name: 'Decide', icon: 'decide', title: 'Make the decision that moves it forward.', description: 'Connect the owner, evidence and options to a clear decision.' },
    { name: 'Transition', icon: 'transition', title: 'Make the handover hold.', description: 'Turn the design into usable roles, training and support.' },
    { name: 'Sustain', icon: 'sustain', title: 'Keep the outcome in view.', description: 'Set measures and review points that hold after implementation.' },
  ];

  const tabs = [...document.querySelectorAll('.stage-node')];
  const panel = document.querySelector('.stage-panel');
  const scene = document.querySelector('.scene');
  const sceneBody = document.querySelector('.scene-body');
  const core = document.querySelector('.core');
  const coreIcon = document.querySelector('.core-icon use');
  const stageTitle = document.querySelector('.stage-title');
  const stageDescription = document.querySelector('.stage-description');
  const stageCount = document.querySelector('.stage-count');
  const coreTitle = document.querySelector('.core-title');
  const coreNumber = document.querySelector('.core-number');
  const motionButton = document.querySelector('.motion-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;
  let selected = 0;
  let motionRequested = true;
  let transition;
  let entrance;

  const canMove = () => motionRequested && !reducedMotion.matches;

  function selectStage(index, focus = false) {
    selected = (index + stages.length) % stages.length;
    const stage = stages[selected];
    const number = String(selected + 1).padStart(2, '0');

    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === selected));
      tab.tabIndex = i === selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs[selected].id);
    stageTitle.textContent = stage.title;
    stageDescription.textContent = stage.description;
    stageCount.textContent = number;
    coreTitle.textContent = stage.name;
    coreNumber.textContent = `${number} / 05`;
    coreIcon.setAttribute('href', `#${stage.icon}-icon`);
    if (focus) tabs[selected].focus({ preventScroll: true });

    if (!gsap) return;
    transition?.kill();
    gsap.set(['.core-icon', '.stage-copy', '.node-face'], { clearProps: 'transform,opacity,visibility' });
    if (!canMove()) return;

    transition = gsap.timeline({ defaults: { duration: .55, ease: 'expo.out' } });
    transition.fromTo('.core-icon', { rotation: -18, scale: .75 }, { rotation: 0, scale: 1 }, 0)
      .fromTo('.stage-copy', { y: 5, opacity: .65 }, { y: 0, opacity: 1, duration: .35 }, 0)
      .to('.orbit-progress', { rotation: selected * 72, svgOrigin: '300 232', duration: .65 }, 0)
      .fromTo(tabs[selected].querySelector('.node-face'), { scale: .94 }, { scale: 1, clearProps: 'transform' }, 0);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectStage(index));
    tab.addEventListener('keydown', event => {
      const commands = { ArrowRight: selected + 1, ArrowDown: selected + 1, ArrowLeft: selected - 1, ArrowUp: selected - 1, Home: 0, End: stages.length - 1 };
      if (!(event.key in commands)) return;
      event.preventDefault();
      selectStage(commands[event.key], true);
    });
  });
  document.querySelector('.previous-stage').addEventListener('click', () => selectStage(selected - 1));
  document.querySelector('.next-stage').addEventListener('click', () => selectStage(selected + 1));

  function syncMotion() {
    const enabled = canMove();
    motionButton.setAttribute('aria-pressed', String(enabled));
    motionButton.querySelector('span').textContent = enabled ? 'Motion on' : 'Motion off';
    motionButton.querySelector('use').setAttribute('href', enabled ? '#pause-icon' : '#play-icon');
    document.body.classList.toggle('motion-off', !enabled);
    if (gsap && !enabled) {
      entrance?.progress(1);
      transition?.kill();
      gsap.killTweensOf([sceneBody, '.core-icon', '.stage-copy', '.node-face']);
      gsap.set(sceneBody, { clearProps: 'transform' });
      gsap.set(['.core-icon', '.stage-copy', '.node-face'], { clearProps: 'transform,opacity,visibility' });
    }
  }
  motionButton.addEventListener('click', () => {
    if (reducedMotion.matches) {
      motionButton.querySelector('span').textContent = 'Reduced motion';
      return;
    }
    motionRequested = !motionRequested;
    syncMotion();
  });
  reducedMotion.addEventListener('change', syncMotion);
  syncMotion();

  if (!gsap) {
    motionButton.hidden = true;
    return;
  }

  const media = gsap.matchMedia();
  media.add({ fine: '(hover: hover) and (pointer: fine)', reduce: '(prefers-reduced-motion: reduce)', wide: '(min-width: 851px)', all: '(min-width: 0px)' }, context => {
    const { fine, reduce, wide } = context.conditions;
    const baseX = wide ? 10 : 0;
    const baseY = wide ? -9 : 0;
    if (reduce || !fine) return;

    const rotateX = gsap.quickTo(sceneBody, 'rotationX', { duration: .8, ease: 'power3.out' });
    const rotateY = gsap.quickTo(sceneBody, 'rotationY', { duration: .8, ease: 'power3.out' });
    let bounds;
    const enter = () => { bounds = scene.getBoundingClientRect(); };
    const move = event => {
      if (!canMove() || event.pointerType === 'touch') return;
      if (!bounds) bounds = scene.getBoundingClientRect();
      const x = gsap.utils.clamp(-.5, .5, (event.clientX - bounds.left) / bounds.width - .5);
      const y = gsap.utils.clamp(-.5, .5, (event.clientY - bounds.top) / bounds.height - .5);
      rotateX(baseX - y * 13);
      rotateY(baseY + x * 15);
    };
    const leave = () => {
      if (!canMove()) return;
      rotateX(baseX);
      rotateY(baseY);
      bounds = null;
    };
    scene.addEventListener('pointerenter', enter);
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerleave', leave);
    return () => {
      scene.removeEventListener('pointerenter', enter);
      scene.removeEventListener('pointermove', move);
      scene.removeEventListener('pointerleave', leave);
    };
  });

  if (canMove()) {
    entrance = gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.dial-ring', { z: 4, duration: .85 }, 0)
      .from(core, { z: 38, duration: .9 }, .05)
      .from('.stage-node', { z: 20, duration: .8, stagger: { amount: .2 } }, .08);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) transition?.progress(1);
  });
})();
