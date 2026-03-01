# @yeliex/problem-details

## 1.1.0

### Minor Changes

- fb0b647: Convert repository to a monorepo with separate core and Fastify packages.

  Changes include:

  - Add new `@yeliex/problem-details` package for core `ProblemDetail` model and types.
  - Keep `@yeliex/fastify-problem-details` as Fastify integration layer and compatibility re-exports.
  - Extend `httpErrors` access to support all forms:
    - `httpErrors.NotFound`
    - `httpErrors[404]`
    - `httpErrors['404']`
  - Remove `statuses` package usage and rely on Node's `STATUS_CODES`.

### Patch Changes

- fb0b647: Migrate release workflow to npm trusted publishing (OIDC) and remove legacy `NPM_TOKEN`-based `.npmrc` setup.

  Changes include:

  - Enable `id-token: write` permission for release job.
  - Upgrade Node setup action and use repository `.node-version`.
  - Configure npm registry via `setup-node` instead of writing auth token manually.
  - Keep changesets-based publish flow unchanged.
