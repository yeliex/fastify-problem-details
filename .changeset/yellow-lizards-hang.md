---
"@yeliex/problem-details": minor
"@yeliex/fastify-problem-details": minor
---

Refactor error conversion and HTTP error exports across packages.

- Remove generic `toProblemDetail` export from `@yeliex/problem-details`.
- Move HTTP error factories/types to `@yeliex/problem-details/http-error`.
- Keep `@yeliex/fastify-problem-details` behavior aligned by re-exporting and consuming the new core subpath.
- Update README docs for the new API surface and recommended usage.
