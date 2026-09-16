import { describe, expect, it } from "vitest";
import {
  sanitizeMarkup,
  safeUrl,
  validateDraftDocument,
  renderPage,
} from "../src/lib/render";
import type { SiteDocument } from "../src/lib/types";
import baseline from "../src/generated/baseline.json";

const fixture: SiteDocument = {
  schemaVersion: 1,
  settings: {
    name: "Axiomotl",
    email: "hello@example.com",
    favicon: "",
    logo: "",
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
      title: "Hello",
      description: "Site",
      socialImage: "",
      noIndex: false,
      html: "<h1>Hello</h1>",
      css: "",
      project: null,
    },
  ],
  forms: [],
};

describe("public content boundary", () => {
  it.each(["name", "custom-name", "label"])(
    "rejects markup in GrapesJS %s metadata",
    (key) => {
      const doc = structuredClone(fixture);
      doc.pages[0].project = {
        components: [
          {
            type: "text",
            [key]: "<img src=x onerror=window.__proof=1>",
            content: "Hover me",
          },
        ],
      };
      expect(() => validateDraftDocument(doc)).toThrow(/metadata/i);
    },
  );
  it("strips GrapesJS HTML import directives from markup and model attributes", () => {
    const html =
      '<div data-gjs-script="parent.__proof=2" data-gjs-name="&lt;img src=x onerror=evil()&gt;" data-axiomotl-form="journey">Safe</div>';
    expect(sanitizeMarkup(html)).not.toContain("data-gjs-");
    expect(sanitizeMarkup(html)).toContain("data-axiomotl-form");
    const doc = structuredClone(fixture);
    doc.pages[0].project = {
      components: [
        {
          type: "text",
          attributes: {
            "data-gjs-script": "parent.__proof=2",
            "data-axiomotl-form": "journey",
          },
        },
      ],
    };
    const result = JSON.stringify(validateDraftDocument(doc).pages[0].project);
    expect(result).not.toContain("data-gjs-");
    expect(result).toContain("data-axiomotl-form");
  });
  it("drops untrusted editor icons, toolbar markup and custom trait definitions", () => {
    const doc = structuredClone(fixture);
    doc.pages[0].project = {
      components: [
        {
          type: "text",
          icon: "<img src=x onerror=evil()>",
          toolbar: [{ label: "<img src=x onerror=evil()>" }],
          traits: [{ label: "<img src=x onerror=evil()>" }],
          content: "Safe",
        },
      ],
    };
    expect(validateDraftDocument(doc).pages[0].project).toEqual({
      components: [{ type: "text", content: "Safe" }],
    });
  });
  it("keeps hidden state for mobile navigation and inactive tab panels", () => {
    expect(sanitizeMarkup("<nav hidden></nav><div hidden></div>")).toBe(
      "<nav hidden></nav><div hidden></div>",
    );
  });
  it("applies shared logo and contact settings to marked page elements", () => {
    const doc = structuredClone(fixture);
    doc.settings.logo = "/site-assets/new.png";
    doc.settings.email = "new@example.com";
    doc.pages[0].html =
      '<img data-site-logo src="/old.png" alt="Logo"><a data-site-email href="mailto:old@example.com?subject=Hello">old@example.com</a>';
    const output = renderPage(doc, doc.pages[0]);
    expect(output).toContain('src="/site-assets/new.png"');
    expect(output).toContain('href="mailto:new@example.com?subject=Hello"');
    expect(output).toContain(">new@example.com</a>");
  });
  it("removes executable content and event handlers but preserves design SVG", () => {
    const html = sanitizeMarkup(
      '<script>alert(1)</script><img src="x" onerror="evil()"><svg viewBox="0 0 10 10"><path d="M0 0"/></svg><a href="javascript:evil()">Go</a><iframe src="/admin"></iframe>',
    );
    expect(html).not.toMatch(/script|onerror|javascript|iframe/);
    expect(html).toContain('viewBox="0 0 10 10"');
  });
  it.each([
    "javascript:alert(1)",
    "//evil.test",
    "/\\evil.test",
    "data:text/html,evil",
    "https://a.test/\nfoo",
  ])("rejects unsafe URL %s", (value) => expect(safeUrl(value)).toBe(false));
  it.each([
    "/services",
    "#contact",
    "https://example.com",
    "mailto:hello@example.com",
    "/site-assets/test.svg",
  ])("allows public URL %s", (value) => expect(safeUrl(value)).toBe(true));
  it.each([
    "/admin",
    "/admin/x",
    "/api/site",
    "/auth/login",
    "/_next/static/a",
    "//other",
    "/a/../admin",
    "/%61dmin",
  ])("rejects reserved or ambiguous public path %s", (path) => {
    const doc = structuredClone(fixture);
    doc.pages[0].path = path;
    expect(() => validateDraftDocument(doc)).toThrow();
  });
  it("rejects CSS that can close a style element", () => {
    const doc = structuredClone(fixture);
    doc.settings.customCss = "</style><script>evil()</script>";
    expect(() => validateDraftDocument(doc)).toThrow();
  });
  it("accepts the actual imported baseline and CSS child selectors", () => {
    expect(() => validateDraftDocument(baseline)).not.toThrow();
    const doc = structuredClone(fixture);
    doc.pages[0].css = ".hero > h1 { color: red; scroll-behavior: smooth; }";
    expect(validateDraftDocument(doc).pages[0].css).toContain("> h1");
  });
  it("sanitizes raw component content before GrapesJS can assign innerHTML", () => {
    const doc = structuredClone(fixture);
    doc.pages[0].project = {
      pages: [
        {
          component: {
            type: "wrapper",
            components: [
              {
                type: "text",
                content:
                  '<img src="/x" onerror="parent.pwned=1"><b>Safe text</b>',
              },
            ],
          },
        },
      ],
    };
    const result = JSON.stringify(validateDraftDocument(doc).pages[0].project);
    expect(result).not.toContain("onerror");
    expect(result).toContain("Safe text");
  });
  it("accepts font-face CSS src without relaxing image attribute URLs", () => {
    const doc = structuredClone(fixture);
    doc.pages[0].project = {
      styles: [
        {
          atRuleType: "font-face",
          style: {
            "font-family": "Nunito",
            src: 'url("/site-assets/font.ttf") format("truetype")',
          },
        },
      ],
      pages: [
        {
          component: {
            type: "wrapper",
            components: [
              { type: "image", attributes: { src: "/site-assets/image.png" } },
            ],
          },
        },
      ],
    };
    expect(validateDraftDocument(doc).pages[0].project).toEqual(
      doc.pages[0].project,
    );
    doc.pages[0].project = {
      components: [
        { type: "image", attributes: { src: 'url("/site-assets/font.ttf")' } },
      ],
    };
    expect(() => validateDraftDocument(doc)).toThrow(/unsafe URL/);
  });
  it.each([
    "</style><script>evil()</script>",
    "expression(evil())",
    "url(javascript:evil())",
    '@import "https://evil.test/style.css"',
  ])("rejects unsafe editor model CSS %s", (value) => {
    const doc = structuredClone(fixture);
    for (const project of [
      { styles: [{ style: { src: value } }] },
      { components: [{ type: "default", style: { background: value } }] },
      { components: [{ attributes: { style: value } }] },
      { styles: value },
    ]) {
      doc.pages[0].project = project;
      expect(() => validateDraftDocument(doc)).toThrow(/styles|CSS/i);
    }
  });
  it.each(["map", "video", "iframe", "script", "custom-unsafe"])(
    "rejects implicit executable component type %s",
    (type) => {
      const doc = structuredClone(fixture);
      doc.pages[0].project = {
        pages: [
          {
            component: {
              type,
              attributes: { srcdoc: "<script>parent.pwned=1</script>" },
            },
          },
        ],
      };
      expect(() => validateDraftDocument(doc)).toThrow();
    },
  );
  it("rejects frame head scripts and explicit unsafe components", () => {
    for (const project of [
      {
        pages: [
          {
            frames: [{ head: [{ tag: "script", content: "parent.pwned=1" }] }],
          },
        ],
      },
      { components: [{ tagName: "iframe", attributes: { src: "/admin" } }] },
    ]) {
      const doc = structuredClone(fixture);
      doc.pages[0].project = project;
      expect(() => validateDraftDocument(doc)).toThrow();
    }
  });
  it("sanitizes HTML strings used as components and rejects document attributes", () => {
    const doc = structuredClone(fixture);
    doc.pages[0].project = { components: '<p onclick="evil()">Safe</p>' };
    expect(
      JSON.stringify(validateDraftDocument(doc).pages[0].project),
    ).not.toContain("onclick");
    doc.pages[0].project = {
      components: [
        { type: "default", attributes: { srcdoc: "<script>evil()</script>" } },
      ],
    };
    expect(() => validateDraftDocument(doc)).toThrow();
  });
  it("preserves SVG gradient and clip element case and references", () => {
    const html = sanitizeMarkup(
      '<svg viewBox="0 0 10 10"><defs><linearGradient id="a"><stop offset="0" stop-color="red"/></linearGradient><clipPath id="b"><rect width="5" height="5"/></clipPath></defs><rect fill="url(#a)" clip-path="url(#b)" width="10" height="10"/></svg>',
    );
    expect(html).toContain("<linearGradient");
    expect(html).toContain("<clipPath");
    expect(html).toContain('fill="url(#a)"');
    expect(html).toContain('clip-path="url(#b)"');
  });
  it("rejects component scripts even if only editor data contains them", () => {
    const doc = structuredClone(fixture);
    doc.pages[0].project = { components: [{ script: "evil()" }] };
    expect(() => validateDraftDocument(doc)).toThrow();
  });
  it("escapes metadata and embeds configuration without executable closing tags", () => {
    const doc = structuredClone(fixture);
    doc.pages[0].title = "</title><script>evil()</script>";
    const result = renderPage(doc, doc.pages[0]);
    expect(result).toContain("&lt;/title&gt;");
    expect(result).not.toContain("<script>evil()");
    expect(result).toContain("/runtime/forms.js");
  });
});
