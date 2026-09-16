# Axiomotl owner platform

Next.js website and private owner workspace with GrapesJS page editing, editable form mappings, Supabase authentication, durable drafts, revision history and image storage.

The recovered production website is the starting document. The source archive remains at `../reference/production-2026-09-16.html`; the imported document is `src/generated/baseline.json`. Existing mockups outside this application are separate artifacts.

## Current setup

The dedicated Supabase project is `ofcuikmhcbbedxkmfuxy`. The initial migration has been applied and owner membership created for `ty@cplace.com.au`. Credentials and one-use access links stay in ignored local files; they are not documented here. This setup does not itself deploy or replace the existing Vercel website. Confirm the latest live verification results before promoting a deployment.

## Run locally

Use Node.js 22 or later and npm. From this directory:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` for the website and `/admin` for the owner workspace. `predev` and `prebuild` rebuild the public form bundle from the same React component and evaluator used by the owner preview.

Before handover only, `node scripts/verify-owner.mjs --import-baseline` runs the hosted-auth/storage workflow and imports the reviewed original source into the database. It uploads the original images, publishes the baseline, verifies draft isolation/conflicts/restore/export, and restores the baseline draft. It consumes a local setup link and changes site state; do not run after the owner has started editing.

Create `.env.local` with the following server environment values. Do not add a `NEXT_PUBLIC_` prefix to these variables.

| Variable                    | Purpose                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`              | Supabase project URL                                                                                     |
| `SUPABASE_ANON_KEY`         | Publishable key or legacy anon key                                                                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret key or legacy service-role key; never expose to visitors                                   |
| `APP_URL`                   | Exact browser origin, e.g. `http://localhost:3000` locally and the HTTPS website origin after deployment |
| `SITE_ID`                   | Optional; defaults to `00000000-0000-4000-8000-000000000001`                                             |

Missing configuration produces an explicit unavailable response for owner functions. An unconfigured public application can display the imported baseline. Real database errors are reported; they do not silently substitute a local draft.

## Set up a fresh Supabase project

1. Apply `supabase/migrations/001_owner_platform.sql` in the SQL editor **once**, to a dedicated project. It creates the site, membership, draft, revision, publication and asset tables, transaction functions, policies and `site-media` bucket. It is an initial migration, not a repeatable reset script. Then apply `002_conflict_status.sql`; for an existing project, apply only migrations it has not received. Migration 002 gives stale saves an explicit HTTP 409 status through PostgREST.
2. Disable public signups in Authentication settings. An Auth user without a matching `memberships` row cannot access the workspace.
3. Set the Auth Site URL and allowed redirect URLs to the application origin and `/auth/callback`. For local development, allow the local callback as well.
4. Configure a working email sender for recovery. The default recovery email works with the app's PKCE flow when the exact recovery redirect URL is allowed; open it in the same browser that requested recovery. New Free projects using the default sender cannot customize templates (Supabase policy from 3 June 2026). If custom templates are available, the optional token-hash links below are also supported. Email delivery and completion still require an end-to-end check.
5. Configure `.env.local`, then create owner access explicitly:

```sh
npx tsx --env-file=.env.local scripts/setup-owner.ts owner@example.com
```

The script creates or finds the Auth identity, adds site membership and writes a private one-use password setup link to `.owner-access.txt` and `.owner-access.json`. It **does not send email**. Open the text file locally and use its link while the application is running at `APP_URL`. After it is consumed or expires, rerunning the script generates another link. Remove consumed access files when they are no longer needed. Never publish these files or the `.auth-state.json` browser session file.

Supabase email template link targets:

```text
Invitation:
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite

Password recovery:
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery
```

The callback also accepts PKCE `code` exchanges. Successful owner setup opens the password form; use a password of 12–128 characters. Recovery emails are initiated only by the owner's explicit recovery action. Email delivery must be tested independently of the locally generated setup link.

