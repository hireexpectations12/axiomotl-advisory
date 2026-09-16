"use client";
import { useEffect, useState } from "react";
import type { SiteState } from "../lib/types";
import Dashboard from "./Dashboard";
import Login from "./Login";

export default function AdminGate({
  recovery = false,
}: {
  recovery?: boolean;
}) {
  const [state, setState] = useState<SiteState>();
  const [status, setStatus] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (recovery) return;
    const controller = new AbortController();
    fetch("/api/site", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        setStatus(response.status);
        if (response.ok) setState(body);
        else setError(body.error || "The workspace could not load.");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setError("Connection failed. Check your network and reload.");
          setStatus(503);
        }
      });
    return () => controller.abort();
  }, [recovery]);
  if (recovery) return <Login mode="recovery" />;
  if (state) return <Dashboard initialState={state} />;
  if (status === 401) return <Login />;
  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">AXIOMOTL · OWNER WORKSPACE</p>
        <h1>{status ? "Workspace unavailable" : "Opening your workspace"}</h1>
        <p role="status">{error || "Checking your session…"}</p>
        {status > 0 && (
          <div className="row">
            <button className="button" onClick={() => window.location.reload()}>
              Try again
            </button>
            <a href="/">Back to website</a>
          </div>
        )}
      </section>
    </main>
  );
}
