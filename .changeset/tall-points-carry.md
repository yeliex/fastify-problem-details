---
"@yeliex/fastify-problem-details": minor
"@yeliex/problem-details": minor
---

Add secure response filtering support with private symbol metadata.

- add `responseFilter` coverage and examples for Fastify plugin usage
- allow `ProblemDetail` to carry `symbol` extension fields
- pass symbol-based private fields into `responseFilter` input while keeping `toJSON()` output clean
- document `PROBLEM_PRIVATE = Symbol.for('private')` pattern for attaching internal context (e.g. traceId)
