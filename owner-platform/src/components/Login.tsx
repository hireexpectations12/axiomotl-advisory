"use client";
import { useState, type FormEvent } from "react";
export default function Login({
  mode = "login",
}: {
  mode?: "login" | "recovery";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent, recover = false) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "login" && (!email.includes("@") || email.length > 254))
        throw new Error("Enter a valid email address.");
      if (
        !recover &&
        (!password ||
          (mode === "recovery" &&
            (password.length < 12 || password.length > 128)))
      )
        throw new Error(
          mode === "recovery"
            ? "Use a password between 12 and 128 characters."
            : "Enter your password.",
        );
      const response = await fetch(
        mode === "recovery"
          ? "/auth/password"
          : recover
            ? "/auth/recover"
            : "/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (recover) setMessage(data.message);
      else window.location.assign("/admin");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-shell">
      <form className="login-card" noValidate onSubmit={submit}>
        <p className="eyebrow">AXIOMOTL · OWNER WORKSPACE</p>
        <h1>{mode === "recovery" ? "Set your password" : "Welcome back"}</h1>
        <p>
          {mode === "recovery"
            ? "Choose a secure password for your owner account."
            : "Sign in with your invited owner account."}
        </p>
        {mode === "login" && (
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
        )}
        <label>
          Password
          <input
            id="owner-password"
            type={showPassword ? "text" : "password"}
            autoComplete={
              mode === "recovery" ? "new-password" : "current-password"
            }
            minLength={mode === "recovery" ? 12 : undefined}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          type="button"
          aria-controls="owner-password"
          aria-pressed={showPassword}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "Hide password" : "Show password"}
        </button>
        <button className="primary" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "recovery"
              ? "Save password"
              : "Sign in"}
        </button>
        {mode === "login" && (
          <button
            type="button"
            disabled={busy || !email}
            onClick={(event) => void submit(event, true)}
          >
            Send password recovery email
          </button>
        )}
        {message && <p role="status">{message}</p>}
        <a href="/">Back to website</a>
      </form>
    </main>
  );
}
