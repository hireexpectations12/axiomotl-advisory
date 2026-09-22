import { readFile, writeFile } from "node:fs/promises";
import { load } from "cheerio";
import { validateDocument } from "../src/lib/render";

const source = new URL("../design/advisory/", import.meta.url);
const read = (name: string) => readFile(new URL(name, source), "utf8");
const previous = load(
  await readFile(
    new URL("../design/combined/vercel.html", import.meta.url),
    "utf8",
  ),
);
const config = JSON.parse(previous("#axiomotl-config").text());
const document = validateDocument({
  schemaVersion: 1,
  settings: {
    ...config.settings,
    font: "Manrope",
    background: "#f8f8fc",
    foreground: "#160d35",
    accent: "#4f2179",
    customCss: "",
    logo: "/site-assets/combined/axiomotl-logo-master.png",
    favicon: "/site-assets/combined/axiomotl-logo-master.png",
    motion: false,
    navigation: [
      { label: "Our practice", url: "#practice" },
      { label: "Services", url: "#services" },
      { label: "Our approach", url: "#approach" },
    ],
  },
  forms: config.forms,
  pages: [
    {
      id: "home",
      path: "/",
      title: "Axiomotl Advisory | Make change work in practice",
      description:
        "Business analysis and governance for complex, regulated organisations. Make change work in practice with Axiomotl Advisory.",
      socialImage: "/site-assets/combined/axiomotl-logo-master.png",
      noIndex: false,
      html: await read("index.html"),
      css: await read("styles.css"),
      project: null,
    },
  ],
});
await writeFile(
  new URL("../src/generated/combined.json", import.meta.url),
  JSON.stringify(document, null, 2) + "\n",
);
console.log(
  "Built and validated advisory redesign. Preview at /design-preview; production publication unchanged.",
);
