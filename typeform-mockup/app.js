(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const challenges = [
    "Understanding what's really happening",
    'Turning requirements into clear decisions',
    'Getting ready for everyday operations',
    'Senior analysis alongside my team'
  ];
  const contextQuestions = [
    { title: 'Where do you feel the friction?', options: ['Evidence is fragmented or hard to trust', 'Decision ownership is unclear', 'Work keeps getting repeated or patched', "We're still working out the problem"] },
    { title: 'What needs to come together?', options: ['Business and system requirements', 'Processes, interfaces and decision rights', 'Procurement or vendor evaluation', "We're still defining the scope"] },
    { title: 'What needs to be ready?', options: ['Handover from a project into operations', 'Roles, governance and ongoing support', 'People, training and operational readiness', "We need to understand the gaps first"] },
    { title: 'Where would senior support help?', options: ['Complex decisions and executive advice', 'Stakeholder and vendor conversations', 'Governance healthchecks and course correction', 'A mix of these, as the work develops'] }
  ];
  const workingStyles = ['A focused piece of work', 'Support across several stages', 'Someone embedded alongside the team', "Let's work that out together"];
  const services = [
    { name: 'Business & Governance Diagnostic', reason: 'A diagnostic can connect the evidence, clarify the current state and make the next decisions visible.', outputs: ['Current-state and stakeholder analysis', 'Root causes and control gaps', 'Prioritised decisions and actions'] },
    { name: 'Requirements & Decision Architecture', reason: 'This work connects requirements, processes and evidence so the team has a clearer basis for delivery and decisions.', outputs: ['Requirements and traceability', 'Process, interface and decision maps', 'Procurement and evaluation artefacts'] },
    { name: 'BAU Transition & Operating Model', reason: 'This work focuses on the people, ownership and support arrangements needed for everyday operations.', outputs: ['Readiness and transition assessment', 'Governance, roles and support model', 'Handover, training and assurance'] },
    { name: 'Embedded Principal BA Advisory', reason: 'Embedded advisory brings senior analysis into your team’s ongoing decisions, stakeholder work and governance.', outputs: ['Executive decision support', 'Complex stakeholder and vendor analysis', 'Governance healthchecks and course correction'] }
  ];
  const dialog = $('#journey');
  const answerList = $('#answer-list');
  const continueButton = $('#continue-button');
  const progress = $('.journey-progress');
  const answers = [null, null, null];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let step = 0;
  let motion = !reduceMotion.matches;
  let transition;
  let opener;
  let downloadUrl;

  function question() {
    if (step === 0) return { title: 'Where is the work getting complicated?', options: challenges };
    if (step === 1) return contextQuestions[answers[0]];
    return { title: 'How would you like to work together?', options: workingStyles };
  }

  function animateView(target, direction) {
    transition?.kill();
    if (!window.gsap) return;
    gsap.set(['#question-view', '#result-view'], { opacity: 1, y: 0 });
    if (motion) transition = gsap.fromTo(target, { y: direction * 22, opacity: .45 }, { y: 0, opacity: 1, duration: .45, ease: 'expo.out', overwrite: true });
  }

  function updateMotion() {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    ['#site-motion', '#journey-motion'].forEach((selector) => {
      $(selector).textContent = motion ? 'Motion on' : 'Motion off';
      $(selector).setAttribute('aria-pressed', String(motion));
    });
    if (!motion) {
      transition?.kill();
      if (window.gsap) gsap.set(['#question-view', '#result-view'], { opacity: 1, y: 0 });
    }
  }

  function choose(index, focus = false) {
    if (step === 0 && answers[0] !== index) answers[1] = null;
    answers[step] = index;
    [...answerList.children].forEach((button, i) => {
      button.setAttribute('aria-checked', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    continueButton.disabled = false;
    $('#answer-error').textContent = '';
    if (focus) answerList.children[index].focus();
  }

  function recommendation() {
    return services[answers[2] === 2 ? 3 : answers[0]];
  }

  function summaryText() {
    const context = $('#extra-context').value.trim();
    return [
      'Hello Axiomotl,', '',
      "I'd like to explore: " + recommendation().name, '',
      'My challenge: ' + challenges[answers[0]],
      'What needs attention: ' + contextQuestions[answers[0]].options[answers[1]],
      'Working together: ' + workingStyles[answers[2]],
      ...(context ? ['', 'A little more context:', context] : []), '',
      'Could we talk about a useful next step?'
    ].join('\n');
  }

  function updateEmail() {
    $('#email-summary').href = 'mailto:hello@axiomotl.com.au?subject=' + encodeURIComponent('A conversation about ' + recommendation().name) + '&body=' + encodeURIComponent(summaryText());
  }

  function renderResult() {
    const service = recommendation();
    $('#result-service').textContent = service.name;
    $('#result-reason').textContent = service.reason + (answers[2] === 2 && answers[0] !== 3 ? ' Your preference for support alongside the team is why this is the suggested starting point.' : '');
    $('#result-outputs').replaceChildren(...service.outputs.map((text) => { const li = document.createElement('li'); li.textContent = text; return li; }));
    const rows = [['Your challenge', challenges[answers[0]]], ['What needs attention', contextQuestions[answers[0]].options[answers[1]]], ['Working together', workingStyles[answers[2]]]];
    $('#result-answers').replaceChildren(...rows.flatMap(([label, value]) => {
      const dt = document.createElement('dt'); dt.textContent = label;
      const dd = document.createElement('dd'); dd.textContent = value;
      return [dt, dd];
    }));
    updateEmail();
  }

  function render(direction = 1, focus = true) {
    const isResult = step === 3;
    dialog.dataset.result = String(isResult);
    $('#question-view').hidden = isResult;
    $('#result-view').hidden = !isResult;
    dialog.setAttribute('aria-labelledby', isResult ? 'result-heading' : 'journey-heading');
    $('#back-question').disabled = step === 0;
    $('#journey-counter').textContent = isResult ? 'Your suggested starting point' : `Question ${step + 1} of 3`;
    const completed = Math.min(step, 3);
    progress.setAttribute('aria-valuenow', String(completed));
    $('#progress-fill').style.transform = `scaleX(${completed / 3})`;
    $('#answer-error').textContent = '';
    $('#download-status').textContent = '';
    if (isResult) renderResult();
    else {
      const current = question();
      $('#journey-heading').textContent = current.title;
      $('#question-number').firstChild.textContent = `${step + 1} `;
      $('#question-help').textContent = step === 0 ? 'Choose the closest fit. You can change your answers as you go.' : step === 1 ? 'There is no perfect answer. Pick the one that feels most useful to explore.' : "A starting preference is enough. We can shape the engagement together.";
      answerList.replaceChildren(...current.options.map((text, i) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'answer-option';
        button.setAttribute('role', 'radio'); button.setAttribute('aria-checked', String(answers[step] === i));
        button.tabIndex = answers[step] === i || (answers[step] === null && i === 0) ? 0 : -1;
        const key = document.createElement('span'); key.className = 'keycap'; key.setAttribute('aria-hidden', 'true'); key.textContent = String.fromCharCode(65 + i);
        const label = document.createElement('span'); label.textContent = text;
        button.append(key, label);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('icon', 'choice-check'); svg.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#check'); svg.append(use); button.append(svg);
        button.addEventListener('click', () => choose(i));
        button.addEventListener('keydown', (event) => {
          let next;
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % 4;
          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i + 3) % 4;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = 3;
          if (next !== undefined) { event.preventDefault(); choose(next, true); }
        });
        return button;
      }));
      continueButton.disabled = answers[step] === null;
      continueButton.firstChild.textContent = step === 2 ? 'See my starting point ' : 'Continue ';
    }
    dialog.scrollTop = 0;
    animateView(isResult ? '#result-view' : '#question-view', direction);
    if (focus) $(isResult ? '#result-heading' : '#journey-heading').focus({ preventScroll: true });
  }

  function openJourney(trigger, challenge) {
    opener = trigger;
    if (challenge !== undefined) {
      if (answers[0] !== challenge) answers[1] = null;
      answers[0] = challenge;
      step = 1;
    }
    document.body.classList.add('journey-open');
    dialog.showModal();
    render();
  }

  function closeJourney() { dialog.close(); }
  dialog.addEventListener('close', () => {
    document.body.classList.remove('journey-open');
    opener?.focus({ preventScroll: true });
  });
  $('#close-journey').addEventListener('click', closeJourney);
  $('#journey-home').addEventListener('click', (event) => { event.preventDefault(); closeJourney(); });
  $$('.journey-trigger').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); openJourney(link); }));
  $$('[data-challenge]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); openJourney(link, Number(link.dataset.challenge)); }));
  continueButton.addEventListener('click', () => { if (answers[step] !== null && step < 3) { step++; render(); } });
  $('#back-question').addEventListener('click', () => { if (step > 0) { step--; render(-1); } });
  $('#edit-answers').addEventListener('click', () => { step = 0; render(-1); });
  $('#restart-journey').addEventListener('click', () => {
    answers.fill(null); step = 0; $('#extra-context').value = ''; $('.answer-summary').open = false; render(-1);
  });
  dialog.addEventListener('keydown', (event) => {
    if (step > 2 || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('textarea,input,[contenteditable=true]')) return;
    if (event.key === 'Enter') {
      if (event.target.closest('button:not(.answer-option),a')) return;
      event.preventDefault();
      if (answers[step] === null) $('#answer-error').textContent = 'Choose an answer to continue.';
      else { step++; render(); }
    }
    if (/^[a-d]$/i.test(event.key)) { event.preventDefault(); choose(event.key.toUpperCase().charCodeAt(0) - 65, true); }
  });
  $('#extra-context').addEventListener('input', updateEmail);
  $('#download-summary').addEventListener('click', () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(new Blob([summaryText()], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = downloadUrl; link.download = 'axiomotl-starting-point.txt'; document.body.append(link); link.click(); link.remove();
    $('#download-status').textContent = 'Your summary is ready. Check your browser downloads.';
  });
  ['#site-motion', '#journey-motion'].forEach((selector) => $(selector).addEventListener('click', () => { motion = !motion; updateMotion(); }));
  reduceMotion.addEventListener('change', () => { motion = !reduceMotion.matches; updateMotion(); });
  updateMotion();
})();
