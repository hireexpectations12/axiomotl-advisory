# Combined public website

Approved combination: ChatGPT visual identity plus Vercel interactive tools and owner editing, 17 September 2026.

Run `npm run design:build` to rebuild `src/generated/combined.json`. The normal dev/build lifecycle also runs this command. Start `npm run dev` and open `/design-preview`. The route uses the existing renderer, form bundle and public security headers, with no-index metadata and headers.

The JSON is a validated SiteDocument suitable for the existing owner draft/save/publish workflow. It is a review artifact: this build does not save over an owner's current draft or publish to either live site. A release should merge the reviewed page and settings into the then-current owner document, retaining unrelated pages and any newer form edits, save with the current version, inspect the owner preview and publish through the existing revision flow. Serve the included `/site-assets/combined/` assets with that deployment.

## Sources and provenance

- `reference.html` and `reference.css`: captured from https://axiomotl-advisory-design.smart-hare-1535.chatgpt.site/ and its stylesheet on 17 September 2026. Archived source only; its scripts are stripped by the builder and never run by the combined page.
- `vercel.html`: public page captured from https://axiomotl-advisory.vercel.app/ on 17 September 2026. Only its published form definitions and site settings are extracted. No credentials or private owner data are included.
- `public/site-assets/combined/advisory-workshop.webp` and `office.webp`: reused unmodified from the supplied ChatGPT site's assets. They illustrate the advisory setting and are not labelled as actual Axiomotl personnel or client premises. Original image-generation/licensing records are not present locally.
- The current header/footer logo is the unmodified axolotl PNG from the supplied Vercel site, confirmed by the owner on 17 September 2026. Source: `https://ofcuikmhcbbedxkmfuxy.supabase.co/storage/v1/object/public/site-media/00000000-0000-4000-8000-000000000001/0422338f-cfa8-4652-8012-4576e4ab0306.png`. It is hosted locally as `axiomotl-axolotl.png`; the footer uses the existing white CSS treatment. The earlier vector A remains an unused reference asset.
- Lato 400/700/900: Google Fonts distribution, locally hosted from fonts.gstatic.com Lato v25. Lato is distributed under SIL Open Font License 1.1; the accompanying license is included with the font files.

Source fragments: `finder.html`, `brief.html`, `hero.html`; theme/responsive refinements: `combined.css` and `hero.css`; composition and validation: `scripts/build-combined.ts`. The existing FormRunner remains the sole form implementation.

## Crisp native hero with GSAP

The supplied 1258×712 reference remains in `public/site-assets/combined/hero-reference.png` for provenance, but is no longer rendered. The owner's sharpness request is handled by native HTML text/controls, CSS tile surfaces and grid, and inline SVG arcs. The existing local logo and five original icon PNGs remain in use. Visible desktop text is independently editable rather than baked into a screenshot. `reference-hero.css` owns the rebuilt composition.

Both side statements are white. GSAP animates connection signals, arc highlights and purple atmosphere layers; it does not move the text or labels. All ambient effects respect shared pause controls, reduced motion, visibility and navigation cleanup. The official GSAP Core skill used is https://raw.githubusercontent.com/greensock/gsap-skills/main/skills/gsap-core/SKILL.md. The existing local library is reused.

`npx playwright test tests/e2e/combined.spec.ts --trace=off` covers native text/white statements, existing forms/editor, five-stage controls, navigation, actual signal/arc/glow animation and pause, mobile reduced motion and operation without GSAP. Screenshots are in `outputs/hero-reference/crisp-desktop.png` and `crisp-mobile.png`. Earlier pixel-identical bitmap verification applies only to the superseded image-backed version.

## Approved review refinements

The hero now names the service and audience. Desktop stage details occupy a separate flow area below the original-proportion illustration; mobile uses a compact five-button selector with one description. The motion control remains visible without opening a stage. Original white statements, green accents and chasing GSAP arcs are retained, with softened atmosphere edges.

Navigation labels the philosophy correctly and conversation actions link directly to the published email address. Services reuse the supplied icon family, mobile cards use compact content-driven layouts, and the approach section explains three engagement activities instead of repeating the five hero stages. A lavender transition and green rule connect the hero to the body.

No principal biography, client results or testimonials were available in the project. Those require owner-supplied facts. Healthcare remains an unresolved positioning question; existing approved health-oriented statements are retained.

## RSMS slideshow imagery

Source: owner's `RSMS BAU Readiness at UQ Scale (Supporting Documentation for RP).pdf`, prepared by Dr. Ramzi Abbassi, 9 April 2026. Selected diagrams are rendered directly from PDF vector content as WebP, with 960px previews and 1920px enlarged versions under `public/site-assets/combined/rsms/`.

- Page 15, rectangle (15,150)-(950,540): process map.
- Page 21, rectangle (25,195)-(945,515): decision tree.
- Page 24, rectangle (160,115)-(810,525): governance and operational capability model.

Coordinates use PDF points. Diagram labels and content are retained; page mastheads are outside the excerpts. Visible captions attribute the source and distinguish examples/proposed controls from achieved results. The complete supporting PDF is not copied into public assets. Each diagram opens its enlarged version via a native keyboard-accessible link. These replace the generic office visual and add an analysis-example section after the engagement approach.

GSAP tidy-up (18 September): `src/runtime/page-motion.ts` owns finder/diagram link cues and native disclosure content reveals. Uses scoped matchMedia, reversible pre-created tweens, AbortController listener cleanup, and local refresh on shared motion/visibility changes. CSS no longer animates the same link transforms. No scroll-gated content or height animation. Hero pointer/focus feedback tracks both states and ignores touch hover. Existing shared forms and page structure unchanged.

## Workflow reference hero — 18 September

The approved reference uses a left-aligned proposition, native SVG/CSS luminous workflow, readiness/ownership panels and five horizontal stage cards. `workflow-hero.css` owns this composition after the earlier hero styles. Mobile retains the workflow and offers a horizontal, keyboard-operable stage strip. GSAP animates the headline entrance, pathway particles, factual 5-stage/4-service counts and one-time journey entrance; pointer motion is slight. Existing pause, reduced motion and no-GSAP paths remain available.

The red annotation is guidance, not site content. The background uses the suggested animated-gradient option; no approach video is supplied, so the secondary action links to the approach section. Readiness graphics are marked illustrative; unsupported years/percentage performance claims are not used. Existing source attribution and form workflows are retained.

Owner confirmation, 18 September: the owner explicitly confirmed the reference's 20+ years' experience, +60% faster decisions and readiness figures (92%, 87%, 78%, 71%) as factual and requested their use. These replace the provisional service counts/illustrative label. Animated counters preserve the + and % suffixes, including reduced-motion cleanup.

## Latest screenshot match — 18 September

The supplied 1495×773 screenshot controls desktop proportions: taller hero, content at 11.5% left/20.8% top, larger CTA spacing, full-size extruded stage cards with a partially visible fifth card. The card row is a contained horizontal scroller; selecting a clipped card brings it fully into view on desktop as well as mobile. Removed the upper-right slogan absent from this reference. The existing GSAP hover remains.

UI UX Pro Max: the installed skill was catalog-only, so the upstream repository was fetched into `outputs/ui-ux-pro-max-upstream` and its full `.claude/skills/ui-ux-pro-max/SKILL.md` read. Targeted UX search covered horizontal scrolling, visible focus and unobscured focused controls. The screenshot overrides generic visual recommendations; page-level horizontal overflow remains disallowed.
