# Axiomotl owner website editor

## Objective

Give the owner browser-based control of the public website: content, pages, sections, layout, branding, media, navigation, metadata and existing interactive experiences. Save work privately, preview it at different screen sizes, and publish a complete revision. The current website is the initial editable project.

## Verified starting point

- Vercel project: `axiomotl-advisory`, under `hire-expectations-projects`.
- Production URL: https://axiomotl-advisory.vercel.app/.
- Authenticated CLI access confirmed; the deployment is Ready.
- Deployment source contains `src/index.html`. An exact source copy was recovered into `reference/production-2026-09-16.html` (6,454,796 bytes).
- The page includes embedded assets, six script elements, a decision-builder form, a guided journey, and animation code. Existing local mockups are not the production source.
- No connected database, storage project or owner identity has been verified yet.

## Approaches

1. **Recommended: GrapesJS visual editor, a Vercel-hosted application, and Supabase database/authentication/storage.** Supports editable component trees and CSS, reusable blocks, media, owner permissions and durable revisions. Requires integrating the existing interactive tools as custom components.
2. Structured content CMS. Good for controlled text and image updates, but needs a separate layout builder to meet the owner's request.
3. Entirely custom visual editor. Maximum flexibility, with substantially more implementation and maintenance for selection, drag-and-drop, responsive styling and undo history.

GrapesJS editor project JSON is the editable source of truth; exported HTML alone is not a sufficient project backup. Supabase stores project revisions and asset metadata with database-enforced access rules.

## Owner experience

- Invitation-only owner sign-in, sign-out and account recovery. No public account registration or default credentials.
- Dashboard showing draft state, last successful save, live revision and publishing status.
- Visual editor with page canvas, section/component tree, block library, properties and styles.
- Add, duplicate, move, hide and delete sections and components. Add pages and edit paths and navigation. Protect reserved application paths such as `/admin` and `/api`.
- Edit text, buttons, links, images, alternative text, backgrounds, spacing, grids, typography, colours, borders and responsive settings. Global brand controls apply across pages, with per-component overrides.
- Media library with image upload, replacement and reference tracking. Extract existing embedded assets into separately stored files during import.
- Page settings for title, description, social image and indexing; site settings for logo, favicon, contact details and navigation.
- Desktop, tablet and mobile previews; undo/redo within an editing session; saved revision history across sessions.
- Guided journey questions, choices, result copy and routing are editable in dedicated controls. Decision-builder inputs and result text are editable. Animation controls cover enablement and supported timing/preset settings.
- The editor controls website presentation and supported interactions. Creating arbitrary new software behaviour still requires development; this must be explicit in owner documentation.

## Interactive form mapping editor

This is a required part of the backend and owner dashboard, not merely editable form labels. Both the guided service journey and the inline decision builder must be represented in stored, versioned configuration.

### Existing guided journey behaviour

The recovered production script has three question stages: challenge, a context question selected by that challenge, and preferred working style. Its recommendation currently uses the challenge to choose a service, except that choosing embedded support overrides the result with Embedded Principal BA Advisory. The context answer currently appears in the summary but does not affect the recommendation. Import these rules explicitly so the owner can understand and change them.

### Owner controls

- Questions: add, edit, reorder and remove questions; edit instructions, required state and answer choices.
- Answer choices: edit labels and add/remove/reorder choices. Use permanent IDs rather than array positions so changing wording or order does not silently change the outcome.
- Branching: select the next question or outcome for each answer. Support conditions involving earlier answers with explicit all/any matching.
- Outcomes: create/edit result titles, explanations, recommended service, deliverables, call-to-action label/destination and email-summary copy.
- Rules: a readable mapping table showing condition, priority and resulting next question/outcome. Example: `Working style is embedded support → Embedded Principal BA Advisory`; the owner can change this association.
- Fallback: explicitly choose what happens when no specific outcome rule matches. Evaluate rules in visible priority order with the first matching rule winning; highlight overlapping rules.
- Preview: an interactive test runner shows each selected answer, the matching rule and the final outcome, using exactly the same evaluator as the public form.
- Summaries: email drafts and downloadable summaries use the selected answers and configured result from the same revision. Configure the destination email and supported placeholders; an email draft is not represented as a sent submission.

### Validation and publishing

Block publication for missing question/answer/outcome references, duplicate IDs, invalid destinations, reachable cycles or paths that cannot reach an outcome. Warn about unreachable questions/outcomes and shadowed rules. When deleting a referenced item, list affected rules and require their repair before publication. Derive progress, keyboard shortcuts and navigation from configuration rather than hard-coded counts.

Changing an earlier answer clears downstream answers that no longer belong to the resulting path. A visitor's active journey remains pinned to its starting published revision so a mid-session owner publication cannot mix old answers and new rules. Form configuration, result content and page content publish atomically and restore together.

