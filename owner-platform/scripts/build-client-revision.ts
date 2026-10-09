import { readFile, writeFile } from "node:fs/promises";
import { load } from "cheerio";
import type { AnyNode, Text } from "domhandler";
import { validateDocument } from "../src/lib/render";
const root = new URL("../design/revision/", import.meta.url);
const document = JSON.parse(
  await readFile(new URL("document.json", root), "utf8"),
);
const css = await readFile(new URL("changes.css", root), "utf8");
const servicesSource = load(await readFile(new URL("services-source.html", root), "utf8"));
document.settings.font = "Nunito";
const scrollPages = new Set(["/practice", "/services", "/approach"]);
const approvedIcons = {
  analyse: "web/Icon_Lens_Observation.webp",
  design: "web/Icon_Governance_Design.webp",
  implement: "web/Icon_Decision_Gate.webp",
  transition: "web/Icon_Pathways_Flows.webp",
  sustain: "web/Icon_Outcomes_Stability.webp",
  governance: "web/Icon_Governance.webp",
  decisions: "web/Icon_Decisions_Checkpoints.webp",
  outcomes: "web/Icon_Outcomes.webp",
  assurance: "web/Icon_Outcomes_Assurance.webp",
  pattern: "web/Icon_Pattern_Resolution.webp",
  patternDetailed: "web/Icon_Pattern_Resolution_detailed.webp",
  patternLens: "web/Icon_Pattern_Resolution_Lens.webp",
  process: "web/Icon_Process_Flow.webp",
  processAnalysis: "web/Icon_ProcessAnalysis.webp",
  clarity: "web/Icon_ProcessClarity_DecisionConfidence.webp",
  stability: "web/Icon_ResolveDrift.webp",
} as const;
const approvedIcon = (
  name: keyof typeof approvedIcons,
  className = "approved-icon",
) =>
  `<span class="${className} approved-icon" aria-hidden="true"><img src="/site-assets/approved-icons/${approvedIcons[name]}" alt="" loading="lazy" /></span>`;

