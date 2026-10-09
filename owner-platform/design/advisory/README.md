# Approved mockup implementation

## Board-ready refinement — 28 September 2026

The four advisory templates now use shorter, evidence-safe copy, verified leadership credentials, plain-language service definitions and one `Discuss your needs` contact path. Unavailable proof is recorded outside the public document in `docs/advisory-evidence-supply.md`. The homepage process-map artwork replaces the person-specific synthetic workshop image.

Sticky story cards remain on desktop and mobile. JavaScript marks a story as enhanced only when `ResizeObserver` and sticky positioning are available; mobile uses a 96px backdrop, shallow overlap and content-led card height. Unenhanced, reduced-motion, motion-off and print states use normal document flow.

Regenerate with `node scripts/build-runtime.mjs` followed by `npm run design:build`. Verify with `npx vitest run tests/board-ready.test.ts tests/design-preview.test.ts --maxWorkers=1` before broader checks. Local preview only; no deployment or publication.

Scroll storytelling (25 September 2026): superseded the AOS reveals with the approved Wix Focus Areas pattern. The three detail pages use a sticky illustrated backdrop and solid overlapping panels. ResizeObserver computes a safe sticky offset so tall panels can be fully read before pinning. Mobile uses a 130px backdrop and height-aware sticky offsets; motion-off, reduced-motion and print layouts use normal document flow. Verified desktop stacking, tall Practice panels, mobile Services, motion-off, TypeScript and 92 tests.

Services content migration: restored the full four service descriptions and closing service-selection guidance from the original `/services` page (retrieved 25 September 2026, snapshot under `backups/services-source-2026-09-25.html`). Hero now reads “The right support for the work ahead.” The existing four-way overview is an h2 section linking to the detailed services; native contact/email links are retained. The homepage decision brief now has the `decision-brief` anchor used by the closing CTA. Verified 92 tests and desktop/mobile layouts.

## Impeccable refinements — 25 September 2026

Decision-brief artwork now precedes its copy in the homepage DOM and sits left on desktop. The homepage practice photograph is inset and smaller, with wrapping headings. Practice's hero caption is removed; How we work uses a single lavender surface with purple heading emphasis and neutral icons. Approach replaces the raster wash with a lavender/white curved surface and numbered process-sheet workflow selectors. Services uses `scientific-services.png`, a generated, people-free scientific workspace (microscope, sample racks, laptop and workflow sheet). All source imagery remains available. Existing controls, copy and motion preferences remain in place.

## Three.js parallax — 25 September 2026

Follow-up: the initial drift was too subtle. Desktop artwork now travels at a 100px factor in the slower-scroll direction, with 24px on mobile; captions follow the artwork. Desktop section titles stay sticky within their sections. All four public pages use the Practice reference heading treatment: regular purple Nunito with bold, upright teal emphasis, on a separate line for h1/h2. Single-word headings and the person's name remain intact.

Practice, Approach and Services load a separate `/runtime/parallax.js` bundle. Following the JudyZZ/threejs-parallax skill, their existing hero artwork renders on a colour-correct transparent plane with smoothed scroll movement and subtle pointer drift. The supplied composites remain intact; section icons move at a lighter depth while text stays steady. This replaces the earlier CSS scroll timelines. Mobile movement is smaller; reduced motion and the Privacy motion switch restore the native images. Rendering settles when idle and pauses offscreen or in hidden tabs. The Approach diagram selector updates the texture, with native images retained for accessibility and loading/WebGL failures.

Source: `src/runtime/parallax.ts`; rebuild with `node scripts/build-runtime.mjs` and `npm run design:build`. Verified TypeScript, 91 existing tests, desktop rendering, all three mobile layouts, diagram selection and the motion toggle. Local preview only; no deployment or publication.

## Local update — 24 September 2026

The menu order is Home, Our Practice, Our Approach, Our Services. Our Practice links to `/practice`, with the existing public practice overview, biography, principles and published reading adapted to the shared editorial design. Its preview is `/design-preview/practice`. The homepage approach stages use five equal columns with shared text rows on desktop and equal padding on mobile; its third stage is Implement.

The header and footer now use the owner's supplied `Axiomotl Logo.png`, copied without pixel changes to `public/site-assets/advisory/elements/axiomotl-logo-original.png`. CSS crops the empty margins of the 1125px canvas, preserving the original mark and lettering. The footer applies a white silhouette treatment. A generated crop was rejected for edge artifacts and is not shipped.

