# @yeliex/fastify-problem-details

Fastify integration for RFC 9457 Problem Details.

This package re-exports everything from `@yeliex/problem-details`, and adds Fastify plugin utilities.

## Install

```bash
pnpm add @yeliex/fastify-problem-details fastify
```

## Quick Start

```ts
import Fastify from 'fastify';
import { fastifyProblemDetails } from '@yeliex/fastify-problem-details';

const app = Fastify();
await app.register(fastifyProblemDetails);

app.get('/users/:id', async (_request, reply) => {
  return reply.problem(404, 'User not found', { code: 'USER_NOT_FOUND' });
});

await app.listen({ port: 3000 });
```

## Plugin Features

After `register(fastifyProblemDetails)`:

- `app.httpErrors`
- `request.acceptsProblemJson`
- `reply.problem(...)`
- default global `setErrorHandler`
- default global `setNotFoundHandler`

## `reply.problem(...)`

Overloads:

```ts
reply.problem(problem: ProblemDetail)
reply.problem(status: number, init?: ProblemDetailInit)
reply.problem(status: number, detail?: string, init?: ProblemDetailInit)
```

Behavior:

- returns `application/problem+json` when `Accept` prefers it
- otherwise returns `application/json`
- response status always equals `problem.status`

## `httpErrors`

Built-in typed HTTP error constructors.

All access patterns are supported:

```ts
import { httpErrors } from '@yeliex/fastify-problem-details';

new httpErrors.NotFound('missing');
new httpErrors[404]('missing');
new httpErrors['404']('missing');
```

Each constructor extends `ProblemDetail` and supports the same options/extensions.

## `toProblemDetail(error)` in Fastify package

`@yeliex/fastify-problem-details` exports its own `toProblemDetail` that is tuned for runtime HTTP handling:

- `Error` with empty `message` falls back to status phrase (for example `404 -> Not Found`)
- preserves `statusCode`, `cause`, `stack`, and extra fields

If you need framework-agnostic conversion, use `toProblemDetail` from `@yeliex/problem-details`.

## License

MIT
