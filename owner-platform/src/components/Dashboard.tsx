"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Revision, SiteDocument, SitePage, SiteState } from "@/lib/types";
import PageEditor from "./PageEditor";
import MediaLibrary from "./MediaLibrary";
import FormEditor from "./FormEditor";
import { ApiError, api, Confirm, Field, Textarea } from "./OwnerUI";

type Section = "Pages" | "Forms" | "Media" | "Site settings" | "History";
export default function Dashboard({
  initialState,
}: {
  initialState: SiteState;
}) {
  const [state, setState] = useState(initialState);
  const [section, setSection] = useState<Section>("Pages");
  const [pageId, setPageId] = useState(
    initialState.document.pages[0]?.id || "",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [status, setStatus] = useState(
    "Draft loaded. Changes stay private until you publish.",
  );
  const [confirmation, setConfirmation] = useState<
    "publish" | "delete" | "reload" | "logout" | Revision | null
  >(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(20);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const latest = useRef(state);
  const generation = useRef(0);
  const savedGeneration = useRef(0);
  const inFlight = useRef(false);
  latest.current = state;
  const page =
    state.document.pages.find((p) => p.id === pageId) ||
    state.document.pages[0];

  const changeDocument = useCallback((document: SiteDocument) => {
    generation.current += 1;
    setState((s) => ({ ...s, document }));
    latest.current = { ...latest.current, document };
    setDirty(true);
    setStatus("Unsaved changes");
  }, []);
  function changePage(next: SitePage) {
    changeDocument({
      ...latest.current.document,
      pages: latest.current.document.pages.map((p) =>
        p.id === next.id ? next : p,
      ),
    });
  }
  const save = useCallback(async (): Promise<SiteState | null> => {
    if (inFlight.current) return null;
    if (savedGeneration.current === generation.current) return latest.current;
    if (conflict) return null;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setStatus("Saving draft…");
    const submittedGeneration = generation.current;
    try {
      const result = await api<SiteState>("/api/site", {
        method: "PUT",
        body: JSON.stringify({
          document: latest.current.document,
          version: latest.current.version,
        }),
      });
      savedGeneration.current = submittedGeneration;
      const next = {
        ...result,
        document:
          generation.current === submittedGeneration
            ? result.document
            : latest.current.document,
      };
      latest.current = next;
      setState(next);
      const pending = generation.current !== submittedGeneration;
      setDirty(pending);
      setStatus(
        pending
          ? "New changes waiting to save"
          : `Draft saved at ${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`,
      );
      return pending ? null : result;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setConflict(true);
        setError(
          "Another session saved a newer draft. Your changes are still here. Download your work before loading the latest draft, then reapply your changes.",
        );
      } else setError((e as Error).message);
      setStatus("Draft not saved");
      return null;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [conflict]);
  useEffect(() => {
    if (!dirty || busy || conflict || error) return;
    const timer = setTimeout(() => void save(), 1800);
    return () => clearTimeout(timer);
  }, [state.document, dirty, busy, conflict, error, save]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (generation.current !== savedGeneration.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  useEffect(() => {
    document.title = `${section} · Axiomotl owner workspace`;
  }, [section]);
  async function loadHistory() {
    setHistoryLoading(true);
    try {
      setRevisions(
        (await api<{ revisions: Revision[] }>("/api/revisions")).revisions,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setHistoryLoading(false);
    }
  }
  useEffect(() => {
    if (section === "History") void loadHistory();
  }, [section]);
  function downloadWork() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(latest.current.document, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "axiomotl-unsaved-work.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function reload() {
    setBusy(true);
    try {
      const result = await api<SiteState>("/api/site");
      latest.current = result;
      setState(result);
      generation.current = 0;
      savedGeneration.current = 0;
      setDirty(false);
      setConflict(false);
      setError("");
      setPageId(result.document.pages[0]?.id || "");
      setEditorEpoch((n) => n + 1);
      setStatus("Latest draft loaded");
      setConfirmation(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    const result = await save();
    if (!result) return;
    setBusy(true);
    inFlight.current = true;
    const publishingGeneration = generation.current;
    try {
      const published = await api<SiteState>("/api/publish", {
        method: "POST",
        body: JSON.stringify({ version: result.version }),
      });
      const next = {
        ...published,
        document:
          generation.current === publishingGeneration
            ? published.document
            : latest.current.document,
      };
      latest.current = next;
      setState(next);
      setStatus("Published. The saved revision is now live.");
      setError("");
      setConfirmation(null);
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError && e.status === 409) setConflict(true);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  async function restore(revision: Revision) {
    setBusy(true);
    inFlight.current = true;
    try {
      const result = await api<SiteState>("/api/restore", {
        method: "POST",
        body: JSON.stringify({
          id: revision.id,
          version: latest.current.version,
        }),
      });
      latest.current = result;
      setState(result);
      generation.current = 0;
      savedGeneration.current = 0;
      setDirty(false);
      setConflict(false);
      setError("");
      setPageId(result.document.pages[0]?.id || "");
      setEditorEpoch((n) => n + 1);
      setSection("Pages");
      setConfirmation(null);
      setStatus("Revision restored to draft. Preview it before publishing.");
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError && e.status === 409) setConflict(true);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  async function preview() {
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      setError(
        "Your browser blocked the preview tab. Allow pop-ups for this workspace, then retry Preview.",
      );
      return;
    }
    tab.opener = null;
    tab.document.title = "Preparing website preview";
    tab.document.body.textContent =
      "Saving your draft and preparing the preview…";
    const result = await save();
    if (result && page)
      tab.location.replace(`/api/preview?page=${encodeURIComponent(page.id)}`);
    else tab.close();
  }
  function addPage(copy?: SitePage) {
    const id = crypto.randomUUID();
    const next: SitePage = copy
      ? {
          ...structuredClone(copy),
          id,
          path: `/page-${id.slice(0, 8)}`,
          title: `${copy.title} copy`,
        }
      : {
          id,
          path: `/page-${id.slice(0, 8)}`,
          title: "New page",
          description: "",
          socialImage: "",
          noIndex: false,
          html: '<main><section style="padding:80px 24px"><h1>Your new page</h1><p>Make this space your own.</p></section></main>',
          css: "",
          project: null,
        };
    changeDocument({
      ...state.document,
      pages: [...state.document.pages, next],
    });
    setPageId(id);
    setSettingsOpen(true);
  }
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please retry.");
      window.location.assign("/admin/login");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="owner-shell">
      <aside className="owner-sidebar">
        <a className="owner-brand" href="/" target="_blank" rel="noreferrer">
          <span className="brand-mark">a.</span>
          <span>
            axiomotl<small>OWNER WORKSPACE</small>
          </span>
        </a>
        <p className="sidebar-label">YOUR WEBSITE</p>
        <nav aria-label="Workspace">
          {(
            ["Pages", "Forms", "Media", "Site settings", "History"] as Section[]
          ).map((name, index) => (
            <button
              key={name}
              aria-current={section === name ? "page" : undefined}
              onClick={() => {
                setSection(name);
                setConfirmation(null);
              }}
            >
              <span aria-hidden="true">{["▤", "⑂", "▧", "◉", "↶"][index]}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/api/export" download>
            Download site export ↗
          </a>
          <button
            onClick={() => (dirty ? setConfirmation("logout") : void logout())}
          >
            Sign out
          </button>
          <small>
            Drafts are private.
            <br />
            You decide when to go live.
          </small>
        </div>
      </aside>
      <main className="owner-main">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">AXIOMOTL ADVISORY</p>
            <h1>{section}</h1>
          </div>
          <div className="publish-actions">
            <button
              onClick={() => void save()}
              disabled={busy || !dirty || conflict}
            >
              Save draft
            </button>
            <button onClick={() => void preview()} disabled={busy || conflict}>
              Preview ↗
            </button>
            <button
              className="primary"
              onClick={() => setConfirmation("publish")}
              disabled={busy || conflict}
            >
              Publish
            </button>
          </div>
        </header>
        <div className="document-status">
          <span role="status" aria-live="polite">
            <i className={dirty ? "status-dot pending" : "status-dot"} />
            {status}
          </span>
          <span>
            {state.publishedAt
              ? `Live since ${new Date(state.publishedAt).toLocaleString("en-AU")}`
              : "Not published yet"}{" "}
            · draft {state.version}
          </span>
        </div>
        <div className="workspace-content">
          {error && (
            <div className="notice error" role="alert">
              <strong>
                {conflict ? "Draft conflict" : "Action could not finish"}
              </strong>
              <p>{error}</p>
              <div className="actions">
                <button onClick={downloadWork}>Download my work</button>
                {conflict ? (
                  <button onClick={() => setConfirmation("reload")}>
                    Load latest draft…
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      void save();
                    }}
                  >
                    Retry save
                  </button>
                )}
                <a href="/admin/login" target="_blank" rel="noreferrer">
                  Sign in in another tab
                </a>
              </div>
            </div>
          )}
          {confirmation === "publish" && (
            <Confirm
              title="Publish this website?"
              action="Publish website"
              busy={busy}
              onCancel={() => setConfirmation(null)}
              onConfirm={() => void publish()}
            >
              Your draft pages, site settings and form mappings will become
              public together. Review the preview first.{" "}
              {dirty ? "Your changes will be saved before publishing." : ""}
            </Confirm>
          )}
          {confirmation === "reload" && (
            <Confirm
              title="Replace local changes?"
              action="Load latest draft"
              busy={busy}
              onCancel={() => setConfirmation(null)}
              onConfirm={() => void reload()}
            >
              This discards changes in this tab. Download your work above before
              continuing.
            </Confirm>
          )}
          {confirmation === "logout" && (
            <Confirm
              title="Sign out with unsaved changes?"
              action="Sign out"
              busy={busy}
              onCancel={() => setConfirmation(null)}
              onConfirm={() => void logout()}
            >
              Changes in this tab will be lost. Cancel and save or download your
              work first.
            </Confirm>
          )}
          {confirmation && typeof confirmation === "object" && (
            <Confirm
              title={`Restore ${confirmation.label}?`}
              action="Restore to draft"
              busy={busy}
              onCancel={() => setConfirmation(null)}
              onConfirm={() => void restore(confirmation)}
            >
              This replaces the working draft, including unsaved changes and
              form mappings. The live website stays on its current revision
              until you publish.{" "}
              <button onClick={downloadWork}>Download current work</button>
            </Confirm>
          )}
          <fieldset
            className="workspace-editable"
            disabled={busy && confirmation !== null}
          >
            {section === "Pages" && (
              <>
                <div className="section-heading">
                  <div>
                    <h2>Shape your website</h2>
                    <p>
                      Edit the canvas, then preview the complete page before
                      publishing.
                    </p>
                  </div>
                  <button onClick={() => addPage()}>Add page</button>
                </div>
                <div className="page-navigation">
                  <label className="field">
                    <span>Current page</span>
                    <select
                      value={page?.id || ""}
                      onChange={(e) => {
                        setPageId(e.target.value);
                        setConfirmation(null);
                      }}
                    >
                      {state.document.pages.map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.title} · {p.path}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    aria-expanded={settingsOpen}
                    onClick={() => setSettingsOpen(!settingsOpen)}
                  >
                    Page settings
                  </button>
                  <button
                    disabled={!page}
                    onClick={() => page && addPage(page)}
                  >
                    Duplicate page
                  </button>
                </div>
                {page && settingsOpen && (
                  <section className="settings-panel">
                    <div className="field-grid">
                      <Field
                        label="Page title"
                        value={page.title}
                        onChange={(e) =>
                          changePage({ ...page, title: e.target.value })
                        }
                      />
                      <Field
                        label="Page path"
                        value={page.path}
                        help="Start with /. The paths /admin, /api and /auth are reserved."
                        onChange={(e) =>
                          changePage({ ...page, path: e.target.value })
                        }
                      />
                      <Field
                        label="Social image URL"
                        value={page.socialImage}
                        onChange={(e) =>
                          changePage({ ...page, socialImage: e.target.value })
                        }
                      />
                      <Textarea
                        className="resize-none"
                        label="Search description"
                        value={page.description}
                        rows={3}
                        onChange={(e) =>
                          changePage({ ...page, description: e.target.value })
                        }
                      />
                    </div>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={page.noIndex}
                        onChange={(e) =>
                          changePage({ ...page, noIndex: e.target.checked })
                        }
                      />
                      Ask search engines not to index this page
                    </label>
                    <button
                      className="danger"
                      disabled={
                        state.document.pages.length < 2 || page.path === "/"
                      }
                      onClick={() => setConfirmation("delete")}
                    >
                      Delete page
                    </button>
                    {page.path === "/" && (
                      <small>The home page cannot be deleted.</small>
                    )}
                    {confirmation === "delete" && (
                      <Confirm
                        title={`Delete ${page.title}?`}
                        action="Delete page"
                        onCancel={() => setConfirmation(null)}
                        onConfirm={() => {
                          changeDocument({
                            ...state.document,
                            pages: state.document.pages.filter(
                              (p) => p.id !== page.id,
                            ),
                          });
                          setPageId(
                            state.document.pages.find((p) => p.id !== page.id)
                              ?.id || "",
                          );
                          setConfirmation(null);
                        }}
                      >
                        This removes the page from your draft. It takes effect
                        publicly when you publish. Links to this page must be
                        updated.
                      </Confirm>
                    )}
                  </section>
                )}
                {page && (
                  <PageEditor
                    key={`${page.id}-${editorEpoch}`}
                    page={page}
                    forms={state.document.forms}
                    onChange={changePage}
                  />
                )}
              </>
            )}
            {section === "Forms" && (
              <div className="form-editor">
                <FormEditor
                  forms={state.document.forms}
                  onChange={(forms) =>
                    changeDocument({ ...latest.current.document, forms })
                  }
                />
              </div>
            )}
            {section === "Media" && <MediaLibrary document={state.document} />}
            {section === "Site settings" && (
              <section className="site-settings">
                <h2>The details that carry across your site</h2>
                <p>
                  Brand colours, contact information and presentation. Edit
                  navigation links directly in each page canvas.
                </p>
                <div className="field-grid">
                  {(
                    [
                      "name",
                      "email",
                      "logo",
                      "favicon",
                      "font",
                      "background",
                      "foreground",
                      "accent",
                    ] as const
                  ).map((key) => (
                    <Field
                      key={key}
                      label={
                        {
                          name: "Site name",
                          email: "Contact email",
                          logo: "Logo URL",
                          favicon: "Favicon URL",
                          font: "Font family",
                          background: "Background colour",
                          foreground: "Text colour",
                          accent: "Accent colour",
                        }[key]
                      }
                      value={state.document.settings[key]}
                      onChange={(e) =>
                        changeDocument({
                          ...state.document,
                          settings: {
                            ...state.document.settings,
                            [key]: e.target.value,
                          },
                        })
                      }
                    />
                  ))}
                </div>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={state.document.settings.motion}
                    onChange={(e) =>
                      changeDocument({
                        ...state.document,
                        settings: {
                          ...state.document.settings,
                          motion: e.target.checked,
                        },
                      })
                    }
                  />
                  Enable supported page animations (respects reduced-motion
                  preferences)
                </label>
                <Textarea
                  label="Global CSS"
                  className="code-input resize-none"
                  rows={14}
                  value={state.document.settings.customCss}
                  onChange={(e) =>
                    changeDocument({
                      ...state.document,
                      settings: {
                        ...state.document.settings,
                        customCss: e.target.value,
                      },
                    })
                  }
                />
                <p>
                  Global styles affect every page. Use Preview to check your
                  changes at different screen sizes.
                </p>
              </section>
            )}
            {section === "History" && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Published revisions</h2>
                    <p>
                      Restore a complete version to your draft, inspect it, then
                      publish when ready.
                    </p>
                  </div>
                  <button
                    onClick={() => void loadHistory()}
                    disabled={historyLoading}
                  >
                    Refresh history
                  </button>
                </div>
                {historyLoading ? (
                  <p role="status">Loading revisions…</p>
                ) : !revisions.length ? (
                  <p className="empty">
                    No saved revisions yet. Your first publication will appear
                    here.
                  </p>
                ) : (
                  <ol className="revision-list">
                    {revisions.slice(0, historyLimit).map((revision) => (
                      <li key={revision.id}>
                        <div>
                          <strong>{revision.label}</strong>
                          <time dateTime={revision.created_at}>
                            {new Date(revision.created_at).toLocaleString(
                              "en-AU",
                            )}
                          </time>
                          <small>By {revision.created_by}</small>
                        </div>
                        <button
                          disabled={busy || conflict}
                          onClick={() => setConfirmation(revision)}
                        >
                          Restore…
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                {revisions.length > historyLimit && (
                  <button onClick={() => setHistoryLimit(historyLimit + 20)}>
                    Show older revisions
                  </button>
                )}
              </section>
            )}
          </fieldset>
        </div>
      </main>
    </div>
  );
}
