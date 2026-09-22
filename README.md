# Axiomotl Advisory

Website, design source and private owner platform. The application is in `owner-platform/`.

- Website: https://axiomotl-advisory.vercel.app/
- Content workspace: https://axiomotl-advisory.vercel.app/admin
- [Remote working guide](docs/remote-working.md)
- [Continue on another laptop](docs/laptop-handoff.md)
- [Owner guide](owner-platform/docs/owner-guide.md)
- [Technical setup](owner-platform/README.md)

## Develop in a browser

Open this repository in GitHub, choose **Code → Codespaces → Create codespace**, and wait for dependency installation. The terminal opens in `owner-platform`.

```sh
npm run dev -- --hostname 0.0.0.0
```

Open forwarded port **3000** from the Ports panel and append `/design-preview` to its URL. This design preview works without production database credentials.

Commit and push your changes before switching computers. Pushing code does not automatically publish website content.
