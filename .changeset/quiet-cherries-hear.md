---
"@yeliex/fastify-problem-details": patch
---

Align Fastify error handling behavior with Fastify defaults and improve status/logging consistency.

- Prefer `error.status` over `error.statusCode`, and fallback to `500` for invalid (<400) statuses
- In `fastifyErrorHandler`, keep `reply.statusCode` when it is already `>= 400` and sync problem status/title accordingly
- Forward `error.headers` in the Fastify error handler
- Preserve `status` and `title` when the thrown error is already a `ProblemDetail`
- Respect Fastify `disableRequestLogging` flag when logging problem responses
