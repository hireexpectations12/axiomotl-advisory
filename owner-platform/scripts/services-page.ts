import { load } from "cheerio";
import { validateDocument } from "../src/lib/render";
import type { SiteDocument } from "../src/lib/types";

export function addServicesPage(
  current: SiteDocument,
  content: string,
  css: string,
) {
  const next = structuredClone(current);
  if (next.pages.some((page) => page.path === "/services"))
    throw new Error(
      "A services page already exists; inspect it before replacing.",
    );
  const home = next.pages.find((page) => page.path === "/");
  if (!home || home.project)
    throw new Error("Reconcile the home editor structure first.");
  const source = load(home.html, null, false);
  const header = source(".site-header").first().clone();
  const footer = source("footer").last().clone();
  if (!header.length || !footer.length)
    throw new Error("Shared navigation was not found.");
  for (const fragment of [header, footer]) {
    fragment.find("a[href]").each((_, element) => {
      const link = source(element);
      const href = link.attr("href") || "";
      if (link.text().trim() === "Services") {
        link.attr("href", "/services").attr("aria-current", "page");
      } else if (href === "#top") {
        link.attr("href", link.hasClass("back-top") ? "#top" : "/");
      } else if (href.startsWith("#")) {
        link.attr("href", `/${href}`);
      }
    });
  }
  footer.find("#site-motion").remove();
  const previousNavigation =
    home.html.match(/href="#services">Services<\/a>/g) || [];
  if (previousNavigation.length < 2)
    throw new Error("Expected home Services navigation was not found.");
  home.html = home.html.replaceAll(
    'href="#services">Services</a>',
    'href="/services">Services</a>',
  );
  if (next.settings.navigation) {
    next.settings.navigation = next.settings.navigation.map((link) => ({
      ...link,
      url:
        link.label === "Services"
          ? "/services"
          : link.url.startsWith("#")
            ? `/${link.url}`
            : link.url,
    }));
  }
  next.pages.push({
    id: "services-detail",
    path: "/services",
    title: "Business Analysis & Governance Services | Axiomotl Advisory",
    description:
      "Explore Axiomotl's four services: business and governance diagnostics, requirements and decision architecture, BAU transition and operating models, and embedded principal BA advisory.",
    socialImage: home.socialImage,
    noIndex: false,
    html: `${source("svg.icon-defs").toString()}<a class="svc-skip" href="#services-main">Skip to content</a>${header.toString()}${content}${footer.toString()}`,
    css: `${home.css}\n${css}`,
    project: null,
  });
  return validateDocument(next);
}
