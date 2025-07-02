import accepts from 'accepts';
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';
import { STATUS_CODES } from 'node:http';
import { httpErrors } from './http-errors.js';
import { ProblemDetail, type ProblemDetailInit } from './problem-detail.js';

const acceptSymbol = Symbol.for('accept-problem-json');

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
    const responseStack = typeof options === 'object' && options.responseStack === true;

    const problem = args[0] instanceof ProblemDetail ? args[0] : new ProblemDetail(args[0], args[1], args[2]);

    if (acceptsProblemJson(reply.request)) {
        reply.type('application/problem+json');
    } else {
        reply.type('application/json');
    }

    const json = problem.toJSON();
    if (responseStack) {
        json.stack = problem.stack;
    }

    return reply.status(problem.status).send(json);
};

export const toProblemDetail = (error: unknown): ProblemDetail => {
    if (error instanceof ProblemDetail) {
        return error;
    }

    if (error instanceof Error) {
        // 直接用对象展开+排除标准字段
        const { statusCode, message, ...extra } = error as any;

        const status = typeof statusCode === 'number' ? statusCode : 500;

        return new ProblemDetail(
            status,
            message || STATUS_CODES[status],
            {
                type: 'about:blank',
                ...extra,
                stack: error.stack,
                cause: error.cause,
            },
        );
    }

    return new ProblemDetail(500, String(error), {
        type: 'about:blank',
        cause: error,
    });
};

export function fastifyErrorHandler(
    this: FastifyInstance,
    error: Error,
    _request: FastifyRequest,
    reply: FastifyReply,
    { responseStack }: ReplyProblemOptions = {},
) {
    const problem = toProblemDetail(error);

    return replyProblem(reply, problem, { responseStack });
}

export function fastifyNotFoundHandler(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
    const problem = new ProblemDetail(404, `Route ${request.method}:${request.url} not found`, {
        type: 'about:blank',
        instance: request.url,
        method: request.method,
    });

    return replyProblem(reply, problem);
}

export const fastifyProblemDetails = fastifyPlugin((
    fastify: FastifyInstance,
    { responseStack }: ReplyProblemOptions = {},
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

    fastify.setErrorHandler(function (...args) {
        return fastifyErrorHandler.call(this, ...args, { responseStack });
    });

    fastify.setNotFoundHandler(fastifyNotFoundHandler);
}, {
    name: 'fastify-problem-details',
    fastify: '5.x',
});
