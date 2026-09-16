# Verification and rollout status

## Completed on 16 September 2026

- Production source recovered from Vercel, imported and made editable.
- Connected the dedicated Supabase project; database migration 001 and owner membership exist.
- Owner identity: `ty@cplace.com.au`. Password setup uses a private one-use link, not a shared/default password.
- Original images uploaded into the persistent owner media library.
- TypeScript checks pass. 71 unit/database tests pass. 11 Chromium browser tests pass.
- Browser tests cover visual editor save/reload with server validation, page settings, conflict recovery, form outcome editing, mobile layout, publication confirmation, both public forms and two script-injection regressions.
- Real Supabase tests pass for authentication, uploads, unsafe-file rejection, saved drafts, public/draft isolation, stale-save preflight, wrong-origin rejection, restore, export and anonymous draft denial.
- Local and hosted authenticated dashboards and isolated previews load successfully; the preview loads Nunito and the interactive form runtime. Trusted scripts and fonts are embedded in the opaque sandbox so Vercel protection does not block them.
- Verified preview: https://axiomotl-advisory-95xtbdlh4-hire-expectations-projects.vercel.app (Vercel account access required).
- Production build passes. Production dependency audit reports zero vulnerabilities.

## Rollout gates

- Hosted migration `002_conflict_status.sql` is confirmed applied: a direct RPC with an impossible expected version returned PT409 without changing the draft.
- Public signups are confirmed disabled through Supabase Auth's settings endpoint. Existing owner access remains protected by membership checks.
- Owner confirmed receiving the default Supabase recovery email, opening the password form, setting a password and signing back in as ty@cplace.com.au on the tested preview. No email was sent by the agent.
- Before production rollout, set Supabase Site URL to https://axiomotl-advisory.vercel.app and allow https://axiomotl-advisory.vercel.app/auth/callback** (the recovery request includes ?next=recovery). Keep the verified preview redirect during transition.
- Obtain explicit production rollout approval, then deploy/promote and recheck the production domain.

The original production website remains on its existing static deployment until rollout. The connected backend already holds the imported published content for the preview application.

## Test limits

Editor browser tests isolate the UI using intercepted API responses and run the real document validator on saved data. Separate hosted tests exercise real Supabase identity/database/storage and API routes. PostgreSQL unit tests use PGlite and cannot reproduce every PostgREST behaviour; that distinction exposed the hosted conflict-code issue.

Generated setup links alone do not test email delivery. The owner subsequently confirmed the preview email recovery and password sign-in flow; production recovery still needs a check after rollout. The default sender remains limited to Supabase organization members and is intended for testing, so a custom sender is still needed for unrestricted owner handover. Site JSON exports contain asset references and rendered pages, not binary media or complete revision history; follow the separate backup instructions in the owner guide.
