# Plan 002: Reject owner pages that collide with the preview route
Priority P2; effort S; risk LOW; category correctness/tests; dependencies none.

Planned at: 678018f, 2026-09-22. Executor worktree: C:/Users/evidion.BONGO/.codex/worktrees/axiomotl-improvements/Axiomotl Website, branch codex/axiomotl-improvements. Original checkout has unrelated uncommitted changes; do not copy, discard or modify them. Worktree starts from committed HEAD. Dependencies are linked read-only for reuse; do not install or modify packages. Read owner-platform/AGENTS.md and the installed Next route-handler documentation before implementation. All commands below run from owner-platform unless stated otherwise.

Verification commands: npm run typecheck -- --incremental false (exit 0); npm test (all pass); node node_modules/prettier/bin/prettier.cjs --check <changed source/test files> (exit 0). Build and browser checks may run inside the worktree, but exclude any regenerated unrelated artifacts from commits. Never deploy, publish content, send mail or mutate production accounts.

Follow existing TypeScript formatting, endpoint/HttpError error handling and Vitest vi.hoisted server mocks. Stop and report if source has materially drifted, dependencies require network installation, or changes need files outside the listed scope. Commit reviewed implementation in the isolated branch only; never merge or push. Reviewer maintains plans/README.md. Record actual command results and any skipped verification. Baseline: original working checkout passed 84 tests; isolated HEAD may have fewer because an unrelated test is uncommitted.

## Current state
src/lib/render.ts pathSchema rejects admin, api, auth, _next, runtime and site-assets but not design-preview. src/app/design-preview/route.ts owns /design-preview. tests/render.test.ts replaces the homepage when checking reserved paths, so the missing-homepage check masks path-validation failures. The audit reproduced acceptance by adding a unique /design-preview page while preserving /.

## Scope
Only owner-platform/src/lib/render.ts and owner-platform/tests/render.test.ts (shared with plan 001; execute sequentially). Do not remove the app preview route or change site routing behavior.

## Steps
1. Replace reserved-path test fixtures with an additional unique page while retaining /. Assert the path-specific validation message rather than any exception. Add /design-preview and /design-preview/child and a valid /design-preview-example acceptance control. Tests should demonstrate the missing reservation before code change.
2. Include design-preview in the exact path-segment reserved regex, keeping valid similarly prefixed slugs and other existing rules. Test /services acceptance, all existing reserved paths and the preview collision.
3. Run npm test -- tests/render.test.ts and shared gates.

## Done and maintenance
Both document validation entry points reject the collision; all relevant tests pass for the intended reason. The public preview continues to exist. Existing published documents were not mutated or exhaustively inspected; record that deployment should check for an existing conflicting owner page and resolve any such content before rollout. Future app-owned routes should get paired positive/negative path tests.

