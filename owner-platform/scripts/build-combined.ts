import { readFile, writeFile } from "node:fs/promises";
import { load } from "cheerio";
import { validateDocument } from "../src/lib/render";
import type { SiteDocument } from "../src/lib/types";

const source = new URL("../design/combined/", import.meta.url);
const read = (name: string) => readFile(new URL(name, source), "utf8");
const $ = load(await read("reference.html"));
const live = load(await read("vercel.html"));
const config = JSON.parse(live("#axiomotl-config").text());
$("script, noscript, iframe").remove();
$("*")
  .contents()
  .each((_, node) => {
    if (node.type === "comment") $(node).remove();
  });
$(".site-header").attr("id", "top");
$(".hero").replaceWith(await read("hero.html"));
$(".challenge-visual").replaceWith(
  `<figure class="governance-visual"><a href="/site-assets/combined/rsms/governance-model-large.webp" target="_blank" rel="noopener" aria-label="Open the governance model at full size (new tab)"><img src="/site-assets/combined/rsms/governance-model.webp" srcset="/site-assets/combined/rsms/governance-model.webp 961w, /site-assets/combined/rsms/governance-model-large.webp 1921w" sizes="(max-width: 900px) 90vw, 45vw" width="961" height="607" alt="Governance foundations and operational capability: decision ownership, a single source of truth, governed exceptions and transferable assets connected to consistent pathways and standards." loading="lazy"><span>View full-size diagram ↗</span></a><figcaption>Governance and operational capability, connected.<small>Diagram excerpt from the RSMS readiness presentation by Dr. Ramzi Abbassi, April 2026.</small></figcaption></figure>`,
);
$(".motion-toggle, .sector-strip, .summit-note").remove();
$(".nav nav").attr("class", "desktop-nav");
$(".nav nav a[href='#top']").remove();
$(".nav nav a[href='#about']").text("Our practice");
$(".nav nav a[href='#sectors']").remove();
$(".nav nav a[href='#method']").text("Our approach");
$(".nav nav").append('<a href="#decision-brief">Decision brief</a>');
$(".nav nav").append('<a href="#philosophy">Philosophy</a>');
$(".philosophy").attr("id", "philosophy");
$(".desktop-nav a[href='#contact']").remove();
$(".menu-toggle").attr({
  id: "menu-toggle",
  "aria-controls": "mobile-nav",
  type: "button",
});
$(".site-header").append(
  `<nav id="mobile-nav" hidden aria-label="Mobile navigation">${$(".desktop-nav").html()}<a href="#contact">Get in touch</a></nav>`,
);

// Native disclosures keep the reference content usable without a second script.
for (const [toggle, panel] of [
  ["challenges-toggle", "challenge-details"],
  ["approach-toggle", "approach-details"],
  ["sectors-toggle", "sector-details"],
]) {
  const button = $(`#${toggle}`);
  const content = $(`#${panel}`);
  const label = button.text();
  const inner = content.html();
  button.replaceWith(
    `<details class="reading-details"><summary>${label}<span aria-hidden="true"> +</span></summary><div class="reading-content">${inner}</div></details>`,
  );
  content.remove();
}

const challenge = $(".challenge").remove();
challenge.attr("id", "practice-context");
$("#services").before(await read("finder.html"));
$("#services").after(await read("brief.html"));
$("#method").after(await read("analysis-examples.html"));
$("#sectors").before(challenge);
$("#practice-context").attr("id", "about");
$("#about .eyebrow").text("The practice");
$("#about h2").html("Stay close to the work.");
$("#about > div:first-child > p:not(.eyebrow)").text(
  "A small, senior-led practice working with the people who run the service. We trace the handovers, test the requirements and ask who can make the decision. The work needs to hold up when the project team leaves.",
);

const ids = ["diagnostic", "decisions", "transition", "embedded"];
$(".service-card").each((index, node) => {
  const card = $(node);
  card.attr("id", ids[index]);
  card
    .find("summary")
    .attr(
      "aria-label",
      `Explore ${card.find("h3").text().replace(/\s+/g, " ")}`,
    );
  card
    .find(".service-detail ul")
    .html(
      config.forms[0].outcomes[index].outputs
        .map((item: string) => `<li>${item}</li>`)
        .join(""),
    );
});
$("#services .section-intro").text(
  "Commission a defined piece of work, or bring a principal business analyst into your team.",
);
$("#contact .button")
  .attr("href", "mailto:hello@axiomotl.com.au")
  .text("Email hello@axiomotl.com.au");
