import sanitizeHtml from "sanitize-html";
import { load } from "cheerio";
import { z } from "zod";
import type { SiteDocument, SitePage } from "./types";
import { validateForm } from "./forms";

export function safeUrl(value: string): boolean {
  if (!value) return true;
  if (/[\u0000-\u0020\\]/.test(value) || value.startsWith("//")) return false;
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(value);
}

const url = z
  .string()
  .max(2048)
  .refine(
    safeUrl,
    "Use a full https:// URL, a /page path, #anchor, mailto: or tel: link.",
  );
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const target = z.object({ kind: z.enum(["question", "outcome"]), id });
const formSchema = z.object({
  id,
  name: z.string().max(200),
  startQuestionId: id,
  questions: z
    .array(
      z.object({
        id,
        title: z.string().max(2000),
        help: z.string().max(4000).optional(),
        kind: z.enum(["choice", "text"]).optional(),
        required: z.boolean().optional(),
        placeholder: z.string().max(500).optional(),
        choices: z
          .array(
            z.object({
              id,
              label: z.string().max(2000),
              next: target.optional(),
            }),
          )
          .max(50),
        next: target.optional(),
      }),
    )
    .max(50),
  outcomes: z
    .array(
      z.object({
        id,
        title: z.string().max(2000),
        body: z.string().max(20000),
        outputs: z.array(z.string().max(2000)).max(50),
        ctaLabel: z.string().max(200),
        ctaUrl: url,
      }),
    )
    .max(100),
  rules: z
    .array(
      z.object({
        id,
        label: z.string().max(500),
        fromQuestionId: id,
        match: z.enum(["all", "any"]),
        conditions: z
          .array(z.object({ questionId: id, answerId: z.string().max(2000) }))
          .max(50),
        target,
      }),
    )
    .max(200),
  fallbackOutcomeId: id,
  email: z
    .string()
    .max(254)
    .refine(
      (v) => !v || z.email().safeParse(v).success,
      "Enter a valid email address.",
    ),
  emailSubject: z.string().max(500),
});

