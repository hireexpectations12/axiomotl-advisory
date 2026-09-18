import { expect, it } from "vitest";
import { load } from "cheerio";
import baseline from "../src/generated/combined.json";
import { renderPage, validateDraftDocument } from "../src/lib/render";

it("retains business and search settings and renders their public values safely", () => {
  const input = structuredClone(baseline);
  Object.assign(input.settings, {
    business: {
      phone: "02 1234 5678",
      address: "Sydney <office>",
      hours: "Mon–Fri 9–5",
      socialLinks: [
        { label: "LinkedIn", url: "https://www.linkedin.com/company/example" },
      ],
    },
    seo: {
      title: "Advisory",
      description: "Business advice",
      socialImage: "https://example.com/share.png",
    },
    headingAccent: "#7A2C82",
    heroAccent: "#B794D6",
  });
  input.pages[0].title = "";
  input.pages[0].description = "";
  input.pages[0].socialImage = "";
  const doc = validateDraftDocument(input);
  const $ = load(renderPage(doc, doc.pages[0]));
  expect($("title").text()).toBe("Advisory");
  expect($('meta[property="og:image"]').attr("content")).toBe(
    "https://example.com/share.png",
  );
  expect($("[data-business-details]").text()).toContain("Sydney <office>");
  expect($("[data-business-details] office").length).toBe(0);
  expect($("a[href='tel:0212345678']").length).toBeGreaterThan(0);
});

it("rejects unsafe social links and invalid brand colours", () => {
  const input = structuredClone(baseline);
  Object.assign(input.settings, {
    business: {
      phone: "",
      address: "",
      hours: "",
      socialLinks: [{ label: "Bad", url: "javascript:alert(1)" }],
    },
  });
  expect(() => validateDraftDocument(input)).toThrow();
  Object.assign(input.settings, {
    business: undefined,
    headingAccent: "red;display:none",
  });
  expect(() => validateDraftDocument(input)).toThrow();
});

it("renders an active announcement and ordered navigation but hides expired announcements", () => {
  const input = structuredClone(baseline);
  Object.assign(input.settings, {
    announcement: {
      enabled: true,
      text: "Holiday hours",
      url: "/#contact",
      expiresAt: "2099-01-01T00:00:00.000Z",
    },
    navigation: [{ label: "Contact us", url: "#contact" }],
    footer: {
      text: "Axiomotl team",
      links: [{ label: "Privacy", url: "/privacy" }],
    },
    contact: {
      recipient: "team@example.com",
      confirmation: "Thank you",
      showFields: false,
    },
  });
  let doc = validateDraftDocument(input);
  let $ = load(renderPage(doc, doc.pages[0]));
  expect($("[data-site-announcement]").text()).toBe("Holiday hours");
  expect(
    $(".desktop-nav a")
      .map((_, e) => $(e).text())
      .get(),
  ).toEqual(["Contact us"]);
  expect($("[data-site-footer]").text()).toContain("Privacy");
  expect($("[data-contact-form] .contact-fields").length).toBe(0);
  Object.assign(input.settings, {
    announcement: {
      enabled: true,
      text: "Old news",
      url: "",
      expiresAt: "2020-01-01T00:00:00.000Z",
    },
  });
  doc = validateDraftDocument(input);
  $ = load(renderPage(doc, doc.pages[0]));
  expect($("[data-site-announcement]").length).toBe(0);
});
