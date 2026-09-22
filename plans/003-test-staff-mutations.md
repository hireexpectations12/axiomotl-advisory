# Plan 003: Cover authorized staff mutations and owner safeguards
Priority P2; effort S; risk LOW; category tests; dependencies none.

Planned at: 678018f, 2026-09-22. Executor worktree: C:/Users/evidion.BONGO/.codex/worktrees/axiomotl-improvements/Axiomotl Website, branch codex/axiomotl-improvements. Original checkout has unrelated uncommitted changes; do not copy, discard or modify them. Worktree starts from committed HEAD. Dependencies are linked read-only for reuse; do not install or modify packages. Read owner-platform/AGENTS.md and the installed Next route-handler documentation before implementation. All commands below run from owner-platform unless stated otherwise.

Verification commands: npm run typecheck -- --incremental false (exit 0); npm test (all pass); node node_modules/prettier/bin/prettier.cjs --check <changed source/test files> (exit 0). Build and browser checks may run inside the worktree, but exclude any regenerated unrelated artifacts from commits. Never deploy, publish content, send mail or mutate production accounts.

Follow existing TypeScript formatting, endpoint/HttpError error handling and Vitest vi.hoisted server mocks. Stop and report if source has materially drifted, dependencies require network installation, or changes need files outside the listed scope. Commit reviewed implementation in the isolated branch only; never merge or push. Reviewer maintains plans/README.md. Record actual command results and any skipped verification. Baseline: original working checkout passed 84 tests; isolated HEAD may have fewer because an unrelated test is uncommitted.

## Current state
src/app/api/staff/route.ts POST creates an invite identity via generateLink, reads site membership, sets site roles with updateUserById, inserts membership, then returns setupUrl. PATCH verifies selected-site membership, reads the target user, rejects self or owner, then deletes selected-site membership or updates only that site's role metadata. tests/staff-api.test.ts currently tests unauthorized roles and origin rejection; the fake service lacks auth.admin, so none of these owner-authorized branches are exercised.

## Scope
Only owner-platform/tests/staff-api.test.ts. No production authorization edits, identities, invitations or network calls. Use non-secret synthetic identifiers and invite tokens in mocks.

## Steps
1. Extend the hoisted service fake with independent query chains and Auth admin spies while retaining all existing denial checks.
2. Test successful owner-authorized invite, editor/publisher role changes and membership removal. Assert concrete query filters and payloads, preservation of other-site roles and metadata, and returned setup URL built with synthetic token.
3. Test owner/self protections (both removal and role changes), nonmember targets, membership-read failure, generateLink failure, role-metadata update failure, membership-insert failure, and removal/update failure. Assert downstream privileged calls are absent when an earlier step fails. Test invalid input without unintended writes.
4. Run npm test -- tests/staff-api.test.ts, then all shared gates.

## Done and maintenance
Tests characterize existing behavior without production edits; they prove selected-site scoping, protected-owner/self rejection, successful mutation payloads and meaningful partial-failure responses. If a real bug appears, stop and report rather than silently expand scope. No test may consume a live token or contact Supabase.