The inline decision builder receives its own question/choice/result mapping, based on an inventory of its existing behaviour; it must not accidentally share the guided journey's outcome rules. Initial migration must preserve both tools' current outputs before owner edits.

### Required tests

Verify original paths and the embedded-support override; map a formerly summary-only context answer to a different result; edit an outcome and its CTA; rename/reorder choices without changing their mappings; add/remove questions; reject broken references and loops; resolve rule precedence and fallback; clear invalid downstream answers; preserve drafts until publication; and restore an earlier form configuration. Verify all paths for the imported finite form and representative generated rule configurations.

## Application and data

- A Next.js application on the existing Vercel project serves public pages and authenticated admin/API routes.
- GrapesJS runs only in the admin client. The public site does not download the editor.
- Supabase Auth provides identity; an explicit membership table controls site access. Being authenticated alone grants no editing rights.
- Tables: sites, memberships, working drafts, immutable revisions, publication records and assets. Site/page configuration and component trees are versioned together in a revision.
- Draft updates use a version number to reject conflicting saves instead of silently overwriting another session. Autosave reports errors and retains unsaved work for retry.
- Original import is retained as a baseline revision. Each publish creates an immutable revision and changes a single live revision pointer transactionally. Visitors see either the previous complete site or the next complete site.
- Restore copies a historical revision into a new draft; it does not erase history or publish without a deliberate action.
- Public requests read only published output. Draft previews require owner authentication and use private, non-cacheable responses.
- Database and storage policies restrict edits to site members. Server-side checks validate identity, membership, payload size, paths, URLs and component configuration.
- Browser bundles never contain privileged database credentials. Mutation routes enforce same-origin requests and appropriate session/CSRF protections.

## Rendering and scripts

Import production HTML and CSS into editable components, extract assets and isolate the reviewed interaction scripts. Do not assume raw HTML import preserves runtime behaviour automatically.

Use registered components for the guided journey, decision builder and supported animations. Runtime code is maintained by the application; owner-editable properties are data. Editor content cannot inject arbitrary scripts, inline event handlers or executable URLs. Uploaded SVG and other active content need sanitisation or rejection.

Render preview content in an isolated frame. Serve published public output separately from the admin document, with a content security policy. Preserve keyboard operation and reduced-motion behaviour. Components must fail gracefully when the owner removes a related section.

## Media and durability

Use persistent object storage, never the Vercel function filesystem or browser local storage as the authoritative backend. Check file size and detected content type. Store immutable asset paths so replacing an image cannot alter a historical revision. Prevent deletion of media referenced by published content or retained revisions.

Provide a downloadable site export containing editor project data, settings, asset references and rendered output. Document database/media backup and restoration separately; revision history is not a disaster-recovery backup.

## Implementation sequence

1. Establish app structure and import pipeline; capture the current site at desktop and mobile sizes and inventory interactive behaviours.
2. Implement schema/migrations, authentication, owner membership, media storage and security policies.
3. Build draft/revision/publish APIs and concurrency handling with integration tests.
4. Integrate visual editor, page manager, global styling, media and SEO settings.
5. Adapt current interactions into editable components and import the production baseline.
6. Test through an isolated preview deployment with an actual owner account; verify persistence and publication from a second browser session.
7. Promote the verified deployment to the existing production URL and provide owner onboarding and recovery instructions.

## Acceptance checks

- An unauthenticated visitor and an authenticated non-member cannot read drafts, upload assets or mutate/publish content, including by direct API calls.
- Owner changes to content, layout, theme, page paths and media persist after signing out, reopening the browser and application redeployment.
- Draft changes never appear publicly before publish. Publish makes a consistent revision visible; restore can reproduce the previous version.
- Conflicting saves, expired sessions, oversized/invalid uploads and database/network failures produce actionable errors without losing the last good revision.
- Script injection, unsafe URLs and cross-origin mutations are rejected or made inert.
- Imported layout is visually compared with production on desktop and mobile; navigation, guided journey, decision builder and reduced-motion settings remain functional.
- Added/reordered/deleted sections and new pages work in the editor, preview and public output. Unknown public paths return 404.
- Media and revisions remain intact after deployment. A documented export/recovery exercise succeeds.

## Setup dependencies

Implementation can be built locally once this design is agreed. Production completion requires an owner-controlled Supabase project (or an agreed alternative), appropriate credentials configured as environment variables, and the owner's sign-in email. Account creation, billing choices and credentials must not be invented. Verify available account access before requesting setup from the owner. Any recurring cost must be disclosed before selecting a paid plan.

## References

- https://grapesjs.com/docs/modules/Storage.html
- https://grapesjs.com/docs/modules/Components
- https://grapesjs.com/docs/modules/Pages.html
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
