# Axiomotl owner workspace

Audience: the business owner editing a live advisory website. Job: make a considered change, inspect its effect, and publish with confidence.

This editor uses the production site's marine palette, independently of the earlier Typeform mockup design system in the parent folder.

## Tokens and runtime mapping

`src/app/admin/admin.css` defines --navy #031925, --ocean #124559, --aqua #70d0e5, --paper #f3f7f8, --ink #15313e, --muted #526c78, --line #d5e2e7, --danger #a12b36. System sans-serif is the UI/body family; Georgia is reserved for workspace headings; monospace is used for rule IDs and paths.

## Layout and signature

Persistent navy sidebar and a light work surface with compact tools. The distinctive element is the form mapping workbench: questions, routing rules and outcomes sit alongside a real path tester. Document state and publish actions stay in a stable top bar. Prefer dividers and generous field spacing over decorative cards.

## Interaction contract

Save draft persists work privately. Publish saves a complete immutable revision. Errors remain visible until corrected. Destructive actions use inline confirmation, not browser confirm dialogs. Keyboard focus is visible. Forms label each input. Status uses an aria-live region. Saving, loading, conflict, expired session and missing backend have explicit states. At narrow widths navigation becomes a wrapping top row and panels stack.

## Verification

Run typecheck, Vitest, Next production build and Playwright. Verify editor/save/publish with a configured account before declaring live readiness. Local previews cannot be presented as durable backend completion.

## Combined public website — approved 17 September 2026

The public marketing direction combines the supplied ChatGPT site's workshop photography and purple/teal identity with the Vercel site's service finder, decision brief and owner-editable document model. The admin workspace retains its existing functional styling.

`design/combined/reference.css` is the archived visual foundation; `design/combined/combined.css` owns the combined public tokens and responsive refinements. `scripts/build-combined.ts` composes these with the HTML fragments and the archived live form definitions into `src/generated/combined.json`. `renderPage` maps its settings to `--navy-accent`, `--ink`, `--paper` and the font roles; the existing FormRunner consumes those variables. Generated JSON is not hand-edited. The root preview route is `/design-preview`, served with no-index headers; the existing database publication is unchanged.

Palette: purple/action #481e72, deep purple/headings #2a0f4b, teal/emphasis #227e7b, ink #2f2840, muted #585568, lavender surface #f3eff7 and white #ffffff. Lato 900 is the display role, Lato 400 the reading role and Lato 700 the controls role; all are locally hosted. These roles intentionally retain the reference identity rather than introduce a competing display family. Display size is fluid 50–76px on desktop, section headings 32–46px; content is capped at 1240px. Controls use 6–8px corners and a 44px minimum touch target.

The signature is a working advisory page: interactive circuit-board opening → service finder → four services with expandable outputs → usable decision brief → five-stage method → practice/experience → contact. Repeated service feature sections are consolidated. The brief sits on a restrained white working sheet with a teal rule. Use native disclosures for supporting reading and the existing native dialog for the service finder. Preserve focus restoration, reversible answers, form error text, all recommendation rules and honest email/download handoffs.

Scrollbar variables, visible focus, narrow screens and reduced-motion styles are in the combined stylesheet. Asset provenance and reproducible build instructions are in `design/combined/README.md`.

### Interactive hero and confirmed logo

The owner confirmed the Vercel axolotl logo on 17 September 2026. `public/site-assets/combined/axiomotl-axolotl.png` replaces the reference A wordmark in both header and footer, keeping its original proportions and using the existing white footer treatment.

The hero retains the supplied reference's composition but is now rendered natively rather than as a single image, following the owner's sharpness request. Header, headline, CTAs, side statements, tile captions and impact statement are HTML text. The original local logo and individual supplied icons retain their native source resolution. The full screenshot remains an unused visual reference.

