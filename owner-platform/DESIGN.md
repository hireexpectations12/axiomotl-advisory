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
