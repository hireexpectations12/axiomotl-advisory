# Correct the homepage practice portrait caption

Status: Ready for implementation; product source and publication unchanged.
Selected finding: Homepage portrait caption promises a SciSure profile but links to the internal practice page.
Repository HEAD inspected: `678018f2930ec8d76c36f2391c001130cb0a76d6`.
The working tree contains unrelated modified and untracked files; preserve them.

## Exact change

In the published homepage document, replace the portrait link's child caption `View SciSure profile ↗` with `More about our practice and Dr Ramzi Abbassi →`. Preserve its `/practice` destination, image, classes, identifiers and existing accessible label. Reuse the wording already present in the adjacent `.practice-profile-link`.

## Evidence and ownership

- Public homepage: https://axiomotl-advisory.vercel.app/
- Destination: https://axiomotl-advisory.vercel.app/practice
- Published HTML inspected during this audit contains `a#i55e7y[href="/practice"]`, with accessible label `Read about Dr Ramzi Abbassi and our practice`, containing `span#ij9hyg` with the obsolete SciSure caption.
- `owner-platform/scripts/publish-practice-summary.ts:30` changes the original SciSure anchor's URL and accessible label but leaves its child caption unchanged. Line 31 inserts the correctly worded neighbouring link.
- `owner-platform/src/app/[[...path]]/route.ts` reads the published document via `readPublished()` and passes the matching page to `renderPage()`.
- `owner-platform/src/lib/server/site.ts` reads the publication from Supabase. Editing generated JSON alone does not update this live document.
- Public script inspection found no SciSure or practice-link rewriting in the loaded site and forms scripts.

## Implementation

1. Re-read the current published homepage and draft; confirm the obsolete caption still exists and identify any unpublished changes before applying a patch.
2. Apply this caption-only change to the canonical homepage content through the established owner document workflow. If an editor project exists, reconcile the matching text component as well so reopening the editor cannot restore the old caption. Preserve all unrelated draft edits.
3. Correct the caption handling in the practice-summary publisher for reproducibility: when migrating the original SciSure portrait anchor to `/practice`, update its caption child, preserving the portrait image. Do not blindly rerun this historical publisher: it also changes biography text and writes complete document snapshots.
4. Validate the candidate document and inspect its diff. The intended public-content difference is the caption alone. Use version checks and the existing revision/publication workflow for the selected change.

## Verification

- Confirm the portrait caption exactly matches the replacement and its link remains `/practice`.
- Confirm the obsolete caption is absent from the homepage and the portrait, accessible label and neighbouring link remain intact.
- Check the longer caption at desktop and narrow widths for wrapping or clipping before publishing.
- After publication, re-read the public homepage to confirm the change is live; a source edit or local candidate is not publication proof.

## Rollback

Restore the previous caption through the same content workflow if necessary; avoid reverting unrelated subsequent content changes.

## Audit workflow note

The invoked improve-ui skill permits writes only under `design-plans/`. Its referenced `references/plan-template.md` could not be retrieved through the skill connector or website, so this handoff records the required evidence, owners, exact correction, execution steps and verification directly.
