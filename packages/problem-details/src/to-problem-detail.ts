import { ProblemDetail } from './problem-detail.js';

export const toProblemDetail = (error: unknown): ProblemDetail => {
    if (error instanceof ProblemDetail) {
        return error;
    }

    if (error instanceof Error) {
        const { statusCode, message, ...extra } = error as Error & {
            statusCode?: unknown;
            [key: string]: unknown;
        };
        const status = typeof statusCode === 'number' ? statusCode : 500;
        const init = {
            type: 'about:blank',
            ...extra,
            stack: error.stack,
            cause: error.cause,
        };

        if (message) {
            return new ProblemDetail(status, message, init);
        }

        return new ProblemDetail(status, init);
    }

    return new ProblemDetail(500, String(error), {
        type: 'about:blank',
        cause: error,
    });
};
