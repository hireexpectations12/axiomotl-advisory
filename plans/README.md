# Axiomotl improvement review

Reviewed 22 September 2026 with the shadcn/improve skill at HEAD `678018f`. Scope: the current `owner-platform` public website and owner workspace. This is a source review, not a visual redesign or a production penetration test. Existing uncommitted work was reviewed in place and preserved. The user subsequently selected all four findings for implementation in an isolated worktree.

## Selected implementation

Worktree: `C:/Users/evidion.BONGO/.codex/worktrees/axiomotl-improvements/Axiomotl Website`.
Branch: `codex/axiomotl-improvements`. Original checkout and live deployment remain separate.

| Plan | Status | Depends on |
|---|---|---|
| [001 Correct portrait caption](001-correct-portrait-caption.md) | DONE — reviewed in isolated branch | None |
| [002 Reserve design preview](002-reserve-design-preview.md) | DONE — reviewed in isolated branch | None; shares renderer with 001 |
| [003 Staff mutation tests](003-test-staff-mutations.md) | DONE — reviewed in isolated branch | None |
| [004 Paginate revisions](004-paginate-revisions.md) | DONE — reviewed in isolated branch | None |

The caption plan uses a narrowly targeted rendering correction instead of a database publication, avoiding changes to unrelated owner content. It becomes visible on application deployment.

### Execution review — approved

Commit: `b492723494a12de1e76d8408ef822902360b6fc6` (`Improve portrait caption, reserved routes and revision history`). Seven scoped implementation files changed; no production staff code, database documents, dependencies or unrelated generated assets changed. Original checkout scoped file hashes were checked and are unchanged.

Reviewer independently verified 115 unit tests, typecheck, all three history browser regressions, scoped formatting, final diff and scope. Executor also completed `npm run build -- --webpack` successfully, including TypeScript and 20 generated static pages. The reviewer browser rerun passed in 23.8 seconds using the worktree-only server on port 3107. Generated verification changes were restored after testing.

Review corrections incorporated: use the actual figure-wrapped portrait DOM; represent protected owners using the existing absent-site-role contract; isolate history errors from save/conflict errors; scope browser error locators so they exclude Next's route announcer. Cursor pagination preserves database timestamp precision, uses deterministic ID ordering, fetches 20 entries plus one predecessor, and bounds author lookup concurrency to four.

Delivery status: implementation complete and reviewed in the isolated branch; not merged into the original checkout, not pushed and not deployed. Before deployment, check that the stored site has no owner-authored `/design-preview` page. The broader public-page visual audit and external dependency advisory lookup remain outside this implementation's completed checks.

## Verification baseline

From `owner-platform/`:

- `npm run typecheck -- --incremental false`: passed, without generating a TypeScript build-info file.
- `npm test`: all 84 tests in 12 files passed.
- An in-memory validation check appended an owner-authored `/design-preview` page while retaining `/`; validation accepted it, confirming finding 2.
- Build command: `npm run build`; browser checks: `npm run test:e2e`; formatting check: `npm run format:check`. These were identified but not run in this read-only review. Build/predev scripts regenerate product artifacts.
- Production dependency advisory lookup: incomplete. The sandbox request failed; automatic approval review then rejected the external npm metadata transfer. No dependency-safety conclusion is made. A user approval question is pending; do not retry without authorization.

## Findings, in recommended order

| # | Finding | Category | Impact | Effort | Fix risk | Confidence | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Correct the portrait's obsolete SciSure caption | UI copy | Homepage link promises an external profile but opens the internal practice page | S | Low | High | Published homepage inspected in the preceding audit; `owner-platform/scripts/publish-practice-summary.ts:30` changes the destination without its caption, and line 31 supplies the correct sibling wording | Existing selected plan; not implemented |
| 2 | Reserve `/design-preview` and remove the false-positive path test | Correctness/tests | An authored page validates successfully at a URL owned by the preview route, so visitors receive the preview instead | S | Low | High | `owner-platform/src/lib/render.ts:102`; `owner-platform/src/app/design-preview/route.ts:5`; `owner-platform/tests/render.test.ts:134` | Awaiting plan selection |
| 3 | Cover authorized staff changes and protected-owner cases | Tests | Staff creation, role assignment, membership scoping and owner/self protection can regress without the current denial-only API tests detecting it | S | Low | High | `owner-platform/tests/staff-api.test.ts:14`; `owner-platform/src/app/api/staff/route.ts:38`, `:64`, `:72`, `:107` | Awaiting plan selection |
| 4 | Paginate revision history at the server | Performance | Every History visit fetches and compares all returned document snapshots before displaying the first 20 entries | M | Medium | High | `owner-platform/src/app/api/revisions/route.ts:8`, `:13`, `:18`; `owner-platform/src/components/Dashboard.tsx:668`, `:691` | Awaiting plan selection |

