"use client";
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export function Field({
  label,
  help,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span id={`${id}-label`}>{label}</span>
      <input
        {...props}
        id={id}
        aria-labelledby={`${id}-label`}
        aria-describedby={help ? `${id}-help` : undefined}
      />
      {help && <small id={`${id}-help`}>{help}</small>}
    </label>
  );
}
export function Textarea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea
        {...props}
        id={id}
        className={`resize-none ${props.className || ""}`}
        style={{ resize: "none", ...props.style }}
      />
    </label>
  );
}
export function Confirm({
  title,
  children,
  action,
  onConfirm,
  onCancel,
  busy,
}: {
  title: string;
  children: ReactNode;
  action: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <section className="confirmation" aria-label={title}>
      <h3>{title}</h3>
      <p>{children}</p>
      <div className="actions">
        <button autoFocus onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="danger" onClick={onConfirm} disabled={busy}>
          {action}
        </button>
      </div>
    </section>
  );
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
    signal: options?.signal ?? AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      data.error ||
        (response.status === 401
          ? "Your session has expired. Sign in again in another tab, then retry. Your changes remain here."
          : `Request failed (${response.status}). Please retry.`),
      response.status,
    );
  return data as T;
}
