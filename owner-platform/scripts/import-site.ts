import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import { load } from "cheerio";
import type { FormDefinition, Question, SiteDocument } from "../src/lib/types";

const source = readFileSync("../reference/production-2026-09-16.html", "utf8");
mkdirSync("public/site-assets", { recursive: true });
mkdirSync("public/runtime", { recursive: true });
mkdirSync("src/generated", { recursive: true });
let assets = 0;
const html = source.replace(
  /data:([^;,\s]+);base64,([A-Za-z0-9+/=]+)/g,
  (_, mime: string, encoded: string) => {
    const data = Buffer.from(encoded, "base64");
    const extension = (
      {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/svg+xml": "svg",
        "font/ttf": "ttf",
        "font/woff2": "woff2",
      } as Record<string, string>
    )[mime];
    if (!extension) throw new Error(`Unsupported embedded asset type ${mime}`);
    const name = `${createHash("sha256").update(data).digest("hex").slice(0, 20)}.${extension}`;
    writeFileSync(`public/site-assets/${name}`, data);
    assets++;
    return `/site-assets/${name}`;
  },
);
const $ = load(html);
const scripts = $("script")
  .toArray()
  .map((el) => $(el).html() || "");
const declaration = scripts[1].slice(
  scripts[1].indexOf("const challenges"),
  scripts[1].indexOf("const dialog"),
);
const original = runInNewContext(
  `${declaration}; ({challenges,contextQuestions,workingStyles,services})`,
  Object.create(null),
  { timeout: 1000 },
) as {
  challenges: string[];
  contextQuestions: { title: string; options: string[] }[];
  workingStyles: string[];
  services: { name: string; reason: string; outputs: string[] }[];
};
const serviceIds = ["diagnostic", "decisions", "transition", "embedded"];
const journey: FormDefinition = {
  id: "journey",
  name: "Find your starting point",
  startQuestionId: "challenge",
  email: "hello@axiomotl.com.au",
  emailSubject: "A conversation about {outcome}",
  fallbackOutcomeId: "diagnostic",
  questions: [
    {
      id: "challenge",
      title: "Where is the work getting complicated?",
      choices: original.challenges.map((label, i) => ({
        id: serviceIds[i],
        label,
        next: { kind: "question", id: `context-${serviceIds[i]}` },
      })),
    },
    ...original.contextQuestions.map((q, i): Question => ({
      id: `context-${serviceIds[i]}`,
      title: q.title,
      choices: q.options.map((label, j) => ({
        id: `context-${i}-${j}`,
        label,
      })),
      next: { kind: "question", id: "working-style" },
    })),
    {
      id: "working-style",
      title: "How would you like to work together?",
      choices: original.workingStyles.map((label, i) => ({
        id: ["focused", "stages", "embedded", "together"][i],
        label,
      })),
    },
  ],
  outcomes: original.services.map((service, i) => ({
    id: serviceIds[i],
    title: service.name,
    body: service.reason,
    outputs: service.outputs,
    ctaLabel: "Start a conversation",
    ctaUrl: `mailto:hello@axiomotl.com.au?subject=${encodeURIComponent(service.name)}`,
  })),
  rules: [
    {
      id: "embedded-override",
      label: "Embedded support takes priority",
      fromQuestionId: "working-style",
      match: "all",
      conditions: [{ questionId: "working-style", answerId: "embedded" }],
      target: { kind: "outcome", id: "embedded" },
    },
    ...serviceIds.map((serviceId) => ({
      id: `recommend-${serviceId}`,
      label: `Recommend ${serviceId}`,
      fromQuestionId: "working-style",
      match: "all" as const,
      conditions: [{ questionId: "challenge", answerId: serviceId }],
      target: { kind: "outcome" as const, id: serviceId },
    })),
  ],
};
const fieldIds = [
  "decision-intent",
  "decision-option",
  "decision-priority",
  "decision-owner",
  "decision-action",
];
const decision: FormDefinition = {
  id: "decision",
  name: "Build a decision brief",
  startQuestionId: fieldIds[0],
  email: "hello@axiomotl.com.au",
  emailSubject: "My decision brief",
  fallbackOutcomeId: "brief",
  rules: [],
  questions: fieldIds.map((id, i): Question => ({
    id,
    title: $(`label[for="${id}"]`).text(),
    kind: id === "decision-priority" ? "choice" : "text",
    placeholder: $(`#${id}`).attr("placeholder"),
    choices: $(`#${id} option`)
      .toArray()
      .map((el, j) => ({ id: `priority-${j}`, label: $(el).text() })),
    next:
      i < fieldIds.length - 1
        ? { kind: "question", id: fieldIds[i + 1] }
        : { kind: "outcome", id: "brief" },
  })),
  outcomes: [
    {
      id: "brief",
      title: "Your decision brief",
      body: $(".decision-result p").text(),
      outputs: [],
      ctaLabel: "Discuss your decision brief",
      ctaUrl: "mailto:hello@axiomotl.com.au",
    },
  ],
};

$("#decision-builder").replaceWith(
  '<div class="decision-builder" data-axiomotl-form="decision" data-gjs-name="Decision brief form"><p>Interactive decision brief — edit questions and outcomes in Forms.</p></div>',
);
$("#journey").remove();
$("[data-challenge]").each((_, el) => {
  const index = Number($(el).attr("data-challenge"));
  $(el).attr("data-journey-answer", serviceIds[index]);
  $(el).removeAttr("data-challenge");
});
$("script").remove();
const faviconData = $('link[rel="icon"]').attr("href") || "";
if (faviconData.startsWith("data:image/svg+xml,"))
  writeFileSync(
    "public/site-assets/favicon.svg",
    decodeURIComponent(faviconData.split(",").slice(1).join(",")),
  );

const baseline: SiteDocument = {
  schemaVersion: 1,
  settings: {
    name: "Axiomotl Advisory",
    email: "hello@axiomotl.com.au",
    favicon: "/site-assets/favicon.svg",
    logo: $(".brand img").first().attr("src") || "",
    font: "Nunito",
    background: "#ffffff",
    foreground: "#000000",
    accent: "#031925",
    customCss: "",
    motion: true,
  },
  pages: [
    {
      id: "home",
      path: "/",
      title: $("title").text(),
      description: $('meta[name="description"]').attr("content") || "",
      socialImage: "",
      noIndex: false,
      html: $("body").html() || "",
      css: $("style")
        .toArray()
        .map((el) => $(el).html())
        .join("\n"),
      project: null,
    },
  ],
  forms: [journey, decision],
};
writeFileSync("src/generated/baseline.json", JSON.stringify(baseline, null, 2));
writeFileSync("public/runtime/gsap.js", scripts[0]);
// Keep the audited production animations. Missing sections must remain removable in the editor.
const wave = scripts[3].replace(
  "const context = canvas.getContext",
  "if (!hero || !visual || !canvas) return;\n  const context = canvas.getContext",
);
const connection = scripts[4]
  .replace(
    "let current = 0;",
    "if (!visual || !tabs.length) return;\n  let current = 0;",
  )
  .replace(
    'document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;',
    'const panel = document.getElementById(tab.getAttribute("aria-controls")); if (panel) panel.hidden = !selected;',
  );
const micro = scripts[5].replace(
  'methodObserver.observe(document.querySelector(".method-tiles"));',
  'const methodTiles = document.querySelector(".method-tiles"); if (methodTiles) methodObserver.observe(methodTiles);',
);
writeFileSync("public/runtime/site.js", [wave, connection, micro].join("\n"));
console.log(
  `Imported production page, ${assets} embedded asset references and two editable forms.`,
);
