"use client";
import { useEffect, useRef, useState } from "react";
import type { Component, Editor } from "grapesjs";
import type { FormDefinition, SitePage } from "@/lib/types";
import MediaLibrary from "./MediaLibrary";
import { Field, Textarea } from "./OwnerUI";

export default function PageEditor({
  page,
  forms = [],
  onChange,
}: {
  page: SitePage;
  forms?: FormDefinition[];
  onChange: (page: SitePage) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<Editor | null>(null);
  const current = useRef(page);
  const change = useRef(onChange);
  current.current = page;
  change.current = onChange;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [media, setMedia] = useState(false);
  const [selected, setSelected] = useState<Component | null>(null);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [device, setDevice] = useState("Desktop");
  const [css, setCss] = useState(page.css);
  const [cssOpen, setCssOpen] = useState(false);
  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);
  const [section, setSection] = useState("");
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    let disposed = false;
    let instance: Editor | undefined;
    setReady(false);
    setSections([]);
    setSection("");
    setReveal(false);
    void Promise.all([import("grapesjs"), import("grapesjs-parser-postcss")])
      .then(([{ default: grapesjs }, { default: parserPostCSS }]) => {
        if (disposed || !container.current) return;
        instance = grapesjs.init({
          container: container.current,
          height: "660px",
          storageManager: false,
          telemetry: false,
          parser: {
            optionsHtml: {
              allowScripts: false,
              allowUnsafeAttr: false,
              allowUnsafeAttrValue: false,
            },
          },
          canvas: { scripts: [], styles: [] },
          // Canvas-only CSS is never included in saved/published page styles.
          canvasCss: `html { scroll-behavior: auto !important; }
            html[data-editor-reveal] [role="tabpanel"] {
              display: block !important; visibility: visible !important;
              pointer-events: auto !important; grid-area: auto !important;
            }
            html[data-editor-reveal] nav[hidden] {
              display: block !important; position: static !important;
              visibility: visible !important;
            }`,
          deviceManager: {
            devices: [
              { id: "Desktop", name: "Desktop", width: "" },
              {
                id: "Tablet",
                name: "Tablet",
                width: "768px",
                widthMedia: "992px",
              },
              {
                id: "Mobile",
                name: "Mobile",
                width: "375px",
                widthMedia: "480px",
              },
            ],
          },
          plugins: [
            parserPostCSS,
            (ed: Editor) => {
              ed.Components.addType("axiomotl-form", {
                isComponent: (el) =>
                  el.nodeType === 1 &&
                  (el as HTMLElement).hasAttribute("data-axiomotl-form")
                    ? { type: "axiomotl-form" }
                    : false,
                model: {
                  defaults: {
                    name: "Interactive form",
                    editable: false,
                    droppable: false,
                    traits: [],
                    script: "",
                    "script-export": "",
                  },
                  init() {
                    this.components().forEach((child: Component) =>
                      child.set({
                        selectable: false,
                        editable: false,
                        draggable: false,
                        removable: false,
                      }),
                    );
                  },
                },
              });
              ed.Blocks.add("section", {
                label: "Section",
                category: "Layout",
                content:
                  '<section style="padding:64px 24px"><h2>New section</h2><p>Write your content here.</p></section>',
              });
              ed.Blocks.add("columns", {
                label: "Two columns",
                category: "Layout",
                content:
                  '<section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;padding:32px"><div><h2>First column</h2><p>Your content.</p></div><div><h2>Second column</h2><p>Your content.</p></div></section>',
              });
              ed.Blocks.add("heading", {
                label: "Heading",
                category: "Content",
                content: "<h2>Your heading</h2>",
              });
              ed.Blocks.add("text", {
                label: "Text",
                category: "Content",
                content: "<p>Your text goes here.</p>",
              });
              ed.Blocks.add("link", {
                label: "Button / link",
                category: "Content",
                content:
                  '<a href="/" style="display:inline-block;padding:14px 24px;background:#124559;color:white">Learn more</a>',
              });
              ed.Blocks.add("image", {
                label: "Image",
                category: "Content",
                content: {
                  type: "image",
                  attributes: { src: "/site-assets/favicon.svg", alt: "" },
                },
              });
              forms.forEach((form) =>
                ed.Blocks.add(`form-${form.id}`, {
                  label: form.name,
                  category: "Interactive forms",
                  content: {
                    type: "axiomotl-form",
                    attributes: { "data-axiomotl-form": form.id },
                    components: [
                      {
                        type: "text",
                        tagName: "p",
                        content:
                          "Interactive form — edit questions and outcomes in Forms.",
                        selectable: false,
                        editable: false,
                      },
                    ],
                  },
                }),
              );
            },
          ],
        });
        editor.current = instance;
        const refreshSections = () => {
          if (!instance || disposed) return;
          setSections(
            (
              instance
                .getWrapper()
                ?.find(
                  "header, section, footer, [role=tabpanel], nav[hidden]",
                ) || []
            ).map((component) => {
              const element = component.getEl();
              const tag = component.get("tagName");
              const attributes = component.getAttributes();
              const label =
                tag === "header"
                  ? "Header"
                  : tag === "footer"
                    ? "Footer"
                    : component.getClasses().includes("wave-hero")
                      ? "Hero"
                      : attributes.id === "contact"
                        ? "Contact"
                        : attributes.role === "tabpanel"
                          ? `Tab: ${attributes.id || component.getName()}`
                          : tag === "nav"
                            ? "Mobile navigation"
                            : element
                                ?.querySelector("h1,h2,h3")
                                ?.textContent?.replace(/\s+/g, " ")
                                .trim() ||
                              attributes.id ||
                              component.getName();
              return { id: component.getId(), label };
            }),
          );
        };
        if (page.project && Object.keys(page.project).length)
          instance.loadProjectData(page.project);
        else {
          instance.setComponents(page.html);
          instance.setStyle(page.css);
        }
        instance.on("load", () => {
          setReady(true);
          refreshSections();
          instance?.Panels.getButton("views", "open-blocks")?.set(
            "active",
            true,
          );
        });
        instance.on("component:selected", (component: Component) => {
          setSelected(component);
          setAttributes(component.getAttributes());
        });
        instance.on("component:deselected", () => {
          setSelected(null);
          setAttributes({});
        });
        instance.on("asset:custom", () => setMedia(true));
        instance.on("update", () => {
          if (!instance || disposed) return;
          refreshSections();
          const nextCss = instance.getCss({ keepUnusedStyles: true }) || "";
          setCss(nextCss);
          change.current({
            ...current.current,
            html: instance.getHtml(),
            css: nextCss,
            project: instance.getProjectData(),
          });
        });
        instance.AssetManager.getConfig().custom = true;
      })
      .catch((e) => setError(`The visual editor could not load. ${String(e)}`));
    return () => {
      disposed = true;
      instance?.destroy();
      editor.current = null;
    };
    // Switching pages creates an independent editor/undo stack. Updates use refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);
  function attribute(name: string, value: string) {
    selected?.addAttributes({ [name]: value });
    setAttributes((a) => ({ ...a, [name]: value }));
  }
  function move(offset: number) {
    if (!selected) return;
    const parent = selected.parent();
    if (parent)
      selected.move(parent, { at: Math.max(0, selected.index() + offset) });
  }
  return (
    <section className="page-editor" aria-label="Visual page editor">
      <div className="editor-toolbar">
        <div className="actions">
          {["Desktop", "Tablet", "Mobile"].map((name) => (
            <button
              key={name}
              aria-pressed={device === name}
              disabled={!ready}
              onClick={() => {
                setDevice(name);
                editor.current?.setDevice(name);
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="actions">
          <button
            disabled={!ready}
            onClick={() => editor.current?.UndoManager.undo()}
          >
            Undo
          </button>
          <button
            disabled={!ready}
            onClick={() => editor.current?.UndoManager.redo()}
          >
            Redo
          </button>
          <button disabled={!ready} onClick={() => setMedia(!media)}>
            Images
          </button>
          <button onClick={() => setCssOpen(!cssOpen)} aria-expanded={cssOpen}>
            Page CSS
          </button>
        </div>
      </div>
      <div className="section-navigation">
        <label className="field">
          <span>Jump to section</span>
          <select
            value={section}
            disabled={!ready}
            onChange={(event) => {
              const id = event.target.value;
              setSection(id);
              const component = editor.current
                ?.getWrapper()
                ?.find("header, section, footer, [role=tabpanel], nav[hidden]")
                .find((item) => item.getId() === id);
              if (component) {
                if (component.getAttributes().hidden !== undefined) {
                  setReveal(true);
                  editor.current?.Canvas.getDocument()?.documentElement.setAttribute(
                    "data-editor-reveal",
                    "",
                  );
                }
                editor.current?.select(component);
                container.current?.scrollIntoView({
                  block: "start",
                  behavior: "instant",
                });
                editor.current?.Canvas.scrollTo(component, {
                  force: true,
                  block: "start",
                  behavior: "instant",
                });
              }
            }}
          >
            <option value="">Choose a section…</option>
            {sections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={reveal}
            disabled={!ready}
            onChange={(event) => {
              setReveal(event.target.checked);
              editor.current?.Canvas.getDocument()?.documentElement.toggleAttribute(
                "data-editor-reveal",
                event.target.checked,
              );
            }}
          />
          Show hidden tab and menu content
        </label>
      </div>
      <p className="editor-hint">
        Choose a section above or scroll inside the page to edit the whole
        website. Double-click text to edit. Hidden content is revealed only in
        this editor. Edit interactive questions, answers and outcomes in Forms.
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {!ready && !error && <p role="status">Loading visual editor…</p>}
      <div ref={container} className="canvas-host" />
      {selected && (
        <div className="selection-controls">
          <h3>Selected: {selected.getName()}</h3>
          <div className="actions">
            <button onClick={() => move(-1)}>Move earlier</button>
            <button onClick={() => move(1)}>Move later</button>
            <button
              onClick={() => {
                const parent = selected.parent();
                if (parent)
                  parent.append(selected.clone(), { at: selected.index() + 1 });
              }}
            >
              Duplicate
            </button>
            <button
              onClick={() =>
                selected.addStyle({
                  display: selected.getStyle().display === "none" ? "" : "none",
                })
              }
            >
              Toggle visibility
            </button>
            <button className="danger" onClick={() => selected.remove()}>
              Remove · undo available
            </button>
          </div>
          <div className="field-grid">
            <Field
              label="Element ID"
              value={attributes.id || ""}
              onChange={(e) => attribute("id", e.target.value)}
            />
            {selected.is("image") ? (
              <>
                <Field
                  label="Image description (alt text)"
                  value={attributes.alt || ""}
                  onChange={(e) => attribute("alt", e.target.value)}
                />
                <button onClick={() => setMedia(true)}>Replace image</button>
              </>
            ) : (
              <Field
                label="Link destination (for links)"
                value={attributes.href || ""}
                onChange={(e) => attribute("href", e.target.value)}
              />
            )}
          </div>
        </div>
      )}
      {media && (
        <section className="inline-panel">
          <button onClick={() => setMedia(false)}>Close images</button>
          <MediaLibrary
            onSelect={(url) => {
              if (selected?.is("image")) selected.addAttributes({ src: url });
              else
                editor.current?.addComponents({
                  type: "image",
                  attributes: { src: url, alt: "" },
                });
              setMedia(false);
              editor.current?.AssetManager.close();
            }}
          />
        </section>
      )}
      {cssOpen && (
        <section className="inline-panel">
          <Textarea
            label="Page CSS"
            className="code-input resize-none"
            rows={12}
            value={css}
            onChange={(e) => setCss(e.target.value)}
          />
          <button onClick={() => editor.current?.setStyle(css)}>
            Apply page CSS
          </button>
          <p>
            CSS affects this page. Scripts and executable URLs are not
            supported.
          </p>
        </section>
      )}
    </section>
  );
}
