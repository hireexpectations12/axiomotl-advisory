# Owner workspace interaction contract

## Business sources

The maintained source is `../docs/owner-editor-design.md` and the API/state types in `src/lib/types.ts`. Access is invitation-only site membership. Drafts are private; publishing creates an immutable complete revision. Restore replaces the working draft and requires a later publish. Uploaded media is immutable. There are no billing controls or invented legal policies in this workspace.

## Canonical UI map

| Capability     | Canonical owner                                        | Source of truth                | Allowed variants                          | Verification                               |
| -------------- | ------------------------------------------------------ | ------------------------------ | ----------------------------------------- | ------------------------------------------ |
| Select/Listbox | Native HTML select                                     | This contract                  | Platform-owned popup accepted             | Browser keyboard and narrow viewport       |
| Form           | OwnerUI Field / Textarea, FormEditor labelled controls | This contract / API validators | Page, brand, form mapping                 | Typecheck and browser interaction          |
| Scrollbar      | admin.css global baseline                              | DESIGN.md tokens               | Canvas iframe remains editor-owned        | Computed-style check                       |
| Toast          | Dashboard document-status and persistent notice        | This contract                  | Save, pending, error, conflict            | Browser save failure test                  |
| CRUD           | Dashboard / OwnerUI api helper                         | Site APIs                      | Autosave, explicit save, publish, restore | API tests and authenticated browser checks |
| Confirmation   | OwnerUI Confirm                                        | This contract                  | Inline non-modal confirmation             | Keyboard and focus checks                  |

## Flow ledger

- Navigation within the workspace retains the draft in React state. No tab stores authoritative content in browser storage. URL history is deliberately not used for private transient editor selection.
- Autosave begins after 1.8 seconds of inactivity. Explicit Save draft uses the same path. A failed save halts autosave until retry; the local document is preserved. Edits made during a save remain dirty and are saved afterward.
- Version conflicts never overwrite the newer draft. Download my work preserves local project JSON; loading the latest draft has an explicit discard confirmation. Actual tab unload uses the browser unsaved-change mechanism.
- Publish explicitly confirms public visibility and saves first. Restore explicitly confirms draft replacement. The live version stays unchanged until publishing.
- Inline confirmations are non-modal sections, with Cancel first. They do not trap focus or claim dialog semantics. Component removal is reversible with editor Undo; page deletion requires confirmation. Home-page deletion is disabled.
- Save state occupies a stable bar and announces via a polite live region. Critical errors persist with retry/recovery controls. API 401 preserves local state and offers signing in in another tab.
- Media uses immutable upload paths, bounded batches of 24 and a client name filter. Revision history displays 20 items at a time. No row selection or date entry capability is needed.
- All native select popups use operating-system geometry and keyboard behavior. Dates are read-only and formatted in `en-AU` using the viewer's local timezone.
- The stable navy sidebar changes to wrapping navigation at 760px. Long settings and forms use normal document scrolling; only the visual canvas owns a bounded internal surface.
- GrapesJS owns canvas selection, layers, styles and block panels. Visible move/duplicate/visibility actions provide alternatives to dragging. Server sanitization remains authoritative; arbitrary scripting has no editor control.
- The PostCSS import parser preserves variable-based shorthand declarations, including the production font and background. Browser tests assert both the canvas font and the exported CSS after saving; native browser CSSOM parsing is not an acceptable import fallback.

## Verification boundary

Typecheck, tests and the production build establish local correctness. `tests/e2e/editor.spec.ts` exercises a baseline import, canvas text edits, saved project reload, new page settings, conflict recovery, form outcomes, narrow-screen navigation and publish confirmation using intercepted APIs and the real draft validator. Backend credentials and an actual member account are required to verify persisted save, concurrent sessions, restore, upload and publish. Local isolated component tests do not imply deployed readiness.