## Development and checks

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` includes routing, rendering, security boundaries and SQL transaction checks. The SQL tests execute PostgreSQL through PGlite with minimal Auth/Storage schema fixtures; they do not exercise Supabase email delivery or hosted object storage. Browser editor tests use isolated mocked API responses where indicated in the test source; the application has no authentication bypass.

`scripts/verify-connection.mjs` is a separate, state-changing first-connection check. With the local server running, it consumes `.owner-access.json`, verifies a real owner session, seeds and publishes the original document, tests save/conflict/restore, verifies guest denial and writes a private browser session. It refuses an already-published project. Run it only deliberately on a newly configured test/project setup, not as a routine production health check:

```sh
node scripts/verify-connection.mjs
```

The import command regenerates the baseline and bundled assets from the archived source; it does not overwrite an existing Supabase draft:

```sh
npm run import:site
```

## Storage and security model

- Every owner API verifies the Auth user and site membership. Mutations require an Origin matching `APP_URL`.
- Draft saves use a version number; stale writes return HTTP 409. Publish and restore run under a database lock. Publication validates the exact saved document before changing the live pointer.
- Only the server service role may invoke the mutation function. Anonymous visitors can call only the explicit published-document read function. RLS restricts owner table reads.
- Every published revision and the original baseline are retained. Restoring copies a historical document into a new draft and does not publish it.
- Owner responses are private and non-cacheable. Draft preview runs with a sandbox policy. Admin pages reject framing, and public output uses a content security policy and sanitized markup.
- Uploads accept PNG, JPEG, GIF and WebP detected by magic bytes, up to 4 MB. SVG uploads are rejected. Media URLs are public: do not upload confidential material. Object paths are immutable; the application does not delete retained assets.
- JSON save requests are limited to 4 MB. Server schema limits include 50 questions, 50 choices per question, 100 outcomes and 200 rules per form. The editor supports configured interactions, not arbitrary custom JavaScript.

## Deploy and hand over

Deploy this directory as the Next.js project root. Set all environment values on the deployment, using its actual origin for `APP_URL`; update Auth URLs to match. Preview origins need matching configuration. An alias/origin mismatch intentionally blocks mutations. Verify public forms, owner sign-in, recovery, media, save from a second session, publication and restore on the deployed application before switching production traffic.

On Vercel preview deployments the application automatically uses the trusted `VERCEL_URL` as its origin; use the exact deployment URL for testing rather than a branch alias. Production uses `APP_URL`. The private access-link script accepts an optional third argument with the preview origin: `npx tsx --env-file=.env.local scripts/setup-owner.ts owner@example.com https://preview-host.vercel.app`.

Ownership has separate parts:

1. **Supabase:** transfer the dedicated project to the recipient's organization from project General settings. The transferring person must own the source organization and belong to the target; review current integration and billing prerequisites before transfer. See [Supabase project transfers](https://supabase.com/docs/guides/platform/project-transfer).
2. **Vercel:** transfer the hosting project to the recipient's team separately. Review the transfer summary, environment variables, domains, billing and linked repository. See [Vercel project transfers](https://vercel.com/docs/projects/transferring-projects).
3. **Source:** provide or transfer the Git repository, including this application, lockfile, migrations, import source and bundled assets. A Vercel or Supabase transfer does not grant source-repository ownership automatically.
4. **Domain and mail:** transfer the registrar/DNS and recovery-email sender access where relevant. Verify their billing contacts.
5. **Owner login:** create the recipient's Auth membership and let them set their own password. Organization ownership and application membership are separate. Confirm their access before removing the previous membership and team access. Rotate shared credentials and update deployment secrets after the handover.

This project does not automatically select a paid plan. Confirm the recipient's provider plans, backup availability and costs in their accounts before accepting a transfer.

## Export, backups and recovery

The workspace's **Download site export** downloads the current **saved draft**, editor project data, settings, asset references and rendered page HTML. It does not include image binaries, database history, authentication identities or provider settings. There is no built-in upload-and-restore export workflow. Unsaved work can be downloaded separately when the workspace reports a conflict/error.

For a complete recovery plan, retain:

- Database backups including site tables, memberships, all revisions and publication pointers; include Auth identities using the provider-supported backup process.
- A separate copy of the `site-media` bucket. PostgreSQL metadata alone is not the image files.
- The source repository, lockfile, `public/site-assets`, generated baseline and runtime assets.
- A secure record of deployment environment names/values, Auth/email configuration, domain/DNS configuration and account ownership.

For a routine content rollback, choose a revision in History, restore it to draft, preview and publish. For disaster recovery, restore database and storage into an isolated environment, reconcile Auth user IDs/memberships, configure new credentials, verify asset URLs and run owner/public checks before switching traffic. A new storage project may require URL remapping. Revision history and JSON exports are useful recovery aids but are not independent backups.

See [the owner guide](docs/owner-guide.md) for everyday editing.
