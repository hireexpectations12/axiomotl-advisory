# Owner Platform Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement and review the isolated tasks below. Work in `owner-platform/`; do not alter prior mockups.

**Goal:** Deliver a deployable owner editor preserving the live site, with durable drafts, visual editing and editable interactive-form mappings.

**Architecture:** Next.js serves admin and public route handlers; GrapesJS stores page component projects. Supabase provides auth, PostgreSQL revisions and object storage. One shared pure form evaluator powers owner testing and public forms.

**Tech Stack:** TypeScript, Next.js, React, GrapesJS, Supabase, Vitest, Playwright.

**Spec:** `docs/owner-editor-design.md`

## Global constraints

- Keep the live deployment intact until the imported site and owner access have been verified.
- No public signup, default credentials, or auth bypass in production.
- Persistent backend must be configured before claiming live readiness.
- Never put service credentials in the browser; allowlisted owners only.
- Preserve source at `reference/production-2026-09-16.html`.
- Use immutable IDs and atomic publishing; prevent stale saves.
- New project has no commits or runnable baseline; use a new `codex/owner-platform` branch and a separate application directory. Existing untracked mockups remain untouched.

## Task 1 — Contracts, source import and runtime

Files: `owner-platform/package.json`, `src/lib/types.ts`, `scripts/import-site.ts`, `src/lib/render.ts`, `src/generated/baseline.json`, `public/site-assets/*`, `tests/render.test.ts`.

- [x] Define `SiteDocument` containing version, site settings, pages and forms; each `SitePage` has id, path, title, description, html, css and GrapesJS project data.
- [x] Write failing tests for script/unsafe URL rejection, protected page paths and safe rendering. Run `npm test -- tests/render.test.ts` and observe missing implementation.
- [x] Import actual deployed HTML with Cheerio, extract embedded assets/fonts and scripts, and create editor-compatible page data. Separate the reviewed runtime from owner-editable content.
- [x] Render published pages with configured metadata, CSS and controlled form bootstrap. Preserve layout styles and trusted animations. Run tests green.

## Task 2 — Editable form engine and owner form editor

Files: `src/lib/forms.ts`, `src/components/FormEditor.tsx`, `src/components/FormRunner.tsx`, `tests/forms.test.ts`.

Interfaces: `validateForm(form): {errors:string[],warnings:string[]}`; `evaluateForm(form,answers): {questionId?:string,outcomeId?:string,ruleId?:string,path:string[]}`. Answers map permanent question IDs to answer IDs. Rules contain all/any conditions and a typed question/outcome target. Outcomes contain title, body, outputs, CTA label and URL.

- [x] Add failing tests for branching, all/any matching, priority, fallback, cycle/reference validation and reordered IDs.
- [x] Implement deterministic evaluator and validation, bounded by supported form size. Render testable forms with back/restart and cleared unreachable answers.
- [x] Build question/answer/outcome/rule editors with move/add/remove actions and a live test runner. Expose import failures instead of silently dropping them.
- [x] Run unit tests and typecheck; report files and remaining integration needs.

## Task 3 — Persistent backend and authentication

Files: `supabase/migrations/001_owner_platform.sql`, `src/lib/server/*`, `src/app/api/*`, `src/app/auth/*`, `src/components/Login.tsx`, `tests/security.test.ts`.

Interfaces: GET `/api/site` => `{document,version,publishedAt}`; PUT `/api/site` body `{document,version}` => incremented version; POST `/api/publish` body `{version}`; GET `/api/revisions`; POST `/api/restore` body `{id,version}`; GET/POST `/api/media`; GET `/api/export`.

- [x] Write failing boundary tests for unsafe origins and invalid media; implement reusable checks.
- [x] Add RLS-protected membership, draft, revision, publication and asset tables. Use transaction functions with `expected_version` and immutable revisions; clients cannot bypass publication validation by invoking functions directly.
- [x] Implement cookie sessions, invitation-only sign-in, recovery, server-verified membership and same-origin mutations. Check membership for every admin endpoint.
- [x] Add validated uploads with magic-byte checks, immutable object keys and export; no deletion of referenced objects.
- [x] Provide an executable provisioning script and SQL integration tests for concurrent saves, denied access and atomic restore/publish. Run locally where database tooling exists; clearly report unavailable credentials.

## Task 4 — Dashboard and visual page editor

Files: `src/app/admin/*`, `src/components/Dashboard.tsx`, `src/components/PageEditor.tsx`, `src/components/MediaLibrary.tsx`, `src/app/admin/admin.css`, `DESIGN.md`.

- [x] Create a marine/navy workspace matching the deployed brand: left navigation, clear document status and top save/preview/publish controls.
- [x] Integrate GrapesJS with selection, layers, blocks, styles, responsive canvas and undo/redo. Preserve SVG and trusted form mounts; no custom script injection.
- [x] Add page CRUD/settings, global branding, media selection/upload, form editor, revisions/restore and full export.
- [x] Report loading, unauthenticated, unconfigured, save failures and conflict states accurately. Preserve unsaved work; never present browser storage as the durable backend.
- [x] Add browser tests for local isolated editor tooling without an authentication bypass in the application; exercise actual authenticated flow when backend configured.

## Task 5 — Integration, review and deployment readiness

Files: `README.md`, `.env.example`, `playwright.config.ts`, `tests/e2e/*`, `docs/owner-guide.md`.

- [x] Run typecheck, unit tests, production build and dependency audit. Review server authorization, rendered HTML isolation, URLs, file upload and SQL privileges.
- [x] Run browser checks at desktop/mobile: public form behaviour, editor round-trip, settings, preview, error handling and keyboard.
- [x] Configure backend if credentials become available, seed imported project, invite owner, run authenticated persistence tests and deploy a preview.
- [ ] Compare preview with production and promote only after required tests. Otherwise provide the tested local artifact and precise remaining setup, without claiming the backend is live.

## Progress ledger

- Plan approved through the preceding design conversation; execution authorized by “looks good”.
- Supabase configured with private server credentials; owner tytal1293@gmail.com provisioned. Vercel preview and production environment variables configured.
- Imported source, visual editor, form mapping editor, persistent media, revisions and authentication implemented and reviewed.
- 71 unit/database tests, 10 browser tests, typecheck, production build and formatting checks pass. Real hosted Supabase access, save/restore/export, upload, access denial and sandbox preview checks pass.
- Tested preview: https://axiomotl-advisory-n0wgdpbke-hire-expectations-projects.vercel.app. Original static production remains unchanged.
- Remaining: confirm migration 002, configure/test recovery emails, owner password setup, then explicit production rollout approval. See owner-platform/docs/verification.md.