export function safeCss(css: string): boolean {
  return !/<|@import|expression\s*\(|-moz-binding|(?:^|[;{])\s*behavior\s*:|javascript\s*:/i.test(
    css,
  );
}
const cssSchema = z
  .string()
  .max(500000)
  .refine(
    safeCss,
    "Styles cannot contain HTML, imports or executable expressions.",
  );
const pathSchema = z
  .string()
  .max(200)
  .refine((path) => {
    if (!/^\/(?:[a-z0-9_-]+(?:\/[a-z0-9_-]+)*)?$/.test(path)) return false;
    return !/^\/(admin|api|auth|_next|runtime|site-assets|favicon\.ico)(\/|$)/.test(
      path,
    );
  }, "Use a lowercase public path such as /services; application paths are reserved.");

const schema = z.object({
  schemaVersion: z.literal(1),
  settings: z.object({
    name: z.string().min(1).max(200),
    email: z.email(),
    favicon: url,
    logo: url,
    font: z
      .string()
      .max(100)
      .regex(/^[a-zA-Z0-9 ,'-]+$/),
    background: z.string().regex(/^#[\da-fA-F]{6}$/),
    foreground: z.string().regex(/^#[\da-fA-F]{6}$/),
    accent: z.string().regex(/^#[\da-fA-F]{6}$/),
    customCss: cssSchema,
    motion: z.boolean(),
    headingAccent: z
      .string()
      .regex(/^#[\da-fA-F]{6}$/)
      .optional(),
    heroAccent: z
      .string()
      .regex(/^#[\da-fA-F]{6}$/)
      .optional(),
    business: z
      .object({
        phone: z
          .string()
          .max(50)
          .regex(/^[+\d\s().-]*$/),
        address: z.string().max(500),
        hours: z.string().max(500),
        socialLinks: z
          .array(z.object({ label: z.string().min(1).max(100), url }))
          .max(12),
      })
      .optional(),
    seo: z
      .object({
        title: z.string().max(300),
        description: z.string().max(2000),
        socialImage: url,
      })
      .optional(),
    announcement: z
      .object({
        enabled: z.boolean(),
        text: z.string().max(500),
        url,
        expiresAt: z.union([z.literal(""), z.iso.datetime()]),
      })
      .optional(),
    navigation: z
      .array(z.object({ label: z.string().min(1).max(100), url }))
      .min(1)
      .max(12)
      .optional(),
    footer: z
      .object({
        text: z.string().max(1000),
        links: z
          .array(z.object({ label: z.string().min(1).max(100), url }))
          .max(12),
      })
      .optional(),
    contact: z
      .object({
        recipient: z.union([z.literal(""), z.email()]),
        confirmation: z.string().max(1000),
        showFields: z.boolean(),
      })
      .optional(),
  }),
  pages: z
    .array(
      z.object({
        id,
        path: pathSchema,
        title: z.string().max(300),
        description: z.string().max(2000),
        socialImage: url,
        noIndex: z.boolean(),
        html: z.string().max(1000000),
        css: cssSchema,
        project: z.record(z.string(), z.unknown()).nullable(),
      }),
    )
    .min(1)
    .max(50),
  forms: z.array(formSchema).max(20),
});

const componentTypes = new Set([
  "",
  "default",
  "wrapper",
  "text",
  "textnode",
  "comment",
  "image",
  "link",
  "svg",
  "svg-in",
  "table",
  "row",
  "cell",
  "thead",
  "tbody",
  "tfoot",
  "label",
  "input",
  "textarea",
  "select",
  "option",
  "button",
  "form",
  "head",
  "docEl",
  "axiomotl-form",
]);

function checkStyle(value: unknown): unknown {
  if (typeof value === "string") {
    if (!safeCss(value))
      throw new Error("Page component contains unsafe CSS styles.");
    return value;
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "Page component styles must be CSS text or a declaration map.",
    );
  const checked: Record<string, string | number> = {};
  for (const [property, declaration] of Object.entries(value)) {
    if (
      (typeof declaration !== "string" && typeof declaration !== "number") ||
      !safeCss(`${property}:${declaration};`)
    )
      throw new Error("Page component contains unsafe CSS styles.");
    checked[property] = declaration;
  }
  return checked;
}

function checkProject(value: unknown, depth = 0, component = false): unknown {
  if (depth > 80) throw new Error("Page structure is too deeply nested.");
  if (typeof value === "string")
    return component ? sanitizeMarkup(value) : value;
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value))
    return value.map((item) => checkProject(item, depth + 1, component));
  if (component && "type" in value && !componentTypes.has(String(value.type)))
    throw new Error(`Unsupported page component type: ${String(value.type)}.`);
  const checked: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    // These fields become editor UI HTML or executable import directives.
    // Built-in icons, toolbars and traits are supplied by our editor configuration.
    if (/^data-gjs-/i.test(key) || ["icon", "toolbar", "traits"].includes(key))
      continue;
    if (
      ["name", "custom-name", "label"].includes(key) &&
      typeof item === "string" &&
      /[<>]/.test(item)
    )
      throw new Error("Editor metadata names and labels must be plain text.");
    // CSS font-face uses `src` too; only HTML/model URLs use the URL validator.
    if (key === "style" || (key === "styles" && typeof item === "string")) {
      checked[key] = checkStyle(item);
      continue;
    }
    if (
      ["script", "script-export", "script-props", "scripts"].includes(key) &&
      item &&
      (!Array.isArray(item) || item.length)
    )
      throw new Error("Page components cannot contain custom scripts.");
    if (/^on[a-z]+$/i.test(key) && typeof item === "string")
      throw new Error("Inline event handlers are not supported.");
    if (key.toLowerCase() === "srcdoc")
      throw new Error("Embedded HTML documents are not supported.");
    if (
      ["src", "href", "xlink:href", "poster", "action", "formaction"].includes(
        key.toLowerCase(),
      ) &&
      typeof item === "string" &&
      !safeUrl(item)
    )
      throw new Error("Page component contains an unsafe URL.");
    if (
      ["tagName", "tag"].includes(key) &&
      typeof item === "string" &&
      /^(script|iframe|object|embed|base|meta|link|foreignObject)$/i.test(item)
    )
      throw new Error(
        "Executable or embedded page components are not supported.",
      );
    // GrapesJS loads model content directly into innerHTML, without its HTML parser.
    checked[key] =
      key === "content" && typeof item === "string"
        ? sanitizeMarkup(item)
        : checkProject(
            item,
            depth + 1,
            ["component", "components", "head", "docEl"].includes(key),
          );
  }
  return checked;
}

export function validateDraftDocument(value: unknown): SiteDocument {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      result.error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n"),
    );
  const doc = result.data as SiteDocument;
  const paths = doc.pages.map((page) => page.path);
  if (new Set(paths).size !== paths.length || !paths.includes("/"))
    throw new Error("Pages need unique paths and a home page at /.");
  for (const items of [doc.pages, doc.forms])
    if (new Set(items.map((x) => x.id)).size !== items.length)
      throw new Error("Page and form IDs must be unique.");
  for (const page of doc.pages) {
    page.project = checkProject(page.project) as SitePage["project"];
    page.html = sanitizeMarkup(page.html);
  }
  return doc;
}

export function validateDocument(value: unknown): SiteDocument {
  const doc = validateDraftDocument(value);
  const errors = doc.forms.flatMap((form) =>
    validateForm(form).errors.map((error) => `${form.name}: ${error}`),
  );
  if (errors.length) throw new Error(errors.join("\n"));
  for (const page of doc.pages) {
    const mounts = [...page.html.matchAll(/data-axiomotl-form="([^"]+)"/g)].map(
      (match) => match[1],
    );
    if (mounts.some((formId) => !doc.forms.some((form) => form.id === formId)))
      throw new Error(
        `${page.title}: an interactive form was removed but its page block still exists.`,
      );
  }
  return doc;
}

export function sanitizeMarkup(html: string): string {
  return sanitizeHtml(html, {
    nonBooleanAttributes: sanitizeHtml.defaults.nonBooleanAttributes.filter(
      (attribute) => !["hidden", "inert"].includes(attribute),
    ),
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "picture",
      "source",
      "video",
      "audio",
      "button",
      "input",
      "textarea",
      "select",
      "option",
      "label",
      "fieldset",
      "legend",
      "dialog",
      "details",
      "summary",
      "canvas",
      "svg",
      "g",
      "path",
      "circle",
      "ellipse",
      "rect",
      "line",
      "polyline",
      "polygon",
      "defs",
      "symbol",
      "use",
      "clipPath",
      "linearGradient",
      "radialGradient",
      "stop",
      "mask",
      "title",
      "desc",
      "text",
      "tspan",
      "pattern",
    ],
    allowedAttributes: {
      "*": [
        "id",
        "class",
        "style",
        "title",
        "role",
        "aria-*",
        "data-*",
        "tabindex",
        "hidden",
        "inert",
        "width",
        "height",
        "viewBox",
        "preserveAspectRatio",
        "fill",
        "fill-rule",
        "fill-opacity",
        "stroke",
        "stroke-width",
        "stroke-linecap",
        "stroke-linejoin",
        "stroke-dasharray",
        "stroke-opacity",
        "clip-path",
        "clip-rule",
        "d",
        "cx",
        "cy",
        "r",
        "rx",
        "ry",
        "x",
        "y",
        "x1",
        "x2",
        "y1",
        "y2",
        "points",
        "transform",
        "opacity",
        "offset",
        "stop-color",
        "stop-opacity",
        "gradientUnits",
        "gradientTransform",
        "maskUnits",
        "patternUnits",
        "patternTransform",
      ],
      a: ["href", "target", "rel", "download"],
      img: ["src", "alt", "loading", "decoding"],
      use: ["href", "xlink:href"],
      button: ["type", "disabled"],
      input: [
        "type",
        "name",
        "value",
        "placeholder",
        "required",
        "checked",
        "disabled",
        "maxlength",
      ],
      textarea: [
        "name",
        "placeholder",
        "rows",
        "required",
        "disabled",
        "maxlength",
      ],
      label: ["for"],
      select: ["name", "required", "disabled"],
      option: ["value", "selected"],
      fieldset: ["disabled"],
      video: [
        "src",
        "poster",
        "controls",
        "muted",
        "loop",
        "autoplay",
        "playsinline",
      ],
      audio: ["src", "controls"],
      source: ["src", "type", "media"],
      details: ["open"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    parser: { lowerCaseAttributeNames: false, lowerCaseTags: false },
    transformTags: {
      "*": (tagName, attribs) => {
        for (const key of Object.keys(attribs))
          if (/^data-gjs-/i.test(key)) delete attribs[key];
        for (const key of ["href", "src", "xlink:href", "poster"])
          if (attribs[key] && !safeUrl(attribs[key])) delete attribs[key];
        if (attribs.style && !safeCss(attribs.style)) delete attribs.style;
        if (attribs.target === "_blank") attribs.rel = "noopener noreferrer";
        return { tagName, attribs };
      },
    },
  });
}

function escape(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ]!,
  );
}

export function renderPage(document: SiteDocument, page: SitePage): string {
  const s = document.settings;
  const title = page.title || s.seo?.title || s.name;
  const description = page.description || s.seo?.description || "";
  const socialImage = page.socialImage || s.seo?.socialImage || "";
  const markup = load(sanitizeMarkup(page.html), null, false);
  const contactActions = new Set([
    "discuss the diagnostic",
    "discuss a diagnostic",
    "discuss your requirements",
    "plan your transition",
    "explore advisory support",
    "discuss your operating model",
  ]);
  if (markup("#contact").length) {
    markup("a").each((_, element) => {
      const link = markup(element);
      const label = link
        .text()
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (contactActions.has(label)) {
        link.attr("href", "#contact");
        link.removeAttr("target data-journey-open data-journey-answer");
      }
    });
  }
  const linksHtml = (links: { label: string; url: string }[]) =>
    links
      .map((link) => `<a href="${escape(link.url)}">${escape(link.label)}</a>`)
      .join(" ");
  if (s.navigation)
    markup(".desktop-nav, #mobile-nav").html(linksHtml(s.navigation));
  if (s.footer) {
    markup("[data-site-footer]").remove();
    const footer = `<div data-site-footer><p>${escape(s.footer.text)}</p><nav aria-label="Footer links">${linksHtml(s.footer.links)}</nav></div>`;
    if (markup("footer").length) markup("footer").first().append(footer);
    else markup.root().append(footer);
  }
  const announcement = s.announcement;
  if (
    announcement?.enabled &&
    announcement.text &&
    (!announcement.expiresAt || Date.parse(announcement.expiresAt) > Date.now())
  ) {
    const text = escape(announcement.text);
    const banner = `<aside data-site-announcement aria-label="Announcement">${announcement.url ? `<a href="${escape(announcement.url)}">${text}</a>` : text}</aside>`;
    if (markup(".site-header").length)
      markup(".site-header").first().after(banner);
    else markup.root().prepend(banner);
  }
  if (s.contact?.showFields === false)
    markup(
      "[data-contact-form] .contact-fields, [data-contact-submit]",
    ).remove();
  const business = s.business;
  if (
    business &&
    (business.phone ||
      business.address ||
      business.hours ||
      business.socialLinks.length)
  ) {
    markup("[data-business-details]").remove();
    const details = `<div data-business-details>${business.phone ? `<p><a href="tel:${escape(business.phone.replace(/[^+\d]/g, ""))}">${escape(business.phone)}</a></p>` : ""}${business.address ? `<p>${escape(business.address)}</p>` : ""}${business.hours ? `<p>${escape(business.hours)}</p>` : ""}${business.socialLinks.map((link) => `<a href="${escape(link.url)}" rel="noopener noreferrer">${escape(link.label)}</a>`).join(" ")}</div>`;
    if (markup("footer").length) markup("footer").first().append(details);
    else markup.root().append(details);
  }
  if (s.logo && safeUrl(s.logo))
    markup("img[data-site-logo], .brand img").attr("src", s.logo);
  markup('a[data-site-email], a[href^="mailto:hello@axiomotl.com.au"]').each(
    (_, el) => {
      const link = markup(el),
        previous = link.attr("href") || "",
        query = previous.includes("?")
          ? previous.slice(previous.indexOf("?"))
          : "";
      const previousEmail = previous.replace(/^mailto:/, "").split("?")[0];
      link.attr("href", `mailto:${s.email}${query}`);
      if (link.text().trim() === previousEmail) link.text(s.email);
    },
  );
  // Future contact delivery settings are not needed by the browser runtime.
  const { contact: _contact, ...publicSettings } = s;
  const data = JSON.stringify({
    forms: document.forms,
    settings: publicSettings,
  }).replace(/</g, "\\u003c");
  const styles = [
    page.css,
    `:root{--navy-accent:${s.accent};--ink:${s.foreground};--paper:${s.background};--font-body:${s.font},Arial,sans-serif;--font-display:${s.font},Arial,sans-serif}`,
    s.customCss,
    s.headingAccent
      ? `:is(h1,h2,h3,h4,h5,h6) .heading-last-word{color:${s.headingAccent};-webkit-text-fill-color:${s.headingAccent}}`
      : "",
    s.heroAccent
      ? `.hero :is(h1,h2,h3,h4,h5,h6) .heading-last-word{color:${s.heroAccent};-webkit-text-fill-color:${s.heroAccent}}`
      : "",
    `[data-business-details]{display:flex;flex-wrap:wrap;gap:12px 24px;padding:24px;white-space:pre-line}[data-business-details] p{margin:0}[data-business-details] a{color:inherit}`,
    `[data-site-announcement]{padding:14px 24px;background:#7a2c82;color:#fff;text-align:center;overflow-wrap:anywhere}[data-site-announcement] a{color:inherit;text-decoration:underline}[data-site-footer]{padding:24px;white-space:pre-line}[data-site-footer] nav{display:flex;flex-wrap:wrap;gap:16px}[data-site-footer] a{color:inherit}`,
  ]
    .filter(safeCss)
    .join("\n");
  return `<!doctype html><html lang="en-AU" data-motion="${s.motion ? "on" : "off"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">${socialImage ? `<meta property="og:image" content="${escape(socialImage)}">` : ""}${page.noIndex ? '<meta name="robots" content="noindex,nofollow">' : ""}${s.favicon ? `<link rel="icon" href="${escape(s.favicon)}">` : ""}<link rel="stylesheet" href="/runtime/forms.css"><style>${styles}</style><link rel="stylesheet" href="/runtime/polish.css"></head><body>${markup.html()}<script type="application/json" id="axiomotl-config">${data}</script><script defer src="/runtime/gsap.js"></script><script defer src="/runtime/site.js"></script><script defer src="/runtime/forms.js"></script></body></html>`;
}

export const publicHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; media-src 'self' https:; connect-src 'self'; frame-src 'none'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
};
