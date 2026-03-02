# @yeliex/fastify-problem-details

## 1.3.0

### Minor Changes

- bfd25ca: feat: enhance ProblemDetail with custom toString and inspect behavior

### Patch Changes

- bfd25ca: chore: update build script to use custom TypeScript configuration and add tsconfig.build.json
- Updated dependencies [bfd25ca]
  - @yeliex/problem-details@1.3.0

## 1.2.0

### Minor Changes

- 8af2a6a: Refactor error conversion and HTTP error exports across packages.

  - Remove generic `toProblemDetail` export from `@yeliex/problem-details`.
  - Move HTTP error factories/types to `@yeliex/problem-details/http-error`.
  - Keep `@yeliex/fastify-problem-details` behavior aligned by re-exporting and consuming the new core subpath.
  - Update README docs for the new API surface and recommended usage.

### Patch Changes

- Updated dependencies [8af2a6a]
  - @yeliex/problem-details@1.2.0

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

- Updated dependencies [fb0b647]
- Updated dependencies [fb0b647]
  - @yeliex/problem-details@1.1.0
