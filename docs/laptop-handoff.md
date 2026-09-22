# Continue on another laptop

This handoff preserves the website work in branch `codex/laptop-handoff-2026-09-22`.

Install Git and Node.js 22 or later (Node.js 24 was used for this handoff), then run:

```sh
git clone --branch codex/laptop-handoff-2026-09-22 https://github.com/hireexpectations12/axiomotl-advisory.git
cd axiomotl-advisory/owner-platform
npm ci
npm run dev
```

Open http://localhost:3000/design-preview for the source-generated design. Open the repository root in Codex and ask it to read this guide and `plans/README.md`. The next requested task is to make the website fully responsive; this handoff does not certify that task as complete.

## Current source and live content

`owner-platform/design/advisory/index.html` and `styles.css` are the current design-preview sources. `npm run dev` and `npm run build` regenerate `src/generated/combined.json` and the forms runtime. Other page designs and responsive overrides are preserved in `owner-platform/design/` alongside their publication scripts.

The published website content and dashboard drafts are stored in Supabase, separately from Git. For live content work, use the existing owner dashboard. Do not run `publish-*` or setup/import scripts merely to start local development: they can change the hosted site. Read `docs/remote-working.md` before publishing.

## Configuration and exclusions

The design preview can run without production credentials. If backend access is needed, transfer `owner-platform/.env.local` privately to the same relative path, or configure a development Supabase project using `.env.example`. Never commit this file or owner access/session files.

Website source, assets, mockups, design records, and plans are included. These local directories are excluded and remain on the original laptop:

- `outputs/`: generated exports, presentations, brand-kit deliverables, copied release trees, QA output, and database snapshots. Transfer specific deliverables privately if needed; they are not required to build the website. The optional `preview-services-page.ts` tool requires a locally generated snapshot from `inspect-services-state.mjs`.
- `backups/`: private local backups.
- `hallmark/`, `scroll-craft/`, `tools/SlopMonster/`: independent third-party Git checkouts. Website runtime files and the local scroll-craft skill are included separately.
- `sites/axiomotl-demo/`: a separate nested repository, not the owner-platform application.
- Dependencies, build caches, browser sessions, and secrets excluded by `.gitignore`.

## Switch laptops later

Commit and push changes before leaving one laptop. On the other, use `git pull --ff-only` before editing. Codex conversation history is not stored in this Git repository; this guide and the project plans provide the portable context.

The repository is being made public at the owner's request. Cloning needs no authentication; pushing still requires a GitHub account with write access.