for (const page of document.pages) {
  const $ = load(page.html, null, false);
  $(".site-header .nav-contact").remove();
  const desktopNavigation = $(".desktop-nav").first();
  if (!desktopNavigation.find('a[href^="mailto:"]').length) {
    desktopNavigation.append(
      '<a href="mailto:hello@axiomotl.com.au">Contact</a>',
    );
  }
  $('#mobile-nav a[href^="mailto:"]').text("Contact");
  const menuLabels = new Map([
    ["/", "Home"],
    ["/practice", "Our Practice"],
    ["/services", "Our Services"],
    ["/approach", "Our Approach"],
  ]);
  menuLabels.forEach((label, href) => {
    const links = $(`header nav a[href="${href}"], #mobile-nav a[href="${href}"]`).text(label);
    if (href === page.path) links.attr("aria-current", "page");
    else links.removeAttr("aria-current");
  });
  $('header a[href^="mailto:"], header a[href="/#contact"], #mobile-nav a[href^="mailto:"], #mobile-nav a[href="/#contact"]').text(
    "Contact",
  );
  [desktopNavigation, $("#mobile-nav").first()].forEach((navigation) => {
    ["/", "/practice", "/services", "/approach"].forEach((href) => {
      const link = navigation.find(`a[href="${href}"]`).first();
      if (link.length) navigation.append(link);
    });
    const contactLink = navigation
      .find('a[href^="mailto:"], a[href="/#contact"]')
      .first();
    if (contactLink.length) navigation.append(contactLink);
  });
  $('footer a[href="/services"]').text("Our Services");
  $("footer .footer-top > .brand").remove();
  $('img[src="/site-assets/revision/axiomotl-logo-cropped.png"]').attr({
    width: "446",
    height: "349",
  });
  if (page.path === "/") {
    const transition = $("#sectors [data-industry-card]").last();
    transition.find("h3").text("Operational Transition");
    transition.find("p").first().text("Help teams take ownership of change. Clarify responsibilities, check readiness and prepare practical training, support and handover materials so new ways of working hold up in everyday operations.");
    transition.find("li").text("Project delivery → Business as usual");
    $('img[src*="design-supplied-"]').attr(
      "src",
      "/site-assets/combined/stages/Design.png",
    );
    $(".circuit-eyebrow").html(
      "<span></span> SCIENTIFIC. REGULATED. OPERATIONAL.",
    );
    $("img[data-work-image]").attr(
      "src",
      "/site-assets/revision/work/Hero-implement-solid.png",
    );
    $("[data-work-image-link]").attr(
      "href",
      "/site-assets/revision/work/Hero-implement-solid.png",
    );
    const workingIcons = ["analyse", "process", "implement"] as const;
    $("#method .method-steps > li").each((index, item) => {
      const number = $(item).find(".engagement-number").remove().text();
      $(item).find("h3").prepend(`${number}. `);
      $(item).prepend(approvedIcon(workingIcons[index], "working-icon"));
    });
    const stageIcons = ["analyse", "design", "implement", "transition", "sustain"] as const;
    $(".circuit-tiles .circuit-tile img").each((index, image) => {
      $(image).replaceWith(approvedIcon(stageIcons[index], "circuit-approved-icon"));
    });
    const industryIcons = ["governance", "decisions", "sustain"] as const;
    $("#sectors [data-industry-card] .industry-icon").each((index, icon) => {
      $(icon).replaceWith(approvedIcon(industryIcons[index], "industry-icon"));
    });
    $(".analysis-examples").attr("hidden", "").before(`
      <section class="home-credibility section" aria-labelledby="credibility-title">
        <div class="container home-credibility-grid">
          <div>
            <p class="eyebrow">Founder-led advisory</p>
            <h2 id="credibility-title">Led by Dr Ramzi Abbassi.</h2>
            <p>Ramzi brings scientific research, laboratory digitalisation and enterprise business analysis experience to work where evidence, regulation and operations must align.</p>
            <a class="text-link" href="/practice">Review the published background <span aria-hidden="true">→</span></a>
          </div>
          <div class="home-credentials" aria-label="Professional credentials and published experience">
            <p><strong>BMedSc (Hons)</strong><strong>PhD</strong><strong>CCBA</strong></p>
            <p>A published interview records experience at the University of Sydney, UNSW, the University of Oxford, Children’s Cancer Institute Australia and eLabNext.</p>
          </div>
        </div>
      </section>
    `);
    $(".analysis-example img").removeAttr("loading");
    const contact = $("[data-contact-form]").first();
    contact
      .find(".contact-form-note")
      .html(
        'Nothing is submitted automatically. This button opens a prepared email in your own email app for you to review and send. If it does not open, email <a href="mailto:hello@axiomotl.com.au">hello@axiomotl.com.au</a>.',
      );
    contact
      .find("[data-contact-submit]")
      .text("Prepare email draft")
      .attr("aria-describedby", "contact-email-behaviour");
    contact.find(".contact-form-note").attr("id", "contact-email-behaviour");
  }
  if (page.path === "/practice") {
    const practiceHero = $("main > .practice-intro").first();
    const practiceHeroCopy = practiceHero.find(".practice-wrap").first();
    practiceHero.addClass("shared-service-hero");
    practiceHeroCopy.addClass("shared-service-hero-grid");
    practiceHeroCopy.children().wrapAll('<div class="shared-service-hero-copy"></div>');
    practiceHeroCopy.find(".practice-breadcrumb").after(approvedIcon("governance", "mobile-page-icon"));
    practiceHeroCopy.find(".shared-service-hero-copy").append(`
      <a class="shared-hero-link" href="/approach">Explore our approach <svg aria-hidden="true"><use href="#arrow"></use></svg></a>
      <ul class="shared-hero-proof" aria-label="Our practice strengths">
        <li>${approvedIcon("analyse")}<span>Evidence-led<br />analysis</span></li>
        <li>${approvedIcon("governance")}<span>Senior, direct<br />advice</span></li>
        <li>${approvedIcon("outcomes")}<span>Workable<br />outcomes</span></li>
      </ul>
    `);
    practiceHeroCopy.append(`
      <figure class="svc-hero-visual shared-service-hero-visual">
        <img src="/site-assets/advisory/elements/practice-working-table.png" width="1536" height="1024" alt="Working table with notes arranged into a process map" />
        <figcaption><span>Evidence connected.<br />Ownership clarified.<br />Change made workable.</span><svg aria-hidden="true"><use href="#arrow"></use></svg></figcaption>
      </figure>
    `);
    $(".governance-visual").replaceWith(`
      <aside class="founder-profile-panel" aria-label="Dr Ramzi Abbassi credentials">
        <p class="eyebrow">Founder &amp; principal advisor</p>
        <h3>Dr Ramzi Abbassi</h3>
        <p class="founder-credentials"><strong>BMedSc (Hons)</strong><strong>PhD</strong><strong>CCBA</strong></p>
        <p>Scientific research, laboratory digitalisation and senior business analysis experience across complex, regulated environments.</p>
        <a class="text-link" href="#ramzi">Professional background <span aria-hidden="true">↓</span></a>
      </aside>
    `);
    $("#about h2").first().before(approvedIcon("analyse", "practice-icon"));
    const practiceIcons = ["pattern", "governance", "transition"] as const;
    $(".practice-columns article").each((index, article) => {
      if ($(article).find(".practice-icon").length) return;
      $(article).prepend(approvedIcon(practiceIcons[index % practiceIcons.length], "practice-icon"));
    });
  }
  if (page.path === "/approach") {
    $("main").addClass("approach-redesign");
    const together = $("#together-heading").closest("section");
    const mobileCopy = [
      "You bring the context. Together, we agree the questions, people and outputs.",
      "These stages guide the work, without prescribing a fixed programme. An engagement may focus on a diagnostic, decision or handover.",
      "Review findings with those affected. Keep assumptions visible, record decisions and leave material the team can use.",
    ];
    together.find(".svc-summary, .svc-columns p").each((index, element) => {
      const paragraph = $(element);
      paragraph.wrapInner('<span class="approach-desktop-copy"></span>');
      paragraph.append($("<span>").addClass("approach-mobile-copy").text(mobileCopy[index]));
    });
    const analysis = $("#analyse");
    analysis.find("h2").first().text("Understand the problem.");
    analysis.find(".svc-note").first().text("What is happening, and why?");
    analysis.find(".svc-summary").first().text("Bring people and evidence together to clarify the problem.");
    analysis.find(".svc-columns > div").first().find("p").first().text("Map the current process, test assumptions and identify gaps in information, controls and ownership.");
    analysis.find(".svc-outputs p").first().text("A shared problem statement, current-state view and priority questions.");
    const implementation = $("#decide");
    implementation.attr({
      id: "implement",
      "aria-labelledby": "implement-heading",
    });
    implementation.find(".svc-eyebrow").first().text("03 / Implement");
    implementation
      .find("h2")
      .first()
      .attr("id", "implement-heading")
      .text("Put the plan into action.");
    implementation
      .find(".svc-note")
      .first()
      .text("Who owns the work, and what must be ready?");
    implementation
      .find(".svc-summary")
      .first()
      .text(
        "Turn the chosen direction into coordinated delivery.",
      );
    const columns = implementation.find(".svc-columns");
    columns
      .children()
      .first()
      .find("p")
      .first()
      .text(
        "Sequence tasks, confirm owners and check dependencies and readiness.",
      );
    columns
      .find(".svc-outputs p")
      .first()
      .text(
        "A delivery plan with owners, dependencies and clear next steps.",
      );
    $('a[href="#decide"]')
      .attr("href", "#implement")
      .find("span")
      .first()
      .html("Implement<small>Put the plan into action.</small>");
  }
  $("h1, h2").each((_, heading) => {
    let lastText: Text | undefined;
    const visit = (node: AnyNode) => {
      if (node.type === "text" && /\S/.test(node.data)) lastText = node;
      if ("children" in node) for (const child of node.children) visit(child);
    };
    visit(heading);
    if (!lastText) return;
    if ($(lastText).parents(".heading-accent").length) return;
    const match = /(\S+)(\s*)$/.exec(lastText.data);
    if (!match) return;
    const prefix = $("<span>").text(lastText.data.slice(0, match.index)).html();
    const accent = $("<span>").addClass("heading-accent").text(match[1]);
    const suffix = $("<span>").text(match[2]).html();
    $(lastText).replaceWith(`${prefix}${accent.toString()}${suffix}`);
  });
  if (scrollPages.has(page.path)) {
    $("main").addClass("scroll-stack-page");
    $("main > section")
      .slice(1)
      .not(".practice-reference-hero")
      .addClass("scroll-stack-card");
  }
  if (page.path === "/approach") {
    const hero = $("main > .svc-intro").first();
    const grid = hero.find(".svc-intro-grid").first();
    const index = grid.find(".svc-index").first();
    const diagram = $(".approach-diagram").first();
    const stages = ["analyse", "design", "implement", "transition", "sustain"];
    const stageImages = ["Analyse", "Design", "Implement", "Transition", "Sustain"];
    grid.children("div").first().prepend(approvedIcon("process", "mobile-page-icon"));

    hero.attr("data-approach-layout", "");
    hero.addClass("shared-service-hero");
    grid.addClass("shared-service-hero-grid");
    diagram.addClass("approach-hero-visual svc-hero-visual shared-service-hero-visual");
    diagram.find("img").attr({
      src: "/site-assets/revision/approach/Axotol.svg",
      alt: "RSMS Pattern Transformation: from BAU fragility to scale-ready stability, illustrated with an axolotl mascot.",
      width: "3384",
      height: "2600",
      loading: "eager",
      fetchpriority: "high",
      "data-approach-image": "",
    }).wrap('<a data-approach-image-link href="/site-assets/revision/approach/Axotol.svg" target="_blank" rel="noopener noreferrer" aria-label="View selected stage image at full size (new tab)"></a>');
    diagram.find("[data-approach-image-link]").append('<span class="approach-image-zoom">View image at full size <span aria-hidden="true">↗</span></span>');
    diagram.find("figcaption").text("From BAU fragility to scale-ready stability.");
    index.replaceWith(diagram);
    hero.find(".svc-button span[aria-hidden]").replaceWith('<svg aria-hidden="true"><use href="#arrow"></use></svg>');
    hero.find(".svc-button").after('<a class="shared-hero-link" href="/services">Explore our services <svg aria-hidden="true"><use href="#arrow"></use></svg></a>');
    grid.children("div").first().append(`
      <ul class="shared-hero-proof" aria-label="Our approach strengths">
        <li>${approvedIcon("analyse")}<span>Start with<br />evidence</span></li>
        <li>${approvedIcon("decisions")}<span>Make decisions<br />explicit</span></li>
        <li>${approvedIcon("governance")}<span>Prepare<br />ownership</span></li>
      </ul>
    `);

    const explorer = $("<div>").addClass("svc-wrap approach-explorer").attr("data-approach-explorer", "");
    explorer.append(
      '<p class="approach-explorer-intro">A structured, end-to-end approach to help you create lasting impact.</p>',
    );
    const stageDescriptions = [
      "Understand your context, challenges and opportunities.",
      "Co-create tailored solutions that fit your goals.",
      "Turn plans into action with focused delivery and support.",
      "Enable change, build capability and ensure a smooth handover.",
      "Track progress, realise value and support long-term success.",
    ];
    const tabs = $("<div>")
      .addClass("approach-stage-tabs")
      .attr("role", "tablist")
      .attr("aria-label", "Approach stages");
    const panels = $("<div>").addClass("approach-stage-previews");

    stages.forEach((stage, position) => {
      const stageName = stage[0].toUpperCase() + stage.slice(1);
      const section = $(`#${stage}`);
      const title = section.find("h2").first().text().trim();
      const tabId = `approach-tab-${stage}`;
      const panelId = `approach-preview-${stage}`;
      const tab = $("<button>")
        .attr({
          id: tabId,
          type: "button",
          role: "tab",
          "aria-label": stageName,
          "aria-selected": position === 0 ? "true" : "false",
          "aria-controls": panelId,
          tabindex: position === 0 ? "0" : "-1",
          "data-approach-tab": stage,
          "data-approach-image-src": `/site-assets/revision/approach/${stageImages[position]}.svg`,
          "data-approach-image-alt": `${stageName}: ${title}`,
        })
        .append(approvedIcon(stage as keyof typeof approvedIcons, "approach-card-icon"))
        .append(`<span class="approach-card-number" aria-hidden="true">0${position + 1}</span>`)
        .append($("<span>").addClass("approach-card-name").text(stageName))
        .append($("<span>").addClass("approach-card-description").text(stageDescriptions[position]))
        .append('<span class="approach-card-action" aria-hidden="true">Explore <span class="approach-card-arrow"><svg><use href="#arrow"></use></svg></span></span>');
      const panel = $("<article>")
        .attr({
          id: panelId,
          role: "tabpanel",
          "aria-labelledby": tabId,
          "data-approach-preview": stage,
        })
        .toggleClass("is-active", position === 0);
      if (position !== 0) panel.attr("hidden", "");
      const imagePath = `/site-assets/revision/approach/${stageImages[position]}.svg`;
      panel.append($('<a target="_blank" rel="noopener noreferrer">').attr("href", imagePath)
        .append($("<img>").attr({ src: imagePath, alt: `${stageName}: ${title}`, loading: "lazy" }))
        .append('<span class="approach-image-zoom">View image at full size <span aria-hidden="true">↗</span></span>'));
      tabs.append(tab);
      panels.append(panel);
    });
    explorer.append(tabs, panels);
    const approachBanner = $('<div class="approach-mobile-banner">Our Approach</div>');
    const heroProof = grid.children("div").first().children(".shared-hero-proof").remove();
    const principles = $(`
      <div class="svc-wrap approach-principles" aria-label="How the approach works">
        <article>${approvedIcon("analyse")}<h3>Start with evidence</h3><p>Understand the work as it happens today.</p></article>
        <article>${approvedIcon("decisions")}<h3>Make options explicit</h3><p>Connect requirements, trade-offs and decisions.</p></article>
        <article>${approvedIcon("governance")}<h3>Prepare ownership</h3><p>Name the people responsible for the next step.</p></article>
        <article>${approvedIcon("assurance")}<h3>Review in use</h3><p>Test whether the change works in everyday operations.</p></article>
      </div>
    `);
    hero.after(approachBanner);
    approachBanner.after(heroProof);
    heroProof.after(explorer);
    explorer.after(principles);
    $("main > section").slice(1).not(".svc-next").each((_, element) => {
      const card = $(element);
      const stage = card.attr("id") || "together";
      const imageTarget = stage === "together"
        ? "#approach-governance-diagram"
        : `#approach-preview-${stage}`;
      card.addClass("approach-sticky-card").attr({
        "data-approach-card": stage,
        tabindex: "0",
      });
      card.find("h2").first().wrapInner(
        `<a href="${imageTarget}" data-approach-card-image="${stage}"></a>`,
      );
    });
  }
  if (page.path === "/services") {
    $("main").addClass("services-redesign");
    for (const id of ["diagnostic", "decisions", "transition", "embedded"]) {
      const source = servicesSource(`#${id}`);
      const target = $(`#${id}`);
      for (const selector of [".svc-title h2", ".svc-eyebrow", ".svc-summary", ".svc-columns"]) {
        target.find(selector).first().html(source.find(selector).first().html()!);
      }
      const overview = servicesSource(`#overview-${id}`);
      $(`.svc-index a[href="#${id}"] > span`).first()
        .text(overview.find("h3").text().trim())
        .append($("<small>").addClass("svc-choice-summary").text(overview.find("p").text().replace(/\s+/g, " ").trim()));
    }
    const servicesMain = $("[data-service-selector]");
    const servicesHero = servicesMain.children(".svc-intro").first();
    const heroGrid = servicesHero.find(".svc-intro-grid").first();
    const heroCopy = heroGrid.children("div").first();
    heroCopy.prepend(approvedIcon("governance", "mobile-page-icon"));
    const serviceDirectory = heroGrid.find(".svc-index").first();

    heroCopy.find(".svc-breadcrumb").remove();
    heroCopy.find("h1").html(servicesSource(".page-hero h1").html()!);
    heroCopy.find(".svc-lead").text(servicesSource(".page-hero .svc-lead").text());
    heroCopy
      .find(".svc-button")
      .after(
        '<a class="svc-hero-link" href="/approach">Explore our approach <svg aria-hidden="true"><use href="#arrow"></use></svg></a>',
      );
    heroCopy
      .find(".svc-button span[aria-hidden]")
      .replaceWith('<svg aria-hidden="true"><use href="#arrow"></use></svg>');
    heroCopy.append(`
      <ul class="svc-proof" aria-label="Why work with Axiomotl">
        <li>${approvedIcon("governance")}<span>Work with<br />experienced analysts</span></li>
        <li>${approvedIcon("decisions")}<span>Independent<br />and objective</span></li>
        <li>${approvedIcon("outcomes")}<span>Practical outcomes<br />you can use</span></li>
      </ul>
    `);
    heroGrid.append(`
      <figure class="svc-hero-visual">
        <img src="/site-assets/advisory/elements/scientific-services.png" width="1536" height="1024" alt="Scientific workspace with a microscope, laptop and process diagram" />
        <figcaption><span>Better questions.<br />Smarter decisions.<br />Stronger outcomes.</span><svg aria-hidden="true"><use href="#arrow"></use></svg></figcaption>
      </figure>
    `);

    serviceDirectory.attr("data-service-directory", "");
    const directoryTitle = serviceDirectory.find(".svc-index-title").first();
    directoryTitle.wrap('<div class="svc-directory-heading"></div>');
    directoryTitle
      .parent()
      .append(
        $("<p>").text(servicesSource("#services > .svc-summary").text()),
      );
    const serviceIcons = ["patternDetailed", "processAnalysis", "transition", "governance"] as const;
    serviceDirectory.find("a").each((index, link) => {
      $(link).prepend(approvedIcon(serviceIcons[index], "svc-card-icon"));
      $(link)
        .children("span:last-child")
        .html('<svg aria-hidden="true"><use href="#arrow"></use></svg>')
        .before('<span class="svc-learn">Learn more</span>');
    });
    serviceDirectory.wrap(
      '<section class="svc-directory-section scroll-stack-card" aria-labelledby="services-directory-title"><div class="svc-wrap"></div></section>',
    );
    directoryTitle.attr("id", "services-directory-title");
    const directorySection = serviceDirectory.closest(".svc-directory-section");
    directorySection.addClass("services-reference-panel");
    directorySection.find(".svc-wrap").prepend(directoryTitle.parent());
    servicesHero.after(directorySection);
    directorySection.before('<div class="mobile-services-heading section-stack-heading">Our Services</div>');

    const detailIcons = ["analyse", "process", "assurance"] as const;
    servicesMain.find("[data-service-panel]").each((_, panel) => {
      const title = $(panel).find(".svc-title").first();
      const summary = $(panel).find(".svc-summary").first();
      title.find("h2").after(summary);
      const columns = $(panel).find(".svc-columns").first();
      const firstColumn = columns.children("div").first();
      const outputs = columns.children(".svc-outputs").first();
      const involvementHeading = firstColumn.find("h3").eq(1);
      const involvementCopy = involvementHeading.next("p");
      const involvement = $('<div class="svc-work-column"></div>');
      involvement.append(involvementHeading, involvementCopy);
      outputs.before(involvement);
      [firstColumn, involvement, outputs].forEach((column, index) => {
        column.prepend(approvedIcon(detailIcons[index], "svc-detail-icon"));
      });
    });
    const serviceTitleIcons = ["patternDetailed", "decisions", "transition", "governance"] as const;
    servicesMain.find("[data-service-panel] .svc-title > img").each((index, image) => {
      $(image).replaceWith(approvedIcon(serviceTitleIcons[index], "svc-title-approved-icon"));
    });
    servicesMain
      .find("#diagnostic .svc-text-link")
      .after(
        '<a class="svc-example-link" href="/site-assets/combined/rsms/process-map-large.webp" target="_blank" rel="noopener noreferrer">See an example report <svg aria-hidden="true"><use href="#arrow"></use></svg></a>',
      );
    servicesMain
      .find(".svc-text-link span[aria-hidden]")
      .replaceWith('<svg aria-hidden="true"><use href="#arrow"></use></svg>');

    const lastService = servicesMain.find("[data-service-panel]").last();
    lastService.after(`
      <section class="svc-process scroll-stack-card" aria-labelledby="services-process-title">
        <div class="svc-wrap">
          <div class="svc-process-heading">
            <h2 id="services-process-title">From problem to <span class="heading-accent">progress.</span></h2>
            <p>A clear, collaborative process that turns complex challenges into practical solutions.</p>
          </div>
          <ol>
            <li>${approvedIcon("governance", "svc-process-icon")}<span><b>Explore</b>Understand your goals and challenges</span><svg class="svc-process-arrow" aria-hidden="true"><use href="#arrow"></use></svg></li>
            <li>${approvedIcon("process", "svc-process-icon")}<span><b>Analyse</b>Gather and assess information</span><svg class="svc-process-arrow" aria-hidden="true"><use href="#arrow"></use></svg></li>
            <li>${approvedIcon("design", "svc-process-icon")}<span><b>Recommend</b>Provide clear options and guidance</span><svg class="svc-process-arrow" aria-hidden="true"><use href="#arrow"></use></svg></li>
            <li>${approvedIcon("outcomes", "svc-process-icon")}<span><b>Implement</b>Support your team to make it happen</span></li>
          </ol>
        </div>
      </section>
      <section class="svc-next scroll-stack-card" aria-labelledby="services-next-title">
        <div class="svc-wrap svc-next-grid">
          <div><h2 id="services-next-title">Ready to move <span class="heading-accent">forward?</span></h2><p>Tell us about your challenge and we’ll help you find the right way forward.</p></div>
          <a class="svc-button" href="mailto:hello@axiomotl.com.au">Get in touch <svg aria-hidden="true"><use href="#arrow"></use></svg></a>
        </div>
      </section>
    `);
    const footerTop = $("footer .footer-top").first();
    servicesMain.find(".svc-next").html(servicesSource(".svc-next").html()!)
      .attr("aria-labelledby", "next-heading");
    servicesMain.find("em").each((_, element) => {
      $(element).replaceWith($("<span>").addClass("heading-accent").text($(element).text()));
    });
    const footerEmail = footerTop.find(".footer-email").first();
    footerEmail.wrap('<div class="svc-footer-social"></div>');
    footerEmail.before(
      '<a href="https://www.linkedin.com/company/axiomotl-advisory/" target="_blank" rel="noopener noreferrer">LinkedIn</a>',
    );
  }
  $("footer nav a").each((_, link) => {
    if ($(link).text().trim().toLowerCase() === "about") {
      $(link).text("Our Practice");
    }
  });
  if (page.path === "/practice") {
    $("main").addClass("practice-redesign");
    const mobilePracticeCards: Record<number, string> = {
      1: '<h2>Clear evidence.<br />Workable <span class="heading-accent">change.</span></h2><p>Senior-led advice to understand the problem, clarify decisions and prepare teams for everyday ownership.</p><p>Leave with usable evidence, clear responsibilities and practical handover materials.</p>',
      2: '<p class="practice-kicker">Founder &amp; principal advisor</p><h2>Meet Dr Ramzi <span class="heading-accent">Abbassi.</span></h2><p>Scientific research, laboratory digitalisation and enterprise business analysis experience, brought together to support governance and operational handover.</p><a class="practice-link" href="#ramzi">Professional background →</a>',
      3: '<h2>Scientific understanding.<br />Operational <span class="heading-accent">perspective.</span></h2><p class="practice-credentials">Dr Ramzi Abbassi<br />BMedSc (Hons), PhD, CCBA</p><p>Ramzi connects the perspectives of researchers, operational teams and software providers—from requirements through to rollout and handover.</p><a class="practice-link" href="https://www.scisure.com/blog/client-to-team-member-ramzi-abbassi-phd">Read his professional background ↗</a>',
      4: '<h2>Where experience <span class="heading-accent">matters.</span></h2><h3>Research &amp; regulated systems</h3><p>Clear requirements, ownership and controls.</p><h3>Technology &amp; vendor decisions</h3><p>Compare options against user needs and delivery constraints.</p><h3>Operational transition</h3><p>Prepare readiness, training, support and handover.</p>',
      8: '<h2>Published <span class="heading-accent">perspectives.</span></h2><div class="practice-reading-list"><a href="https://www.scisure.com/blog/implement-scientific-management-platforms-at-scale"><span>Implementation &amp; governance</span><small>SciSure · August 2026 ↗</small></a><a href="https://www.scisure.com/blog/client-to-team-member-ramzi-abbassi-phd"><span>Research to digitalisation</span><small>Professional interview · February 2024 ↗</small></a><a href="https://www.scisure.com/blog/digital-era-research-operations-management"><span>Digital research operations</span><small>SciSure · July 2023 ↗</small></a></div>',
      9: '<h2>Start a <span class="heading-accent">conversation.</span></h2><p>Tell us what is getting complicated and what needs to happen next.</p><a class="practice-button" href="mailto:hello@axiomotl.com.au">Email Axiomotl →</a>',
    };
    $("main > section")
      .slice(1)
      .not(".practice-reference-hero")
      .each((index, section) => {
        $(section).attr("data-practice-chapter", String(index + 1));
        const mobileContent = mobilePracticeCards[index + 1];
        if (mobileContent) {
          $(section).children().addClass("practice-desktop-content");
          $(section).append(`<div class="practice-mobile-content">${mobileContent}</div>`);
        }
      });
    $("main > .practice-intro").after('<div class="mobile-practice-heading section-stack-heading">Our Practice</div>');
  }
  if (page.path === "/approach") {
    $("main > .svc-intro").after('<div class="section-stack-heading">Our Approach</div>');
  }
  $("main > section:first-child .shared-service-hero-copy, main > section:first-child .svc-intro-grid > div:first-child").each((_, copy) => {
    $(copy).children(".practice-button, .svc-button, .shared-hero-link, .svc-hero-link")
      .wrapAll('<div class="hero-actions"></div>');
  });
  $("a[href]").each((_, element) => {
    const link = $(element);
    const label = link.text().replace(/[^a-z\s]/gi, "").trim().toLowerCase();
    if (["contact", "get in touch"].includes(label)) {
      link.attr("href", "/#contact").removeAttr("target data-site-email");
    }
  });
  if (page.path === "/services") {
    $("[data-service-panel] .svc-columns").each((_, columns) => {
      $(columns).wrap('<details class="svc-more"></details>');
      $(columns).before('<summary>Service details and deliverables</summary>');
    });
  }
  if (page.path === "/approach") {
    page.description = "How Axiomotl works with your team: analyse the situation, design practical options, implement the change, prepare for transition and sustain progress.";
  }
  const directionContract =
    page.path === "/services"
      ? `<!--
THESIS: Make expert advisory tangible through a clear path from problem to progress; reject the generic text-only services list.
OWN-WORLD: Bright white canvas, Axiomotl plum and teal, authored scientific photography, crisp iconography, fine lavender rules and restrained elevation.
STORY: Visitors recognise their challenge, compare four support models, inspect the selected service, understand the process and start a conversation.
FIRST VIEWPORT: Split hero with oversized two-line title and proof points at left, scientific process image and purple outcome panel at right, primary action above the fold.
FORM: Approved supplied Services composition, reproduced directly from the user reference; seed key user-supplied-services-comp-2026-09-28.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
-->`
      : "";
  page.html = directionContract + $.html();
  page.css = page.css.replaceAll(/#191729/gi, "#481e72");
  page.css += `\n${css}`;
}
await writeFile(
  new URL("../src/generated/revision.json", import.meta.url),
  JSON.stringify(validateDocument(document), null, 2) + "\n",
);
console.log("Built client revisions. Preview at /revision-preview.");
