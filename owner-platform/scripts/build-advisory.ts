import { readFile, writeFile } from "node:fs/promises";
import { load } from "cheerio";
import { validateDocument } from "../src/lib/render";

const source = new URL("../design/advisory/", import.meta.url);
const read = (name: string) => readFile(new URL(name, source), "utf8");
const home = await read("index.html");
const css = `${await read("styles.css")}\n${await read("home-desktop.css")}\n${await read("mobile-refinements.css")}\n${await read("mobile-menu.css")}\n${await read("ramzi-mobile.css")}`;
function innerPage(content: string, path: string) {
  const $ = load(home, null, false);
  $("main").html(content).addClass("detail-page");
  if (path === "/practice") $("main").addClass("practice-detail");
  $("a.active").removeClass("active");
  $("nav a").each((_, element) => {
    if ($(element).attr("href") === path) {
      $(element).addClass("active").attr("aria-current", "page");
    }
  });
  $("a[href^='#']").each((_, element) => {
    const href = $(element).attr("href")!;
    if (href !== "#main" && !$(href).length)
      $(element).attr("href", `/${href}`);
  });
  return $.html();
}
const previous = load(
  await readFile(
    new URL("../design/combined/vercel.html", import.meta.url),
    "utf8",
  ),
);
const config = JSON.parse(previous("#axiomotl-config").text());
// Match the approved first screen, retaining the existing choice IDs and routes.
const openingQuestion = config.forms
  .find((form: { id: string }) => form.id === "journey")
  ?.questions.find((question: { id: string }) => question.id === "challenge");
if (openingQuestion) {
  openingQuestion.title = "Where you need support?";
  openingQuestion.choices.find(
    (choice: { id: string }) => choice.id === "diagnostic",
  ).label = "Understanding what is really happening";
  openingQuestion.choices.find(
    (choice: { id: string }) => choice.id === "transition",
  ).label = "Preparing for everyday operations";
}
for (const outcome of config.forms.find(
  (form: { id: string }) => form.id === "journey",
)?.outcomes ?? []) {
  outcome.ctaLabel = "Discuss your needs";
}
const document = validateDocument({
  schemaVersion: 1,
  settings: {
    ...config.settings,
    font: "Lato",
    background: "#fcfbf8",
    foreground: "#321068",
    accent: "#401078",
    customCss: "",
    logo: "/site-assets/advisory/elements/axiomotl-logo-original.png",
    favicon: "/site-assets/advisory/elements/axiomotl-logo-original.png",
    motion: true,
    navigation: [
      { label: "Home", url: "/" },
      { label: "Our Practice", url: "/practice" },
      { label: "Our Approach", url: "/approach" },
      { label: "Our Services", url: "/services" },
      { label: "Contact", url: "/contact" },
    ],
  },
  forms: config.forms,
  pages: [
    {
      id: "contact", path: "/contact", title: "Contact | Axiomotl Advisory",
      description: "Discuss your business analysis and governance needs with Axiomotl Advisory.",
      socialImage: "/site-assets/combined/axiomotl-logo-master.png", noIndex: false,
      html: innerPage(load(home)("#contact").prop("outerHTML")!.replace('<h2 id="contact-title">', '<h1 id="contact-title">').replace('</h2>', '</h1>'), "/contact"),
      css, project: null,
    },
    {
      id: "home",
      path: "/",
      title: "Axiomotl Advisory | Make change work in practice",
      description:
        "Business analysis and governance for complex, regulated organisations. Make change work in practice with Axiomotl Advisory.",
      socialImage: "/site-assets/combined/axiomotl-logo-master.png",
      noIndex: false,
      html: home,
      css,
      project: null,
    },
    ...(await Promise.all(
      [
        {
          id: "practice",
          title: "Our Practice",
          description:
            "Senior business analysis and governance advisory for organisations where people, processes and systems need to work together.",
        },
        {
          id: "approach",
          title: "Our Approach",
          description:
            "A clear path through complex work. Understand the situation, work through the options and prepare people to act.",
        },
        {
          id: "services",
          title: "Our Services",
          description:
            "Four ways to work with Axiomotl Advisory, from business diagnostics to embedded principal BA advisory.",
        },
      ].map(async ({ id, title, description }) => ({
        id,
        path: `/${id}`,
        title: `${title} | Axiomotl Advisory`,
        description,
        socialImage: "/site-assets/combined/axiomotl-logo-master.png",
        noIndex: false,
        html: innerPage(await read(`${id}.html`), `/${id}`),
        css,
        project: null,
      })),
    )),
  ],
});
await writeFile(
  new URL("../src/generated/combined.json", import.meta.url),
  JSON.stringify(document, null, 2) + "\n",
);
console.log(
  "Built and validated advisory redesign. Preview at /design-preview; production publication unchanged.",
);

