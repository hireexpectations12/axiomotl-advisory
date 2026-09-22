# Combined Axiomotl website implementation

Approved direction: combine the ChatGPT site's purple/teal photographic identity and compact content with the existing Vercel application's service finder, decision brief and editable document model.

Architecture: preserve FormRunner, its configuration and the owner platform. Build a validated SiteDocument from archived public sources, source CSS and a repeatable build script. Render it at /design-preview using the existing production renderer. Do not overwrite the database publication while preparing the review preview.

1. Archive the supplied pages and required assets; retain provenance. Extract the current public form definitions rather than recreating routing rules.
2. Compose hero, integrated service finder, four expandable services, decision brief, method, practitioner experience and contact. Reuse the canonical mobile menu and form hooks. Use native disclosures for extra reading.
3. Apply local Lato typography, purple #481e72, deep purple #2a0f4b, teal #227e7b, white and lavender. Preserve focus, reduced motion, contrast and responsive behavior.
4. Produce the editable JSON and a no-index Next preview route. Document source/build/output ownership.
5. Verify form routing, decision summary, keyboard restoration, mobile menu, disclosures, anchors, assets, narrow widths and reduced motion. Run formatting, typecheck, unit tests and production build. Inspect screenshots before handoff.
