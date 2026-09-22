# Redesign delivery

Review: http://localhost:3011/design-preview (compiled production build).

Implemented in owner-platform/design/advisory; built by scripts/build-advisory.ts into the existing validated SiteDocument format. The live publication is unchanged. The owner preview embeds the new trusted runtime and fonts under its existing nonce and sandbox policy.

## Design
The self-authored brief applies the user's supplied scientific and medical advisory positioning. The working-dossier grammar, other grammar trade-offs, feeling curve, six-beat journey, layer contract and device score are recorded in BRIEF.md. The signature is a handover worksheet with scroll-progress stages and manual controls; a selected stage carries its topic into a real email draft. The peak has the largest desktop scroll span; mobile uses natural flow. No generated assets or performance claims were added. The original logo and attributed RSMS excerpts are retained.

Feel review: recognition, relief, clarity, confidence, familiarity, resolve. During review, future worksheet content was too faint, so all text was restored to full contrast and the active stage now uses a pale background and numbered marker emphasis. The contact panel provides a definite ending. The initial registry was empty, so there were no historical rows to clear. Scrollcraft engine copies match their source SHA256 and are unmodified.

## Preservation
backups/advisory-before-redesign-20260920-201423 contains 50 original source/generated/asset files and a SHA256 manifest. The previous build-combined.ts remains in the application as well. The shell could not download the live HTML because of network sandbox restrictions; the complete local design sources, generated documents and their assets were successfully copied. This is a source backup, not a backup of the private production database.

## Verification
- Final production build passed, including TypeScript and all 20 generated routes.
- All 83 tests in 11 suites passed after final changes.
- Desktop opening, service layout, handover scene, source diagrams, practitioner section and contact ending inspected in the connected browser.
- 390x844 and compact 360x640 compositions inspected; no horizontal overflow detected.
- Mobile native menu opens and navigates. Repaired a conflict with the old mobile-menu script.
- Manual handover controls update the selected state and email topic.
- Completed all five decision-brief questions. The final email draft contains all supplied test answers, and download/result actions are present. No email was sent. Downloaded file contents were not separately checked.
- Motion-off mode tested: parallax stops and sticky layout returns to normal flow. OS reduced-motion CSS and runtime paths are implemented, but OS emulation and physical-device testing were not performed.
- No broken loaded images or console errors in the reviewed final page.
- Owner preview regression checks confirm fonts and both new scripts are embedded without protected runtime requests.
- Git whitespace checks passed.

Evidence: desktop-opening.png, desktop-work.png, desktop-about.png, desktop-contact.png and motion-off.png are viewport captures. The earlier desktop-full.png and mobile-360.png full-page captures are diagnostic only: full-page capture temporarily changes viewport geometry and cannot reliably represent sticky scroll scenes. Use the live page and viewport captures for review.

The standalone Scrollcraft screenshot harness was not used; visual inspection used the connected browser. No video assets were needed, so the absent FFmpeg and generation API key did not affect the build. Real-phone testing, email-client delivery and deployment remain outside this local review.
