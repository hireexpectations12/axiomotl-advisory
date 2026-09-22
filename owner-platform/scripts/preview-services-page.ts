import { readFile, writeFile } from "node:fs/promises";
import { addServicesPage } from "./services-page";
import { renderPage } from "../src/lib/render";

const state = JSON.parse(await readFile(new URL("../../outputs/services-page/current-state.json", import.meta.url), "utf8"));
const content = await readFile(new URL("../design/services/content.html", import.meta.url), "utf8");
const css = await readFile(new URL("../design/services/styles.css", import.meta.url), "utf8");
const next = addServicesPage(state.publication, content, css);
await writeFile(new URL("../../outputs/services-page/proposed-document.json", import.meta.url), JSON.stringify(next, null, 2));
const page = next.pages.find(page => page.path === "/services")!;
await writeFile(new URL("../public/services-review.html", import.meta.url), renderPage(next, { ...page, noIndex: true }));
console.log("Services preview ready at /services-review.html");
