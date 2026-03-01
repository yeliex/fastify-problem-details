# fastify-problem-details

`fastify-problem-details` is a pnpm monorepo for RFC 9457 Problem Details:

- `@yeliex/problem-details`: framework-agnostic Problem Details core.
- `@yeliex/fastify-problem-details`: Fastify plugin and HTTP error factories.

## Packages

- [`packages/problem-details`](./packages/problem-details)
- [`packages/fastify-problem-details`](./packages/fastify-problem-details)

## Requirements

- Node.js `>=20`
- pnpm `>=10`

## Workspace Setup

```bash
pnpm install
```

## Development Commands

Run from repository root:

```bash
pnpm build
pnpm test:type
pnpm test:unit
pnpm test
```

- `test:type`: TypeScript project references check (`tsc --build`).
- `test:unit`: run all package tests with `tsx`.

## Publish Flow

This repo uses [Changesets](https://github.com/changesets/changesets).

```bash
pnpm changeset
```

Then merge to release branch and let CI publish.

## License

MIT