`scripts/publish-advisory-redesign.ts` prepares a version-checked candidate and full backup under `backups/advisory-release/`; `--publish` saves and publishes that exact candidate. It preserves current form mappings, business settings and additional pages, and repairs the retained practice page's legacy section link.

The unpublished site now includes `/design-preview/approach` and `/design-preview/services`. The approach copy comes from the public `/approach` page; the services page contains the four existing service descriptions moved off the homepage. Both share the homepage header, footer and styles. `scripts/build-advisory.ts` builds all three pages, and the preview renderer keeps their links within `/design-preview`.

The hero uses `public/site-assets/advisory/elements/hero-collage-implement.png`, edited with the built-in Imagegen tool to replace “Decide” with “Implement” and remove the upper-left “From project to practice” sheet. The original image remains available. Mobile artwork is 78% wide, capped at 360px; desktop sizing is retained. Homepage sections have an additional 28rem of separation (28px on mobile, scaled with the existing desktop layout). These changes supersede the original single-page section order below.

The edited asset's exact prompt is recorded in `public/site-assets/advisory/elements/hero-collage-implement.prompt.md`.

The visual authority is the approved 793 × 1983 homepage mockup, including its workshop imagery. On 24 September the user explicitly requested the same layout, content and images, without additions.

`public/site-assets/advisory/mockup-artwork.png` is an unmodified copy of `exec-2f29a7a0-dc8f-420c-8a12-08a8d023110d.png`. CSS background windows reuse its hero collage, document illustration, workshop photo, brand marks, stage icons and handwriting. These are raster assets at the reference's original resolution; enlarging them does not add detail. Headings, prose, links, form controls and footer navigation remain native HTML. The page is not a full-page screenshot with hotspots. Desktop dimensions follow the reference; below 700px the content stacks with readable text and controls. Newsreader headings and locally hosted Lato body text approximate the reference lettering; browser-rendered text is not a pixel-identical copy of generated lettering.

The extra stage strip and closing CTA have been removed. Section order and copy follow the mockup. The questionnaire uses an opt-in radio presentation on the shared FormRunner: selection followed by Continue, required selection, Back and Restart. Existing consumers retain immediate choice buttons. The first question's wording is changed in the preview builder, preserving choice IDs, routing rules and outcomes. The decision brief remains expandable behind “See how we work”. Contact prepares a mailto draft; the message is optional as shown in the reference. No server enquiry is sent.

Motion remains visible by default and respects reduced motion. Its toggle is now inside the privacy dialog so it adds nothing to the reference footer. The source of truth is `index.html`, `styles.css`, `scripts/build-advisory.ts` and the shared runtime; regenerate `src/generated/combined.json` with `npm run design:build`. `node scripts/build-runtime.mjs` rebuilds the runtime bundle.

Review at `/design-preview`. This work has not changed the live database or deployed site. The pre-refinement local files are in `backups/2026-09-24-before-exact-mockup/`; TypeScript backups have `.txt` suffixes to keep them outside application compilation. Older selected-file rollback snapshots are separate from full website/database backups.

September 2026 theme polish: all detail pages use a compact 16px reading scale, 34–48px page titles and tighter section rhythm. Services use ruled editorial rows. Shared controls retain the purple/paper palette; page arrivals and the homepage approach icons animate once, respecting reduced-motion and the Privacy motion toggle. Verified four pages at desktop/mobile widths and navigation at 320px.

Shared page heroes: Practice uses the existing illustrative workshop image, Approach the decision brief, and Services the workflow collage. Compact title/body scale is retained. Hero artwork stacks below copy at mobile widths; Approach stage navigation remains separate and linked to its original sections.

## Approved icons and rounded headings — 25 September 2026

Use the owner's icon system throughout the four public pages. Originals, checksums and usage rules are in `public/site-assets/advisory/icons/README.md` and its `originals/` directory. Existing transparent SVG adaptations are the compact web assets; do not replace them with unrelated icons. The reference PNGs include baked-in checkerboards.

All public HTML headings use locally hosted Nunito, a rounded sans-serif, with Lato retained for body text. Font: `public/site-assets/advisory/nunito.ttf`; licence: `nunito-OFL.txt`. This supersedes Newsreader for headings. Text inside supplied raster images and logo artwork remains part of those original assets.