$(".site-header a[href='#contact'], #method a[href='#contact']").attr(
  "href",
  "mailto:hello@axiomotl.com.au",
);
$("#method h2").html("Working together");
$("#method .section-intro").text(
  "The scope depends on the problem. These are the things we agree along the way.",
);
$("#method .method-steps").html(
  `<li><span class="engagement-number">01</span><h3>Agree the focus</h3><p>Bring the context and the decision you need to make. Together, identify the questions, stakeholders and evidence that matter.</p></li><li><span class="engagement-number">02</span><h3>Work through the evidence</h3><p>Map how the work happens, test the options with your team and make responsibilities clear.</p></li><li><span class="engagement-number">03</span><h3>Leave a usable next step</h3><p>Translate decisions into practical actions, handovers and review points, with clear ownership.</p></li>`,
);
$(".service-icon").each((index, node) => {
  const icon = ["Analyse", "Decide", "Transition", "Design"][index];
  $(node).html(
    `<img src="/site-assets/combined/stages/${icon}.png" width="48" height="48" alt="">`,
  );
});
$(".brand").each((_, node) => {
  $(node).html(
    '<img data-site-logo src="/site-assets/combined/axiomotl-logo-master.png" alt="Axiomotl Advisory" width="1254" height="1254">',
  );
});
$(".footer-bottom").append(
  '<button type="button" id="site-motion" class="motion-control" aria-pressed="true">Motion on</button>',
);

$("#services h2").text("Four ways to work with us.");
const serviceCopy = [
  "Find where work stalls, controls fail or the same issue returns. Agree which causes to address first.",
  "Translate operational and regulatory needs into requirements, process maps and decisions that someone can own.",
  "Work out what must be ready before go-live: roles, support, training and the material the receiving team will need.",
  "An experienced business analyst alongside your team for stakeholder conversations, vendor evaluation and governance work.",
];
$(".service-card").each((i, node) => {
  $(node).children("p").text(serviceCopy[i]);
  $(node)
    .find("summary")
    .html('See the outputs <span aria-hidden="true">+</span>');
});
$("#sectors h2").text(
  "Research systems. Regulated work. Operational handover.",
);
$("#sectors .industry-layout > div:first-child > p:not(.eyebrow)").text(
  "Work that involves researchers, administrators, regulators and vendors, often with different requirements of the same system.",
);
$("#sectors .industry-grid svg").remove();
$("#sectors .industry-grid br").replaceWith(" ");
$("#sectors .reading-content small").text(
  "These areas describe practitioner background and capability.",
);
$(".philosophy-inner > div > p").text(
  "A handover should leave the receiving team knowing what they own, what they can decide and when to ask for help.",
);
$("#contact .eyebrow").text("Get in touch");
$("#contact h2").html("Tell us where<br>the work is stuck.");
$("#contact .contact-layout > div > p:not(.eyebrow)").text(
  "A few lines about the situation and the decision ahead are enough to start.",
);
$(
  "#contact .contact-email, #contact .contact-principles, #contact .contours",
).remove();

$("h1, h2, h3, h4, h5, h6").each((_, heading) => {
  const textNodes = $(heading)
    .find("*")
    .addBack()
    .contents()
    .filter((_, node) => node.type === "text" && /\S/.test(node.data));
  const last = textNodes.last();
  const text = last.text();
  const match = text.match(/\S+\s*$/);
  if (!match || match.index === undefined) return;
  const accent = $("<span>").addClass("heading-last-word").text(match[0]);
  last.replaceWith($("<span>").text(text.slice(0, match.index)).append(accent).contents());
});

$("#contact .contact-layout").append(await read("contact.html"));

const css = (await read("reference.css")).replaceAll(
  "url('advisory-workshop.webp')",
  "url('/site-assets/combined/advisory-workshop.webp')",
);
const document: SiteDocument = validateDocument({
  schemaVersion: 1,
  settings: {
    ...config.settings,
    font: "Lato",
    background: "#ffffff",
    foreground: "#2f2840",
    accent: "#481e72",
    customCss: "",
    logo: "/site-assets/combined/axiomotl-logo-master.png",
    favicon: "/site-assets/combined/axiomotl-logo-master.png",
  },
  forms: config.forms,
  pages: [
    {
      id: "home",
      path: "/",
      title: "Axiomotl Advisory | Turn complexity into clarity.",
      description:
        "Senior advisory connecting evidence, decisions and everyday operations. Explore business analysis, governance, decision architecture and operational transition.",
      socialImage: "/site-assets/combined/advisory-workshop.webp",
      noIndex: false,
      html: $("body").html(),
      css: `${css}\n${await read("combined.css")}\n${await read("hero.css")}\n${await read("reference-hero.css")}\n${await read("editorial.css")}\n${await read("workflow-hero.css")}\n${await read("contact.css")}\n${await read("layout.css")}`,
      project: null,
    },
  ],
});
await writeFile(
  new URL("../src/generated/combined.json", import.meta.url),
  JSON.stringify(document, null, 2) + "\n",
);
console.log(
  "Built and validated combined site document; existing publication unchanged.",
);
