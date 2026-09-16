# Axiomotl owner guide

## Sign in

Open your website's `/admin` address. Use your invited owner email and password. The initial one-use setup link opens a password form; it is private and should not be shared. There is no public account registration.

If you forget your password, enter your email on the sign-in screen and choose **Send password recovery email**. Recovery needs the site's configured email sender and templates. If mail does not arrive, ask the project administrator to check delivery or generate another one-use setup link.

## Save, preview and publish

Edits are private drafts. The workspace attempts to save about two seconds after you stop editing. Wait for **Draft saved** before leaving; **Unsaved changes** or **Draft not saved** means your latest work has not been confirmed by the server. You can also use **Save draft**.

**Preview** saves the draft and opens it in a separate authenticated tab. Use the visual editor's desktop/tablet/mobile controls to inspect responsive layouts. **Publish** asks for confirmation, saves pending edits, validates the document and makes pages, settings and form mappings live together. An open visitor form continues using its loaded configuration.

If another session saves first, your save is blocked to prevent overwriting it. Download your unsaved work before loading the latest draft, then reapply the changes you want to keep. The downloaded file is a recovery reference; the workspace has no automatic import/merge action. Do not close the tab until you have saved or downloaded important changes.

## Pages and appearance

Choose **Pages**, then the page you want to edit. Select content in the canvas to change text, links, images, layout and styles. Use the editor's layers and blocks for structure and its undo/redo controls while editing.

Use **Add page** or **Duplicate page** to create a page. In **Page settings**, edit the title, public path, description, social image and search indexing preference. Use unique lowercase paths such as `/services`; `/admin`, `/api`, `/auth` and other application paths are reserved. Update visible navigation links in the page canvas to include new pages.

**Site settings** controls the site name, contact email, logo, favicon, colours, fonts and supported motion. Preview the result across pages. The editor preserves reviewed interactions; adding arbitrary application logic or JavaScript requires development.

## Forms and routing

Choose **Forms** and select the guided journey or decision builder. They have separate configurations.

- Edit question wording, help text, choices and outcomes. Reordering or renaming preserves permanent IDs and their mappings.
- Turn off **Required answer** to allow a visitor to skip a question. Optional questions follow the configured rule/default route when skipped.
- Set an answer's destination override when that answer should route directly. Otherwise rules are evaluated in their visible order; the first matching rule wins, followed by the question default and form fallback.
- Rules can match all or any selected conditions and can route to another question or an outcome. Move rules up/down to change precedence.
- A question's answer type cannot change while rule conditions refer to it. The editor lists those rules. Remove the affected conditions, change the type, then recreate the conditions for the new answer type.
- Change result titles, explanation, deliverables and call-to-action text/link in Outcomes.
- Configure the summary email destination and subject. The subject supports `{form}` and `{outcome}`. Summary content includes the visitor's answers, configured result and optional additional context.

Use **Test this mapping** to answer the form and inspect its route, matching rules and result. Try every important branch and fallback. The same evaluator runs publicly. Going back and changing a choice clears answers that no longer belong to the resulting route.

Removing a referenced question, answer or outcome leaves a visible mapping error. Drafts can retain unfinished mappings, but publishing is blocked until missing references and cycles are repaired. Warnings identify unreachable or potentially overlapping routes. Cycle checks are conservative for conditional rules: simplify contradictory routes if a flagged loop cannot actually be reached.

The visitor's email action opens a draft in their email application. It does not automatically send a submission. Visitors can also download their summary as text.

## Images

Open **Media** to upload PNG, JPEG, GIF or WebP images up to 4 MB. SVG uploads are not supported. Select media or use its URL in the visual editor; provide useful alternative text when inserting images.

Uploaded media is publicly accessible. Upload only material intended for your website. Replacing an image means uploading a new file and changing the page reference. Old files remain available so historical revisions still work.

## History and rollback

**History** lists the original imported baseline and published revisions. Restoring a revision replaces the current draft with that saved document; save or download current work first. Restore does not change the live website. Preview the restored draft and choose **Publish** when ready.

Autosaves update the working draft; they are not separate named entries in History.

## Downloads and backups

**Download site export** contains the last saved draft, page editor data, settings, asset references and rendered HTML. Save pending changes before exporting. The export does not contain uploaded image files, account credentials or full revision history, and there is no one-click export import.

Ask the administrator to keep independent database and image-storage backups along with the source repository. Refer to the [technical setup and recovery notes](../README.md#export-backups-and-recovery) before transferring or restoring the entire service.

## Common problems

| Message or symptom | What to do |
| --- | --- |
| Owner platform is not configured | Ask the administrator to configure Supabase credentials and `APP_URL` on this deployment. |
| Request origin is not allowed | Use the configured site address; the administrator must update `APP_URL` after an address change. |
| Account is not an owner | The account needs membership for this site; authentication alone is insufficient. |
| Draft changed in another session | Download your unsaved work, load the latest draft, then reapply your changes. |
| Mapping errors block publication | Open Forms and repair the listed references or loops, then test again. |
| Preview does not open | Allow a new tab for this website and confirm the draft saved successfully. |
| Recovery link expired | Request a fresh email or ask the administrator to regenerate a setup link. |
| Upload rejected | Check the actual file type and 4 MB limit; renaming a file does not change its type. |

Use **Sign out** when finished, especially on a shared device.
