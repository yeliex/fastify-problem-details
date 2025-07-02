# @yeliex/fastify-problem-details

[![npm version](https://img.shields.io/npm/v/@yeliex/fastify-problem-details)](https://www.npmjs.com/package/@yeliex/fastify-problem-details)
[![license](https://img.shields.io/github/license/yeliex/fastify-problem-details)](https://github.com/yeliex/fastify-problem-details/blob/master/LICENSE)
[![ci test](https://img.shields.io/github/actions/workflow/status/yeliex/fastify-problem-details/test.yml?branch=master)](https://github.com/yeliex/fastify-problem-details/actions)

A Fastify plugin and utility for
handling [RFC 9457 Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc9457). Provides a standard
way to return machine-readable error details in HTTP responses, with built-in support for common HTTP errors and easy
integration with Fastify.

RFC 9457 is the new version of RFC 7807, which defines a standard format for error responses in HTTP APIs. This library
helps you create and manage these error responses in a consistent way.

## Features

- ProblemDetail class for creating RFC 9457-compliant error objects
- Built-in HTTP error types (e.g., 400, 404, 500, etc.)
- Fastify plugin for automatic error handling and response formatting
- TypeScript support

## Installation

```sh
npm install @yeliex/fastify-problem-details
```

or

```sh
pnpm add @yeliex/fastify-problem-details
```

## Usage

### Basic Usage

```ts
import { ProblemDetail, httpErrors } from '@yeliex/fastify-problem-details';

// Create a ProblemDetail instance
const error = new ProblemDetail(404, 'Resource not found', { type: 'https://example.com/probs/not-found' });
console.log(error.toJSON());

// Use httpErrors
const badRequest = new httpErrors.BadRequest('Invalid input');

// withValidationError
const validationError = new httpErrors.BadRequest('Validation failed', {
    errors: [
        { field: 'username', message: 'Username is required' },
        { field: 'email', message: 'Email is invalid' }
    ]
});
```

### Fastify Plugin

Use the Fastify plugin to automatically handle errors and format responses according to RFC 9457.

```ts
import Fastify from 'fastify';
import { fastifyProblemDetails } from '@yeliex/fastify-problem-details';

const app = Fastify();
app.register(fastifyProblemDetails);

app.get('/', async (request, reply) => {
    console.log(request.acceptsProblemJson);
    throw new app.httpErrors.NotFound('Resource not found');

    // or
    reply.problem(
        new ProblemDetail(404, 'The requested resource was not found', {
            type: 'https://example.com/probs/not-found',
            instance: `/resource/${request.params.id}`,
        }),
    );
});

app.listen({ port: 3000 });
```

### Standalone Usage (without Fastify plugin)

Only use ProblemDetail as error response format, instead of Fastify plugin.

```ts
import { fastifyErrorHandler } from 'fastify-problem-details';
import { FastifyReply } from 'fastify';

const app = Fastify();
app.setErrorHandler(fastifyErrorHandler);
```

## API Reference

### ProblemDetail

A class representing an RFC 7807-compliant error response.

```ts
import { ProblemDetail } from '@yeliex/fastify-problem-details';

const problem = new ProblemDetail(404, {
    type: 'https://example.com/probs/not-found',
    title: 'Not Found',
    detail: 'Resource not found',
    instance: '/resource/123',
    customField: 'any extra data', // You can add custom fields
});
```

**Constructor signatures:**

```
new ProblemDetail(status: number, options?: ProblemDetailInit)
new ProblemDetail(status: number, detail?: string, options?: ProblemDetailInit)
```

- `status`: `number` HTTP status code
- `detail`: `string?` Optional error detail
- `options`: [`ProblemDetailInit`](/yeliex/fastify-problem-details/blob/master/src/ProblemDetail.ts#L3-L18) Optional object extending standard fields and allowing custom properties

**Methods:**

- `toJSON()`: [`ProblemDetailJSON & ProblemDetailExtend`](/yeliex/fastify-problem-details/blob/master/src/ProblemDetail.ts#L3-L13) Returns a plain object suitable for JSON serialization.

### httpErrors

A collection of pre-defined HTTP error constructors for common status codes.

[Supported http errors](/yeliex/fastify-problem-details/blob/master/src/httpErrors.ts#L4-L72)

```ts
import { httpErrors } from '@yeliex/fastify-problem-details';

throw new httpErrors.NotFound('Resource not found', { instance: '/resource/123' });
```

Each error is a subclass of `ProblemDetail` and supports the same constructor signatures.

**Constructor signatures:**

```
new httpErrors.BadRequest(options?: ProblemDetailInit)
new httpErrors.BadRequest(detail?: string, options?: ProblemDetailInit)
````

### createError / createHttpError

Factory functions for custom or dynamic HTTP errors.

```ts
import { createHttpError } from '@yeliex/fastify-problem-details';

const CustomError = createHttpError(422, 'Custom validation failed');
throw new CustomError('Invalid input', { custom: 'extra' });
```

**Factory signatures:**

```
createError(status: number, name: string, detail?: string):typeof ProblemDetail
createHttpError(status: number, detail?: string):typeof ProblemDetail
```

### Fastify Plugin

Register the plugin to add `reply.problem()` and `httpErrors` to your Fastify instance.

```ts
import fastifyProblemDetails from '@yeliex/fastify-problem-details';

app.register(fastifyProblemDetails);

app.get('/', async (req, reply) => {
    reply.problem(404, { detail: 'Not found' });
    throw app.httpErrors.NotFound('Resource not found');
});
```

**Plugin Options:**
- `responseStack`: `boolean` (default: `false`) - Include error stack trace in the response body for debugging purposes.

**Fastify Instance:**

- `app.httpErrors`: Access to pre-defined HTTP error constructors.
  **Request API:**
- `request.acceptsProblemJson`: `boolean` Indicates if the client accepts Problem Details in JSON format.
  **Reply API:**
- `reply.problem(problem: ProblemDetail)`
- `reply.problem(status: number, init?: ProblemDetailInit)`
- `reply.problem(status: number, detail?: string, init?: ProblemDetailInit)`

### replyProblem

Send a Problem Detail response directly.

You can enable `responseStack` to include the error stack trace in the response.

```ts
import { replyProblem } from '@yeliex/fastify-problem-details';

app.get('/example', async (request, reply) => {
    // Using ProblemDetail instance
    replyProblem(reply, new ProblemDetail(404, 'Not Found'));

    // Using status and init object
    replyProblem(reply, 404, { type: 'https://example.com/probs/not-found', detail: 'Resource not found' });

    // Using status, detail, and init object
    replyProblem(reply, 404, 'Resource not found', { type: 'https://example.com/probs/not-found' }, { responseStack: true });
});
```

### fastifyErrorHandler

A Fastify error handler that formats errors as Problem Details.

You can enable `responseStack` to include the error stack trace in the response.

**Response Header:**
If the request accepts Problem Details, the response will include a `Content-Type: application/problem+json` header.

Otherwise, it will use `Content-Type: application/json`, but the response body will still be a `ProblemDetail` object.

```ts
import { fastifyErrorHandler } from '@yeliex/fastify-problem-details';

app.setErrorHandler((error, request, reply) => {
    fastifyErrorHandler.call(app, error, request, reply, { responseStack: true });
});
```

### acceptsProblemJson

Check if the client accepts Problem Details in JSON format.

```ts
import { acceptsProblemJson } from '@yeliex/fastify-problem-details';

app.get('/', async (request, reply) => {
    if (acceptsProblemJson(request)) {
        reply.send({ message: 'Client accepts Problem+JSON format' });
    } else {
        reply.send({ message: 'Client does not accept Problem+JSON format' });
    }
});
```