`reference-hero.css` creates the layered tiles, perspective grid, horizon and purple atmosphere. Inline SVG arcs remain sharp at any viewport size. Both side statements use pure white: “Advancing a healthier tomorrow” and “Better evidence / Clearer decisions / Brighter outcomes”. Text is visible and independently editable again. Desktop proportions follow the reference; mobile stacks readable native content and five icon cards.

`hero.ts` uses the existing GSAP runtime for travelling connection lights, light moving along all three arcs, and gentle purple glow translation/scale/opacity. The headline, labels and controls stay still. All ambient tweens share the existing motion controls, OS reduced-motion preference and offscreen/background pausing. Stage selection reveals the service detail strip; native controls still work without GSAP.

## Public editorial refinement — 18 September 2026

Preserve the existing section order, axolotl identity, five-stage hero, GSAP motion controls and canonical form runner. The public page's refinement tokens live in `design/combined/editorial.css`: ink #292f30, muted #596260, paper #f5f6f2, green #245b4a, line #cbd3cd and purple #593274. This file follows the existing composition CSS; owner workspace tokens remain independent.

Lato remains the body and display family. Distinction comes from lighter service/contact headings, restrained heading emphasis and monospace sequence labels, avoiding a new decorative font pairing. The RSMS diagrams are the subject-specific signature below the existing hero. A larger process map and offset decision tree replace equal cards; services become a list with native output disclosures. On mobile, layouts collapse to readable single-column content without hiding controls.

Copy names handovers, decision ownership, migration routes and go-live readiness. No new client, performance or credential claims. Finder and decision brief retain their canonical questions and routing. Motion additions are limited to link-direction cues and respect reduced motion.

## Layout and motion alignment — 19 September 2026

The final layout layer is design/combined/layout.css, appended after contact.css by the combined build. Shared page gutters, section spacing and column gaps align the hero and page content. Working-together steps use shared rows; diagram panels now have equal widths and aligned previews, superseding the earlier staggered layout. Navigation collapses at 1100px; workflow cards remain inside the viewport at every breakpoint. GSAP hover changes brightness only, preserving card geometry, and resets when motion is off. Existing branding, green glow and purple heading accents remain.


## Supplied brand palette (19 September 2026)

Public colour roles are centralized in `design/combined/palette.css`, loaded after existing layout styles. Deep purple #481E72 and plum #7A2C82 identify headings and actions; lilac #B794D6 and pale lavender #E7D6F2 support dark hero text and light panels. Teal #43AA8C supplies interaction accents, muted blue #608599 supplies control borders, charcoal #333333 supplies body text, and off-white #F7F7FA supplies page surfaces. Coral #E58F80 and gold #D6B35A are decorative accents on engagement steps. Dark purple #21132F and dark teal #276653 are derived shades for readable surfaces and small text. The workflow hover uses a pale teal tint to retain the requested light-green response.

Measured text pairs range from 4.82:1 (deep purple on lilac) to 11.52:1 (deep purple on off-white). Coral and gold are not used for small text. Supplied diagram and icon image colours remain original. The palette publication script appends only palette styles and updates colour settings, preserving existing page content, form mappings and the supplied logo.

## Public spacing and assessment update — 20 September 2026

`design/combined/refinements.css` is the final public style layer. It removes legacy service minimum heights, compacts service rows and engagement steps, and justifies paragraphs with automatic hyphenation. Industry experience uses three editorial rows preserving existing practitioner capability statements. The canonical journey form now mounts inline in `finder.html`; the decision brief remains separate.

`scripts/publish-refinements.ts` patches the current published document rather than replacing it from the archived design template. This preserves the newer biography, portrait, diagram placement, forms and settings. It checks draft/publication equality and the reviewed version, backs up the full previous document, and clears the stale editor snapshot so the visual editor reimports the updated canonical HTML/CSS. Published revision: 53. Desktop/mobile browser checks, assessment result/back/reset checks, typecheck and all 83 unit tests passed.
