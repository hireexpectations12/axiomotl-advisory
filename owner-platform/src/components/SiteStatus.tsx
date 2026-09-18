"use client";
import { useEffect, useState } from "react";
import { api } from "./OwnerUI";
type Status = {
  checkedAt: string;
  publishedAt: string | null;
  version: number;
  role: string;
  email: string;
  links: { page: string; url: string; problem: string }[];
  forms: { name: string; errors: string[]; warnings: string[] }[];
};
export default function SiteStatus() {
  const [status, setStatus] = useState<Status>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      setStatus(await api<Status>("/api/status"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  return (
    <section className="settings-sections">
      <div className="section-heading">
        <div>
          <h2>Website status</h2>
          <p>
            Checks use the last saved draft. Save your edits before refreshing.
          </p>
        </div>
        <button disabled={busy} onClick={() => void refresh()}>
          Refresh checks
        </button>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {busy && <p role="status">Checking website…</p>}
      {status && (
        <>
          <section className="settings-panel">
            <h3>Publication and access</h3>
            <p>
              Last published:{" "}
              {status.publishedAt
                ? new Date(status.publishedAt).toLocaleString("en-AU")
                : "Not yet published"}
            </p>
            <p>
              Saved draft: {status.version} · Your role: {status.role}
            </p>
            <p>Checked: {new Date(status.checkedAt).toLocaleString("en-AU")}</p>
            <a href="/" target="_blank" rel="noreferrer">
              Open live website ↗
            </a>
          </section>
          <section className="settings-panel">
            <h3>Contact delivery</h3>
            <p>{status.email}</p>
          </section>
          <section className="settings-panel">
            <h3>Internal page and section links</h3>
            <p>
              {status.links.length
                ? `${status.links.length} link issues to review`
                : "No missing internal pages or sections found."}{" "}
              External websites, downloads and image availability are not
              checked here.
            </p>
            <ul>
              {status.links.map((link, i) => (
                <li key={i}>
                  {link.page} → {link.url || "empty link"}: {link.problem}
                </li>
              ))}
            </ul>
          </section>
          <section className="settings-panel">
            <h3>Form mapping</h3>
            {status.forms.map((form) => (
              <div key={form.name}>
                <h4>{form.name}</h4>
                {!form.errors.length && !form.warnings.length ? (
                  <p>No mapping issues found.</p>
                ) : (
                  <ul>
                    {form.errors.map((e, i) => (
                      <li key={`e${i}`}>Required fix: {e}</li>
                    ))}
                    {form.warnings.map((e, i) => (
                      <li key={`w${i}`}>Review: {e}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </section>
  );
}
