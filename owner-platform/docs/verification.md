# Verification and rollout status

## Completed on 16 September 2026

- Production source recovered from Vercel, imported and made editable.
- Connected the dedicated Supabase project; database migration 001 and owner membership exist.
- Owner identity: `tytal1293@gmail.com`. Password setup uses a private one-use link, not a shared/default password.
- Original images uploaded into the persistent owner media library.
- TypeScript checks pass. 71 unit/database tests pass. 10 Chromium browser tests pass.
- Browser tests cover visual editor save/reload with server validation, page settings, conflict recovery, form outcome editing, mobile layout, publication confirmation, both public forms and two script-injection regressions.
- Real Supabase tests pass for authentication, uploads, unsafe-file rejection, saved drafts, public/draft isolation, stale-save preflight, wrong-origin rejection, restore, export and anonymous draft denial.
- Local and hosted authenticated dashboards and isolated previews load successfully; the preview loads Nunito and the interactive form runtime. Trusted scripts and fonts are embedded in the opaque sandbox so Vercel protection does not block them.
- Verified preview: https://axiomotl-advisory-n0wgdpbke-hire-expectations-projects.vercel.app (Vercel account access required).
- Production build passes. Production dependency audit reports zero vulnerabilities.

## Rollout gates

- Confirm hosted migration `002_conflict_status.sql` has been applied. This changes SQL conflicts to PT409 and stops stalled test queries caused by PostgREST retrying SQLSTATE 40001. The app also rejects stale versions before the transaction, but the SQL-level race guard still needs this correction.
- Configure Supabase recovery email templates and redirect/Site URLs, and test delivery. No recovery email has been sent by the agent.
- Generate a fresh private owner setup link for the handover origin; test password sign-in after the owner sets a password.
- Obtain explicit production rollout approval, then deploy/promote and recheck the production domain.

The original production website remains on its existing static deployment until rollout. The connected backend already holds the imported published content for the preview application.

## Test limits

Editor browser tests isolate the UI using intercepted API responses and run the real document validator on saved data. Separate hosted tests exercise real Supabase identity/database/storage and API routes. PostgreSQL unit tests use PGlite and cannot reproduce every PostgREST behaviour; that distinction exposed the hosted conflict-code issue.

Email deliverability and the recipient's final password are not tested by generated setup links. Site JSON exports contain asset references and rendered pages, not binary media or complete revision history; follow the separate backup instructions in the owner guide.
