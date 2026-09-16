"use client";
import { useEffect, useState } from "react";
import type { MediaAsset, SiteDocument } from "@/lib/types";
import { api } from "./OwnerUI";

export default function MediaLibrary({
  onSelect,
  document,
}: {
  onSelect?: (url: string) => void;
  document?: SiteDocument;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(24);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api<MediaAsset[] | { assets: MediaAsset[] }>(
        "/api/media",
      );
      setAssets(Array.isArray(data) ? data : data.assets);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      ) ||
      file.size > 4 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPEG, WebP or GIF image under 4 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      await api("/api/media", { method: "POST", body });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const matches = assets.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="media-library">
      <div className="section-heading">
        <div>
          <h2>Media library</h2>
          <p>
            Upload an image, then choose it for your page. Existing versions
            keep their original images.
          </p>
        </div>
      </div>
      <label className="field">
        <span>Upload image · up to 4 MB</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={busy}
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <div className="search-row">
        <label className="field">
          <span>Find an image</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(24);
            }}
          />
        </label>
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setLimit(24);
            }}
          >
            Clear search
          </button>
        )}
      </div>
      <div role="status" aria-live="polite">
        {busy
          ? "Uploading image…"
          : loading
            ? "Loading media…"
            : `${matches.length} images`}
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error} <button onClick={() => void load()}>Retry loading</button>
        </div>
      )}
      {!loading && !matches.length && (
        <p className="empty">
          {query
            ? "No images match this name."
            : "No uploaded images yet. Choose a file above to get started."}
        </p>
      )}
      <div className="media-grid">
        {matches.slice(0, limit).map((asset) => (
          <article className="media-item" key={asset.id}>
            <img src={asset.url} alt="" loading="lazy" />
            <strong>{asset.name}</strong>
            <small>{Math.ceil(asset.size / 1024)} KB</small>
            {document && (
              <small>
                Draft references:{" "}
                {[
                  ...document.pages
                    .filter((page) => JSON.stringify(page).includes(asset.url))
                    .map((page) => page.title),
                  ...(JSON.stringify(document.settings).includes(asset.url)
                    ? ["Site settings"]
                    : []),
                ].join(", ") || "None"}
              </small>
            )}
            {onSelect ? (
              <button onClick={() => onSelect(asset.url)}>Use image</button>
            ) : (
              <a href={asset.url} target="_blank" rel="noreferrer">
                Open image
              </a>
            )}
          </article>
        ))}
      </div>
      {matches.length > limit && (
        <button onClick={() => setLimit(limit + 24)}>Show more images</button>
      )}
    </section>
  );
}
