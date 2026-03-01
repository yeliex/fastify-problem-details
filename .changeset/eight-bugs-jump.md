---
"@yeliex/fastify-problem-details": minor
"@yeliex/problem-details": minor
---

Convert repository to a monorepo with separate core and Fastify packages.

Changes include:

- Add new `@yeliex/problem-details` package for core `ProblemDetail` model and types.
- Keep `@yeliex/fastify-problem-details` as Fastify integration layer and compatibility re-exports.
- Extend `httpErrors` access to support all forms:
  - `httpErrors.NotFound`
  - `httpErrors[404]`
  - `httpErrors['404']`
- Remove `statuses` package usage and rely on Node's `STATUS_CODES`.
