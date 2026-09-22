# Client-approved reference implementation

The current local `/design-preview` is built from `owner-platform/design/advisory/index.html` and `styles.css` by `npm run design:build`.

Design authority: the supplied `example 3.png` (887 × 1774). The original image is preserved unchanged at `public/site-assets/client-final/approved-reference.png`. CSS windows reuse its exact brand and document illustrations; the website's headings, copy, links, stages, and enquiry fields are real HTML. Desktop section dimensions follow the reference; below 700px the content stacks for mobile.

The prior draft is backed up in `backups/pre-client-final/` at the repository root. This work changes the local generated design only; no production publication was performed.

The enquiry controls validate required fields and prepare a reviewable email using the configured site address. They do not submit or store enquiries. The privacy dialog explains this preview behavior. A production privacy policy and confirmed LinkedIn profile destination are still needed before publication.

Validation: TypeScript checking, all 83 existing tests, browser review at reference width and mobile, in-page anchor checks, required-field validation, and privacy dialog open/close. Raster artwork fidelity at large sizes is limited by the supplied reference resolution.
