import fastify from 'fastify';
import assert from 'node:assert';
import { STATUS_CODES } from 'node:http';
import { describe, test } from 'node:test';
import { createError, createHttpError, httpErrorNames, httpErrors } from './http-errors.js';

describe('createError', () => {
    test('should extend ProblemDetail and assign properties', () => {
        const CustomError = createError(418, 'ImATeapot', 'I am a teapot');
        const err = new CustomError('Short detail', { foo: 1 });
        assert.strictEqual(err.status, 418);
        assert.strictEqual(err.name, 'ImATeapot');
        assert.strictEqual(err.detail, 'Short detail');
        assert.strictEqual(err.foo, 1);
    });

    test('should support options as first argument', () => {
        const CustomError = createError(400, 'BadRequest');
        const err = new CustomError({ title: 'Bad', bar: 2 });
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.title, 'Bad');
        assert.strictEqual(err.bar, 2);
    });

    test('should work with Fastify integration', async () => {
        const app = fastify();
        const CustomError = createError(499, 'CustomError', 'custom detail');
        app.get('/err', (_req, reply) => {
            const err = new CustomError('custom detail', { foo: 'bar' });
            reply.code(499).send(err.toJSON());
        });
        const res = await app.inject({ method: 'GET', url: '/err' });
        const body = res.json();
        assert.strictEqual(res.statusCode, 499);
        assert.strictEqual(body.detail, 'custom detail');
        assert.strictEqual(body.foo, 'bar');
        await app.close();
    });
});

describe('createHttpError', () => {
    test('should create error with custom title', () => {
        const CustomError = createHttpError(418, 'CustomTitle');
        const err = new CustomError('Short detail', { foo: 'bar' });
        assert.strictEqual(err.status, 418);
        assert.strictEqual(err.title, 'I\'m a Teapot');
        assert.strictEqual(err.detail, 'Short detail');
        assert.strictEqual(err.foo, 'bar');
    });

    test('should create error with default title', () => {
        const DefaultError = createHttpError(404);
        const err = new DefaultError('Not Found');
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.title, 'Not Found');
        assert.strictEqual(err.detail, 'Not Found');
    });
});

describe('httpErrors', () => {
    test('should provide all standard errors', () => {
        assert.ok(httpErrors.NotFound);
        assert.ok(httpErrors.BadRequest);
        assert.ok(httpErrors.InternalServerError);
        const err = new httpErrors.NotFound('not found');
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.name, 'NotFound');
    });

    test('should work with Fastify integration', async () => {
        const app = fastify();
        app.get('/std', (_req, reply) => {
            const err = new httpErrors.NotFound('not found', { foo: 'bar' });
            reply.code(404).send(err.toJSON());
        });
        const res = await app.inject({ method: 'GET', url: '/std' });
        const body = res.json();
        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(body.detail, 'not found');
        assert.strictEqual(body.foo, 'bar');
        await app.close();
    });

    Object.keys(STATUS_CODES).forEach((statusCode) => {
        const status = +statusCode;

        if (status < 400) {
            return;
        }

        const ErrorName = httpErrorNames[status as keyof typeof httpErrorNames];
        const ErrorClass = httpErrors[ErrorName];

        test(`should create ${statusCode} ${ErrorName} error`, () => {
            assert.ok(ErrorName, `Error name for ${status} not found`);
            assert.ok(ErrorClass, `Error class for ${status} not found`);

            const err = new ErrorClass('Test detail', { extra: 'info' });
            assert.strictEqual(err.status, status);
            assert.strictEqual(err.title, STATUS_CODES[status]);
            assert.strictEqual(err.detail, 'Test detail');
            assert.strictEqual(err.extra, 'info');
        });
    });
});
