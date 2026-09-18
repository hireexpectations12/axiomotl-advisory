"use client";
import { useEffect, useState } from "react";
import { api, Field, Textarea } from "./OwnerUI";
import type { Enquiry } from "../lib/enquiries";
const empty = {
  name: "",
  email: "",
  organisation: "",
  message: "",
  source: "email",
};
type Result = {
  enquiries: Enquiry[];
  staff: { id: string; email: string }[];
  hasMore: boolean;
};
export default function Enquiries() {
  const [result, setResult] = useState<Result>({
    enquiries: [],
    staff: [],
    hasMore: false,
  });
  const [offset, setOffset] = useState(0);
  const [input, setInput] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  async function load(page = offset) {
    setResult(await api<Result>(`/api/enquiries?offset=${page}`));
  }
  useEffect(() => {
    void load(offset).catch((e) => setError(e.message));
  }, [offset]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await action();
      await load();
      setStatus("Enquiry saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function update(id: string, patch: object) {
    await api("/api/enquiries", {
      method: "PATCH",
      body: JSON.stringify({ id, ...patch }),
    });
  }
  return (
    <section className="settings-sections">
      <div>
        <h2>Enquiries</h2>
        <p>
          Record enquiries received by email or phone, assign follow-up and keep
          notes. Records are private to authorised staff and save immediately,
          separately from the website draft.
        </p>
        <p>
          Website submissions and email notifications remain on hold. Adding or
          updating a record does not contact the client.
        </p>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <p role="status">{status}</p>
      <details className="settings-panel">
        <summary>Record an enquiry</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api("/api/enquiries", {
                method: "POST",
                body: JSON.stringify(input),
              });
              setInput(empty);
            });
          }}
        >
          <div className="field-grid">
            <Field
              label="Enquirer name"
              required
              maxLength={120}
              value={input.name}
              onChange={(e) => setInput({ ...input, name: e.target.value })}
            />
            <Field
              label="Enquirer email (optional)"
              type="email"
              value={input.email}
              onChange={(e) => setInput({ ...input, email: e.target.value })}
            />
            <Field
              label="Organisation"
              maxLength={160}
              value={input.organisation}
              onChange={(e) =>
                setInput({ ...input, organisation: e.target.value })
              }
            />
            <label className="field">
              <span>Received through</span>
              <select
                value={input.source}
                onChange={(e) => setInput({ ...input, source: e.target.value })}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <Textarea
            label="Enquiry details"
            required
            maxLength={4000}
            rows={4}
            value={input.message}
            onChange={(e) => setInput({ ...input, message: e.target.value })}
          />
          <button disabled={busy} type="submit">
            Save enquiry
          </button>
        </form>
      </details>
      <div className="actions">
        <label className="field">
          <span>Filter this page by status</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <button disabled={busy} onClick={() => void run(async () => {})}>
          Refresh enquiries
        </button>
      </div>
      {result.enquiries.length === 0 && (
        <p>No enquiries recorded on this page.</p>
      )}
      {result.enquiries
        .filter((item) => !filter || item.status === filter)
        .map((item) => (
          <article className="settings-panel" key={item.id}>
            <h3>{item.name}</h3>
            <p>
              {item.email} {item.organisation ? `· ${item.organisation}` : ""}
            </p>
            <p>
              Received through {item.source} · Recorded{" "}
              {new Date(item.createdAt).toLocaleString("en-AU")}
            </p>
            <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {item.message}
            </p>
            <div className="field-grid">
              <label className="field">
                <span>Status for {item.name}</span>
                <select
                  value={item.status}
                  disabled={busy}
                  onChange={(e) =>
                    void run(() => update(item.id, { status: e.target.value }))
                  }
                >
                  <option value="new">New</option>
                  <option value="in_progress">In progress</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label className="field">
                <span>Assigned to for {item.name}</span>
                <select
                  value={item.assignee}
                  disabled={busy}
                  onChange={(e) =>
                    void run(() =>
                      update(item.id, { assignee: e.target.value }),
                    )
                  }
                >
                  <option value="">Unassigned</option>
                  {result.staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.email}
                    </option>
                  ))}
                  {item.assignee &&
                    !result.staff.some((s) => s.id === item.assignee) && (
                      <option value={item.assignee}>Former staff member</option>
                    )}
                </select>
              </label>
            </div>
            <details>
              <summary>Notes ({item.notes.length})</summary>
              <ol>
                {item.notes.map((note, i) => (
                  <li key={i}>
                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {note.text}
                    </p>
                    <small>
                      {note.actor} · {new Date(note.at).toLocaleString("en-AU")}
                    </small>
                  </li>
                ))}
              </ol>
            </details>
            <Textarea
              label={`New note for ${item.name}`}
              rows={2}
              maxLength={2000}
              value={notes[item.id] || ""}
              onChange={(e) =>
                setNotes({ ...notes, [item.id]: e.target.value })
              }
            />
            <button
              disabled={busy || !notes[item.id]?.trim()}
              onClick={() =>
                void run(async () => {
                  await update(item.id, { note: notes[item.id] });
                  setNotes((n) => ({ ...n, [item.id]: "" }));
                })
              }
            >
              Add note
            </button>
          </article>
        ))}
      <div className="actions">
        <button
          disabled={busy || offset === 0}
          onClick={() => setOffset(Math.max(0, offset - 20))}
        >
          Previous page
        </button>
        <span>Page {offset / 20 + 1}</span>
        <button
          disabled={busy || !result.hasMore}
          onClick={() => setOffset(offset + 20)}
        >
          Next page
        </button>
      </div>
    </section>
  );
}
