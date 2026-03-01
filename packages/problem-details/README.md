# @yeliex/problem-details

Core RFC 9457 Problem Details model for JavaScript/TypeScript.

## Install

```sh
pnpm add @yeliex/problem-details
```

## Usage

```ts
import { ProblemDetail } from '@yeliex/problem-details';

const problem = new ProblemDetail(404, 'Resource not found', {
  type: 'https://example.com/problems/not-found'
});
```
