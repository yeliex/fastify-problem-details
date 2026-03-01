---
"@yeliex/fastify-problem-details": patch
"@yeliex/problem-details": patch
---

Migrate release workflow to npm trusted publishing (OIDC) and remove legacy `NPM_TOKEN`-based `.npmrc` setup.

Changes include:

- Enable `id-token: write` permission for release job.
- Upgrade Node setup action and use repository `.node-version`.
- Configure npm registry via `setup-node` instead of writing auth token manually.
- Keep changesets-based publish flow unchanged.
