import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { load } from "cheerio";
import baseline from "../src/generated/baseline.json";
import { addServicesPage } from "../scripts/services-page";
import { renderPage } from "../src/lib/render";
import type { SiteDocument } from "../src/lib/types";

it("adds service details and connects desktop, mobile and cross-page links without replacing the home copy", () => {
  const original = structuredClone(baseline) as SiteDocument;
  original.pages = [
    {
      ...original.pages[0],
      path: "/",
      project: null,
      html: '<header id="top" class="site-header"><a class="brand" href="#top">Axiomotl</a><nav class="desktop-nav"><a href="#services">Services</a><a href="#about">Our practice</a></nav><nav id="mobile-nav"><a href="#services">Services</a></nav></header><main><section id="services">Existing services</section><section id="about">Existing biography</section></main><footer><a href="#contact">Contact</a></footer>',
    },
  ];
  delete original.settings.navigation;
  const content = readFileSync(
    new URL("../design/services/content.html", import.meta.url),
    "utf8",
  );
  const document = addServicesPage(
    original,
    content,
    ".svc-page{background:#fff}",
  );
  expect(original.pages).toHaveLength(1);
  const home = load(document.pages[0].html);
  expect(home(".desktop-nav a").first().attr("href")).toBe("/services");
  expect(home("#mobile-nav a").attr("href")).toBe("/services");
  expect(home("main").text()).toBe("Existing servicesExisting biography");
  const page = document.pages.find((page) => page.path === "/services")!;
  const services = load(renderPage(document, page));
  expect(services(".site-header .brand").attr("href")).toBe("/");
  expect(services('.desktop-nav a[href="/#about"]').text()).toBe(
    "Our practice",
  );
  expect(services('footer a[href="/#contact"]').text()).toBe("Contact");
  expect(services("main h1")).toHaveLength(1);
  expect(services(".svc-detail")).toHaveLength(4);
  services('.svc-page a[href^="#"]').each((_, element) => {
    expect(services(services(element).attr("href")!)).toHaveLength(1);
  });
  expect(() => addServicesPage(document, content, "")).toThrow(
    "already exists",
  );
});