Effort: S = hours; M = approximately a day including verification. These are estimates, not commitments.

## Correction sketches

1. Replace only the portrait caption with the existing sibling wording: `More about our practice and Dr Ramzi Abbassi →`. Preserve `/practice`, the portrait and the existing accessible label. Canonical content is database-backed: changing a generated JSON file alone does not publish this fix.
2. Reject the owned preview URL during document validation. Test forbidden paths on an additional uniquely identified page while preserving `/`, and assert the path-validation error. Include an ordinary valid-path control. The current test removes `/`, causing an independent missing-homepage error even when the reserved-path rule is wrong. Check existing documents before enforcing a new reservation.
3. Extend the staff API fake with Auth admin operations. Test successful owner-authorized invitations, role changes and removals, protected owner/self cases, site-scoped writes and failures between identity, metadata and membership operations. Preserve current production behavior; this finding does not allege a demonstrated authorization bypass.
4. Fetch a bounded revision page and one predecessor for accurate boundary summaries. Make Show older revisions request another page, use stable ordering, and resolve only the required authors with bounded concurrency. Add pagination and boundary-summary tests before changing behavior.

## Existing plan and dependencies

- [Portrait caption implementation handoff](../design-plans/2026-09-22-practice-portrait-caption.md): already selected by the user in the prior audit; retained in place rather than duplicated. Status: TODO, not applied to source or production.
- Findings 2 and 3 are independent. Finding 4 requires its own pagination characterization tests before implementation; it does not depend on the staff tests.
- All four findings are now selected; the implementation plans above govern execution. The finding table retains the original audit status for provenance.

## Product direction option

Surface the existing internal-link checks in the publish review. `owner-platform/src/app/api/status/route.ts:14` already calculates checks, `owner-platform/src/components/SiteStatus.tsx:35` presents them separately, and the publish confirmation at `owner-platform/src/components/Dashboard.tsx:430` does not include them. This would bring relevant feedback to the point of publication. Start with an advisory, saved-version-specific summary; whether warnings should block publication needs a product decision. Coarse effort M, with a design/spike plan before implementation.

## Considered and rejected or deferred

- Disabled public online enquiries: explicitly documented behavior; not a broken-delivery finding.
- No public-page caching: immediate publication and time-sensitive announcement semantics are relevant counterevidence, and no performance measurement justifies changing that contract.
- Additional form-routing bug claims: no proven issue survived review; existing form tests cover substantial routing behavior.
- Legacy missing-role owner fallback: documented and tested compatibility behavior, not a newly established vulnerability.
- Admin CSP: application configuration lacks a policy, but hosting headers were not checked and strong sanitization already exists. Deferred defense-in-depth assessment, not an active XSS finding.
- Media client-side pagination: lower-priority analogue of revision history; no verified deployed row cap or measured user impact establishes an additional urgent finding.
- Broad architecture refactors and dependency upgrades: no sufficiently concrete evidence for a recommendation in this pass.
- Root `DESIGN.md` and `PRODUCT.md` describe the separate Typeform mockup; they are not the current public site's visual authority.

## Limits

Excluded: rendered desktop/mobile visual inspection, authenticated production interaction, load benchmarking, external dependency advisory results, deployment/build verification, and exhaustive review of archived mockups, generated assets, historical one-off publishers and third-party dependencies. No content was published, no staff changed, and no messages sent.
