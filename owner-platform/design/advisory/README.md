# Scientific and medical advisory redesign

Source: index.html and styles.css. Build with `npm run design:build`; review at `/design-preview`. This replaces the generated review document, not the owner's published database document.

The prior design, generated document, builder and assets are backed up under `backups/advisory-before-redesign-20260920-201423` at the workspace root. The previous builder remains `scripts/build-combined.ts`.

Scrollcraft engine files are unchanged under `public/runtime/scrollcraft`. Bespoke handover behaviour and motion controls are in `public/runtime/advisory.js`. `src/lib/render.ts` loads them only for pages containing `data-axiomotl-scrollcraft`; sandbox previews embed them through the existing nonce mechanism.

Research, design decisions and verification evidence: `scrollcraft/builds/axiomotl-advisory` at the workspace root. Reuses original Axiomotl mark and attributed RSMS diagrams. Manrope and Newsreader font files come from the existing typeform-mockup assets.
