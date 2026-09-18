"use client";
import { useEffect, useState } from "react";
import { api, Field, Confirm } from "./OwnerUI";
import type { StaffRole } from "../lib/types";
type Staff = { id: string; email: string; role: StaffRole };
export default function StaffSettings() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [remove, setRemove] = useState<Staff | null>(null);
  async function load() {
    setStaff((await api<{ staff: Staff[] }>("/api/staff")).staff);
  }
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="settings-sections">
      <div>
        <h2>Staff access</h2>
        <p>
          These changes take effect immediately. They are separate from website
          publishing.
        </p>
        <p>
          Editors can edit and preview drafts. Publishers can also publish and
          restore. Only owners can manage staff. Owner accounts are protected.
        </p>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <ul className="revision-list">
        {staff.map((member) => (
          <li key={member.id}>
            <div>
              <strong>{member.email}</strong>
              <small>{member.role}</small>
            </div>
            {member.role !== "owner" && (
              <div className="actions">
                <label className="field">
                  <span>Role for {member.email}</span>
                  <select
                    value={member.role}
                    disabled={busy}
                    onChange={(e) =>
                      void run(async () => {
                        await api("/api/staff", {
                          method: "PATCH",
                          body: JSON.stringify({
                            id: member.id,
                            role: e.target.value,
                          }),
                        });
                      })
                    }
                  >
                    <option value="editor">Editor</option>
                    <option value="publisher">Publisher</option>
                  </select>
                </label>
                <button disabled={busy} onClick={() => setRemove(member)}>
                  Remove access
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {remove && (
        <Confirm
          title={`Remove access for ${remove.email}?`}
          action="Remove access"
          busy={busy}
          onCancel={() => setRemove(null)}
          onConfirm={() =>
            void run(async () => {
              await api("/api/staff", {
                method: "PATCH",
                body: JSON.stringify({ id: remove.id, remove: true }),
              });
              setRemove(null);
            })
          }
        >
          This removes access to this website. It does not delete the person's
          account.
        </Confirm>
      )}
      <form
        className="settings-panel"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const result = await api<{ setupUrl: string }>("/api/staff", {
              method: "POST",
              body: JSON.stringify({ email, role }),
            });
            setLink(result.setupUrl);
            setEmail("");
          });
        }}
      >
        <h3>Add a new staff account</h3>
        <p>
          No email will be sent. Share the private, one-use setup link with the
          employee through your approved channel.
        </p>
        <div className="field-grid">
          <Field
            label="Staff email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="field">
            <span>New staff role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="editor">Editor</option>
              <option value="publisher">Publisher</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={busy || !email}>
          Create staff access
        </button>
      </form>
      {link && (
        <div className="settings-panel">
          <Field label="Private one-use setup link" value={link} readOnly />
          <p>
            Copy this link now. It expires and is only displayed in this tab. Do
            not place it on the public website.
          </p>
          <button onClick={() => setLink("")}>Hide setup link</button>
        </div>
      )}
    </section>
  );
}
