# @yeliex/fastify-problem-details

Fastify plugin and helpers for RFC 9457 Problem Details.

## Install

```sh
pnpm add @yeliex/fastify-problem-details fastify
```

## Usage

```ts
import Fastify from 'fastify';
import { fastifyProblemDetails } from '@yeliex/fastify-problem-details';

const app = Fastify();
app.register(fastifyProblemDetails);
```

`httpErrors` supports all three access patterns:

```ts
httpErrors.NotFound;
httpErrors[404];
httpErrors['404'];
```
