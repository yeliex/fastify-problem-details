import fastify, { errorCodes } from 'fastify';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import {
    acceptsProblemJson,
    fastifyErrorHandler,
    fastifyProblemDetails,
    replyProblem,
    toProblemDetail,
} from './fastify.js';
import { ProblemDetail } from './problem-detail.js';

describe('fastifyProblemDetails plugin', () => {
    test('should register httpErrors and problem method', async () => {
        const app = fastify();
        await app.register(fastifyProblemDetails);

        assert.ok(app.httpErrors);
        assert.strictEqual(typeof app.httpErrors.NotFound, 'function');

        app.get('/test', (_request, reply) => {
            reply.problem(404, 'Not Found', { foo: 'bar' });
        });

        const res = await app.inject({
            method: 'GET',
            url: '/test',
        });

        assert.strictEqual(res.statusCode, 404);
        assert.deepStrictEqual(res.json(), {
            type: 'about:blank',
            title: 'Not Found',
            status: 404,
            detail: 'Not Found',
            foo: 'bar',
        });
        await app.close();
    });

    test('should handle errors using fastifyErrorHandler', async () => {
        const app = fastify();
        await app.register(fastifyProblemDetails);

        app.get('/error', async () => {
            throw new Error('Test error');
        });

        const res = await app.inject({
            method: 'GET',
            url: '/error',
        });
        assert.strictEqual(res.statusCode, 500);
        assert.deepStrictEqual(res.json(), {
            type: 'about:blank',
            title: 'Internal Server Error',
            status: 500,
            detail: 'Test error',
        });
        await app.close();
    });

    test('should include stack when responseStack is true', async () => {
        const app = fastify();
        await app.register(fastifyProblemDetails, { responseStack: true });

        app.get('/error', async () => {
            throw new Error('Test error');
        });

        const res = await app.inject({
            method: 'GET',
            url: '/error',
        });

        const json = res.json();
        assert.strictEqual(res.statusCode, 500);
        assert.ok(json.stack);

        await app.close();
    });

    test('should not include stack when responseStack is false', async () => {
        const app = fastify();
        await app.register(fastifyProblemDetails, { responseStack: false });

        app.get('/error', async () => {
            throw new Error('Test error');
        });

        const res = await app.inject({
            method: 'GET',
            url: '/error',
        });

        const json = res.json();
        assert.strictEqual(res.statusCode, 500);
        assert.strictEqual(json.stack, undefined);

        await app.close();
    });
});

describe('ProblemDetail and replyProblem', () => {
    test('should convert FastifyError to ProblemDetail', () => {
        class MyFastifyError extends Error {
            // will recognize as pd.status
            statusCode = 401;
            foo = 1;
        }

        const err = new MyFastifyError();
        const pd = toProblemDetail(err);

        assert.strictEqual(pd.status, 401);
        assert.strictEqual(pd.title, 'Unauthorized');
        assert.strictEqual((pd as any).foo, 1);
    });

    test('should convert normal Error to ProblemDetail', () => {
        const err = new Error('err');
        const pd = toProblemDetail(err);
        assert.strictEqual(pd.status, 500);
        assert.strictEqual(pd.detail, 'err');
    });

    test('should convert other types to ProblemDetail', () => {
        const pd = toProblemDetail('abc');
        assert.strictEqual(pd.status, 500);
        assert.strictEqual(pd.detail, 'abc');
        assert.strictEqual(pd.cause, 'abc');
    });

    test('should include stack when responseStack is true', async () => {
        const app = fastify();
        app.register(fastifyProblemDetails);

        app.get('/test', async (_request, reply) => {
            const problem = new ProblemDetail(500, 'Internal Server Error');
            replyProblem(reply, problem, { responseStack: true });
        });

        const response = await app.inject({
            method: 'GET',
            url: '/test',
        });

        const json = response.json();
        assert.strictEqual(response.statusCode, 500);
        assert.ok(json.stack);

        await app.close();
    });

    test('should not include stack when responseStack is false', async () => {
        const app = fastify();
        app.register(fastifyProblemDetails);

        app.get('/test', async (_request, reply) => {
            const problem = new ProblemDetail(500, 'Internal Server Error');
            replyProblem(reply, problem, { responseStack: false });
        });

        const response = await app.inject({
            method: 'GET',
            url: '/test',
        });

        const json = response.json();
        assert.strictEqual(response.statusCode, 500);
        assert.strictEqual(json.stack, undefined);

        await app.close();
    });

    test('should set application/problem+json type when acceptsProblemJson is true', async () => {
        const app = fastify();
        app.get('/test', async (_req, reply) => {
            reply.request.headers.accept = 'application/problem+json';
            replyProblem(reply, new ProblemDetail(400, 'Bad Request'));
        });

        const res = await app.inject({ method: 'GET', url: '/test' });
        assert.strictEqual(res.headers['content-type'], 'application/problem+json; charset=utf-8');
    });

    test('should set application/json type when acceptsProblemJson is false', async () => {
        const app = fastify();
        app.get('/test', async (_req, reply) => {
            reply.request.headers.accept = 'application/json';
            replyProblem(reply, new ProblemDetail(400, 'Bad Request'));
        });

        const res = await app.inject({ method: 'GET', url: '/test' });
        assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
    });
});

