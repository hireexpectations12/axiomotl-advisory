# Working on Axiomotl remotely

## Edit content from any computer

Visit https://axiomotl-advisory.vercel.app/admin and sign in with your existing owner account. No connection to the original Windows computer is needed. Use **Pages**, **Forms**, **Media** or **Site settings**; save and preview before publishing. The [owner guide](../owner-platform/docs/owner-guide.md) explains staff access, drafts and revision history.

Use password recovery on the login screen if needed. If recovery mail is not configured or does not arrive, an administrator must arrange a new private setup link. Credentials and setup links are not stored in this repository.

## Edit code and design from a browser

1. Sign in to GitHub with the account that owns this private repository, or an invited collaborator account.
2. Choose **Code → Codespaces → Create codespace**. Dependencies install automatically using the included dev-container configuration.
3. In the terminal, run `npm run dev -- --hostname 0.0.0.0`.
4. Open port **3000** in the Ports panel. Append `/design-preview` to preview the current design source.
5. Edit `design/combined/` for page markup/styles and `src/runtime/` for interactions. After changing these source files, stop and restart the development command to regenerate the document and runtime bundle.
6. Run `npm test` and `npm run build` before a release.
7. Commit and push using Source Control. Reopen the same Codespace next time, or clone the repository on another computer.

Stop your Codespace when finished using GitHub's Codespaces page. GitHub may charge for usage beyond your account's included allowance. No Codespace is started by this repository configuration alone.

## Preview versus production

`/design-preview` renders the source-generated design. The live homepage renders the published document stored in Supabase. Dashboard edits live in that database, not in Git. These are separate sources and must be reconciled before replacing a published page.

The default remote development setup needs no secrets and does not connect to the production database. Use the live dashboard for real content management. For backend development, configure a separate Supabase development project using `owner-platform/.env.example` and the technical setup guide. Never commit `.env.local`, authentication state, private enquiries or exported site backups.

## Release code deliberately

The production Vercel project is `axiomotl-advisory` under `hire-expectations-projects`. From `owner-platform`, authenticate to Vercel and link that existing project before deploying. Do not create a replacement project. Git pushes are not connected to automatic production deployment by this setup.

Code deployment updates application code and assets. Content publication is a separate operation in the owner dashboard. The scripts named `publish-*` are administrator release tools: read them, back up current content, and reconcile any newer dashboard edits before use.

## References

- [Create a GitHub Codespace](https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository)
- [Forwarded development ports](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace)
