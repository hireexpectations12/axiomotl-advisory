# Plan 001: Correct the homepage portrait caption
Priority P2; effort S; risk LOW; category UI copy; dependencies none.

Planned at: 678018f, 2026-09-22. Executor worktree: C:/Users/evidion.BONGO/.codex/worktrees/axiomotl-improvements/Axiomotl Website, branch codex/axiomotl-improvements. Original checkout has unrelated uncommitted changes; do not copy, discard or modify them. Worktree starts from committed HEAD. Dependencies are linked read-only for reuse; do not install or modify packages. Read owner-platform/AGENTS.md and the installed Next route-handler documentation before implementation. All commands below run from owner-platform unless stated otherwise.

Verification commands: npm run typecheck -- --incremental false (exit 0); npm test (all pass); node node_modules/prettier/bin/prettier.cjs --check <changed source/test files> (exit 0). Build and browser checks may run inside the worktree, but exclude any regenerated unrelated artifacts from commits. Never deploy, publish content, send mail or mutate production accounts.

Follow existing TypeScript formatting, endpoint/HttpError error handling and Vitest vi.hoisted server mocks. Stop and report if source has materially drifted, dependencies require network installation, or changes need files outside the listed scope. Commit reviewed implementation in the isolated branch only; never merge or push. Reviewer maintains plans/README.md. Record actual command results and any skipped verification. Baseline: original working checkout passed 84 tests; isolated HEAD may have fewer because an unrelated test is uncommitted.

## Current state and purpose
The live homepage's #about .governance-visual portrait anchor links to /practice but its span says View SciSure profile ↗. Its accessible label already says Read about Dr Ramzi Abbassi and our practice. Adjacent .practice-profile-link uses More about our practice and Dr Ramzi Abbassi →. Published documents load through src/app/[[...path]]/route.ts -> readPublished -> renderPage. Generated JSON is not the published authority. renderPage already normalizes contact actions based on known legacy labels.

## Scope
Only owner-platform/src/lib/render.ts and owner-platform/tests/render.test.ts. No database, historical publisher, images, global design or generated JSON edits. This supersedes the prior plan's proposed database migration for this implementation: narrowly normalize obsolete presentation during rendering, so a later app deployment fixes the currently stored document without republishing unrelated content.

## Steps
1. Add a targeted regression using existing renderer fixtures: an internal /practice portrait anchor in #about .governance-visual with image and caption. Confirm old caption persists before the fix using npm test -- tests/render.test.ts.
2. In renderPage, after markup sanitization, change only the exact obsolete caption text View SciSure profile ↗ in that portrait anchor to More about our practice and Dr Ramzi Abbassi →. Preserve image, href and accessible label. Do not affect genuine external SciSure anchors or arbitrary other copy.
3. Test the corrected caption, unchanged destination/image/label, untouched external SciSure link and unchanged source document. Run targeted tests then shared gates.

## Done and maintenance
Renderer regression passes and source document remains unchanged. No broad text replacement. The visible change takes effect after application deployment; never claim it is already live. Future intentional captions must remain owner-editable because only the exact obsolete label is normalized.

