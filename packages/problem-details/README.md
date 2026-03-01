# @yeliex/problem-details

Framework-agnostic RFC 9457 Problem Details core.

## Install

```bash
pnpm add @yeliex/problem-details
```

## API

### `ProblemDetail`

```ts
class ProblemDetail extends Error {
  constructor(status: number, options?: ProblemDetailInit)
  constructor(status: number, detail?: string, options?: ProblemDetailInit)
}
```

- `status`: HTTP status code.
- `detail`: optional human-readable detail.
- `options` supports standard fields and custom extensions:
  - `type` (default: `about:blank`)
  - `title` (default: HTTP status phrase)
  - `instance`
  - `cause`
  - any custom extension members (for example `traceId`, `code`, `foo`)

### `toProblemDetail(error: unknown): ProblemDetail`

Normalize unknown values into `ProblemDetail`:

- returns original value when input already is `ProblemDetail`
- converts `Error` and preserves `statusCode`, `message`, `cause`, `stack`, and extra enumerable fields
- converts non-Error values to `500` ProblemDetail

## Usage

```ts
import { ProblemDetail, toProblemDetail } from '@yeliex/problem-details';

const problem = new ProblemDetail(404, 'User not found', {
  type: 'https://example.com/problems/user-not-found',
  instance: '/users/42',
  traceId: 'req-123',
});

console.log(problem.toJSON());

const normalized = toProblemDetail(new Error('Unexpected failure'));
console.log(normalized.status); // 500
```

## JSON Output

`problem.toJSON()` returns RFC 9457 base fields plus extensions:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input",
  "instance": "/users",
  "traceId": "req-123"
}
```

## License

MIT
