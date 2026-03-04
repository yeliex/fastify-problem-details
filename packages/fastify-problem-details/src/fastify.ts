import { ProblemDetail, type ProblemDetailInit } from '@yeliex/problem-details';
import { httpErrors } from '@yeliex/problem-details/http-error';
import accepts from 'accepts';
import { type FastifyInstance, type FastifyPluginCallback, type FastifyReply, type FastifyRequest } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';
import { STATUS_CODES } from 'node:http';
import { createRequire } from 'node:module';

const acceptSymbol = Symbol.for('accept-problem-json');
const require = createRequire(import.meta.url);
const { kDisableRequestLogging } = require('fastify/lib/symbols.js') as {
    kDisableRequestLogging: symbol;
};

declare module 'fastify' {
    interface FastifyInstance {
        httpErrors: typeof httpErrors;
    }

    interface FastifyRequest {
        acceptsProblemJson: boolean;
        [acceptSymbol]?: boolean;
    }

    interface FastifyReply {
        problem: {
            (problem: ProblemDetail): void;
            (status: number, init?: ProblemDetailInit): void;
            (status: number, detail?: string, init?: ProblemDetailInit): void;
        };
    }
}

type ReplyProblemOptions = {
    responseStack?: boolean;
    responseFilter?: (input: unknown) => unknown;
};

type ReplyProblem = {
    (reply: FastifyReply, problem: ProblemDetail, options?: ReplyProblemOptions): ReturnType<FastifyReply['send']>;
    (
        reply: FastifyReply,
        status: number,
        init?: ProblemDetailInit,
        options?: ReplyProblemOptions,
    ): ReturnType<FastifyReply['send']>;
    (
        reply: FastifyReply,
        status: number,
        detail?: string,
        init?: ProblemDetailInit,
        options?: ReplyProblemOptions,
    ): ReturnType<FastifyReply['send']>;
}

export const acceptsProblemJson = (request: FastifyRequest) => {
    if (typeof request[acceptSymbol] === 'undefined') {
        const accept = accepts(request.raw);
        const acceptsProblemJson = accept.type(['application/problem+json', 'application/json'])
            === 'application/problem+json';

        request[acceptSymbol] = acceptsProblemJson;

        return acceptsProblemJson;
    }

    return request[acceptSymbol]!;
};

export const replyProblem: ReplyProblem = function (reply, ...args: any[]) {
    const options = args[args.length - 1];
    const { responseStack, responseFilter } = typeof options === 'object' ? options : {};

    const problem = args[0] instanceof ProblemDetail ? args[0] : new ProblemDetail(args[0], args[1], args[2]);

    if (!(reply.log as any)[kDisableRequestLogging]) {
        if (problem.status < 500) {
            reply.log.info({ res: reply, err: problem }, problem.message);
        } else {
            reply.log.error({ req: reply.request, res: reply, err: problem }, problem.message);
        }
    }

    if (acceptsProblemJson(reply.request)) {
        reply.type('application/problem+json');
    } else {
        reply.type('application/json');
    }

    const json = problem.toJSON();

    if (responseStack === true) {
        json.stack = problem.stack;
    }

    if (typeof responseFilter === 'function') {
        const filterInput: Record<string | symbol, unknown> = { ...json };
        for (const key of Object.getOwnPropertySymbols(problem)) {
            filterInput[key] = problem[key];
        }

        return reply.status(problem.status).send(responseFilter(filterInput));
    }

    return reply.status(problem.status).send(json);
};

export const toProblemDetail = (error: unknown): ProblemDetail => {
    if (error instanceof ProblemDetail) {
        return error;
    }

    if (error instanceof Error) {
        const { status, statusCode, message, ...extra } = error as Error & {
            status?: unknown;
            statusCode?: unknown;
            [key: string]: unknown;
        };

        // align with https://github.com/fastify/fastify/blob/bbdfe82ae891199ba0d2b49326b7ddce5f103ab3/lib/error-handler.js#L157-L166
        const resolvedStatus =
            typeof status === 'number' && status >= 400
                ? status
                : typeof statusCode === 'number' && statusCode >= 400
                    ? statusCode
                    : 500;

        return new ProblemDetail(resolvedStatus, message || STATUS_CODES[resolvedStatus] || 'Unknown Error', {
            type: 'about:blank',
            ...extra,
            stack: error.stack,
            cause: error.cause,
        });
    }

    return new ProblemDetail(500, String(error), {
        type: 'about:blank',
        cause: error,
    });
};

/**
 * Align with Fastify defaultErrorHandler:
 * 1. resolve status from reply/error state
 * 2. log by status class.
 *
 * @see https://github.com/fastify/fastify/blob/bbdfe82ae891199ba0d2b49326b7ddce5f103ab3/lib/error-handler.js#L82C17-L99
 */
export function fastifyErrorHandler(
    this: FastifyInstance,
    error: Error,
    _request: FastifyRequest,
    reply: FastifyReply,
    options: ReplyProblemOptions = {},
) {
    const problem = toProblemDetail(error);

    if (!(error instanceof ProblemDetail)) {
        const statusCode = reply.raw.statusCode >= 400 ? reply.raw.statusCode : problem.status;
        problem.status = statusCode;
        problem.title = STATUS_CODES[statusCode] || problem.title;
    }

    // Align with Fastify defaultErrorHandler:
    if ('headers' in error && error.headers) {
        reply.headers(error.headers);
    }

    return replyProblem(reply, problem, { ...options });
}

export function fastifyNotFoundHandler(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
    const problem = new ProblemDetail(404, `Route ${request.method}:${request.url} not found`, {
        type: 'about:blank',
        instance: request.url,
        method: request.method,
    });

    return replyProblem(reply, problem);
}

export const fastifyProblemDetails: FastifyPluginCallback<ReplyProblemOptions> = fastifyPlugin((
    fastify: FastifyInstance,
    options: ReplyProblemOptions = {},
) => {
    fastify.decorate('httpErrors', httpErrors);

    fastify.decorateRequest('acceptsProblemJson', {
        getter() {
            return acceptsProblemJson(this);
        },
    });

    fastify.decorateReply('problem', function (this: FastifyReply, ...args) {
        return replyProblem(this, ...args);
    });

    fastify.setErrorHandler(function (error, request, reply) {
        return fastifyErrorHandler.call(this, error as Error, request, reply, options);
    });

    fastify.setNotFoundHandler(fastifyNotFoundHandler);
}, {
    name: 'fastify-problem-details',
    fastify: '5.x',
});