describe('fastifyErrorHandler', () => {
    test('should handle errors and call reply.problem', async () => {
        const app = fastify();

        app.setErrorHandler((error, request, reply) => {
            fastifyErrorHandler.call(app, error, request, reply);
        });

        app.get('/error', async () => {
            throw new Error('Test error');
        });

        const res = await app.inject({
            method: 'GET',
            url: '/error',
        });

        assert.strictEqual(res.statusCode, 500);
        await app.close();
    });

    test('should include stack when responseStack is true', async () => {
        const app = fastify();

        app.register(fastifyProblemDetails, { responseStack: true });

        app.get('/test', async () => {
            throw new Error('Test Error');
        });

        const response = await app.inject({
            method: 'GET',
            url: '/test',
        });

        const json = response.json();
        assert.strictEqual(response.statusCode, 500);
        assert.ok(json.stack);

        await app.close();
    });

    test('should not include stack when responseStack is false', async () => {
        const app = fastify();

        app.register(fastifyProblemDetails, { responseStack: false });

        app.get('/test', async () => {
            throw new Error('Test Error');
        });

        const response = await app.inject({
            method: 'GET',
            url: '/test',
        });

        const json = response.json();
        assert.strictEqual(response.statusCode, 500);
        assert.strictEqual(json.stack, undefined);

        await app.close();
    });
});

describe('FastifyError handling', () => {
    test('should handle FastifyError and convert it to ProblemDetail', async () => {
        const app = fastify();

        app.setErrorHandler((error, request, reply) => {
            fastifyErrorHandler.call(app, error, request, reply);
        });

        app.get('/fastify-error', async () => {
            const { FST_ERR_NOT_FOUND } = errorCodes;
            throw new FST_ERR_NOT_FOUND('Resource not found');
        });

        const res = await app.inject({
            method: 'GET',
            url: '/fastify-error',
        });
        console.log('res', res.json());
        assert.strictEqual(res.statusCode, 404);
        assert.deepStrictEqual(res.json(), {
            type: 'about:blank',
            title: 'Not Found',
            status: 404,
            detail: 'Not Found Resource not found',
            code: 'FST_ERR_NOT_FOUND',
        });
        await app.close();
    });

    test('should handle FST_ERR_VALIDATION error and convert it to ProblemDetail', async () => {
        const app = fastify();

        app.setErrorHandler((error, request, reply) => {
            fastifyErrorHandler.call(app, error, request, reply);
        });

        app.get('/fastify-validation-error', async () => {
            const { FST_ERR_VALIDATION } = errorCodes;
            throw new FST_ERR_VALIDATION('Validation failed');
        });

        const res = await app.inject({
            method: 'GET',
            url: '/fastify-validation-error',
        });

        assert.strictEqual(res.statusCode, 400);
        assert.deepStrictEqual(res.json(), {
            type: 'about:blank',
            title: 'Bad Request',
            status: 400,
            detail: 'Validation failed',
            code: 'FST_ERR_VALIDATION',
        });
        await app.close();
    });
});

describe('acceptsProblemJson', () => {
    test('should return true for requests accepting application/problem+json', () => {
        const app = fastify();
        app.get('/test', (request, reply) => {
            request.headers.accept = 'application/problem+json';
            assert.strictEqual(acceptsProblemJson(request), true);
            reply.send();
        });

        app.inject({ method: 'GET', url: '/test' });
    });

    test('should return false for requests not accepting application/problem+json', () => {
        const app = fastify();
        app.get('/test', (request, reply) => {
            request.headers.accept = 'application/json';
            assert.strictEqual(acceptsProblemJson(request), false);
            reply.send();
        });

        app.inject({ method: 'GET', url: '/test' });
    });
});

describe('toProblemDetail', () => {
    test('should convert Error to ProblemDetail with extra fields', () => {
        const error = new Error('Test error');
        Object.assign(error, { statusCode: 400, extraField: 'extraValue' });
        const pd = toProblemDetail(error);

        assert.strictEqual(pd.status, 400);
        assert.strictEqual(pd.detail, 'Test error');
        assert.strictEqual(pd.extraField, 'extraValue');
    });

    test('should handle unknown error types gracefully', () => {
        const pd = toProblemDetail('Unknown error');
        assert.strictEqual(pd.status, 500);
        assert.strictEqual(pd.detail, 'Unknown error');
    });
});
