import assert from 'node:assert';
import { STATUS_CODES } from 'node:http';
import { describe, test } from 'node:test';
import { createError, createHttpError, httpErrorNames, httpErrors } from './http-error.js';

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

    test('should support default options as third argument', () => {
        const CustomError = createError(400, 'BadRequest', {
            title: 'Custom Bad Request',
            type: 'https://example.com/errors/bad-request',
            foo: 1,
        });
        const err = new CustomError({ bar: 2 });
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.title, 'Custom Bad Request');
        assert.strictEqual(err.type, 'https://example.com/errors/bad-request');
        assert.strictEqual(err.detail, undefined);
        assert.strictEqual(err.foo, 1);
        assert.strictEqual(err.bar, 2);
    });

    test('should support default detail and default options together', () => {
        const CustomError = createError(409, 'ConflictError', 'Default conflict', {
            title: 'Conflict',
            foo: 1,
        });
        const err = new CustomError({ bar: 2 });
        assert.strictEqual(err.status, 409);
        assert.strictEqual(err.detail, 'Default conflict');
        assert.strictEqual(err.title, 'Conflict');
        assert.strictEqual(err.foo, 1);
        assert.strictEqual(err.bar, 2);
    });

    test('should let instance options override default options', () => {
        const CustomError = createError(400, 'BadRequest', {
            title: 'Default Title',
            type: 'https://example.com/errors/default',
            foo: 1,
        });
        const err = new CustomError({
            title: 'Override Title',
            foo: 2,
        });
        assert.strictEqual(err.title, 'Override Title');
        assert.strictEqual(err.type, 'https://example.com/errors/default');
        assert.strictEqual(err.foo, 2);
    });

    test('should let instance detail override default detail', () => {
        const CustomError = createError(409, 'ConflictError', 'Default conflict', {
            title: 'Conflict',
        });
        const err = new CustomError('Override conflict', { foo: 1 });
        assert.strictEqual(err.detail, 'Override conflict');
        assert.strictEqual(err.title, 'Conflict');
        assert.strictEqual(err.foo, 1);
    });

    test('should support undefined default detail with default options', () => {
        const CustomError = createError(400, 'BadRequest', undefined, {
            title: 'Custom Bad Request',
            foo: 1,
        });
        const err = new CustomError({ bar: 2 });
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.title, 'Custom Bad Request');
        assert.strictEqual(err.detail, undefined);
        assert.strictEqual(err.foo, 1);
        assert.strictEqual(err.bar, 2);
    });
});

describe('createHttpError', () => {
    test('should create error with default title', () => {
        const DefaultError = createHttpError(404);
        const err = new DefaultError('Not Found');
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.title, 'Not Found');
        assert.strictEqual(err.detail, 'Not Found');
    });

    test('should support default options', () => {
        const DefaultError = createHttpError(404, {
            title: 'Resource Missing',
            type: 'https://example.com/errors/not-found',
            foo: 1,
        });
        const err = new DefaultError({ bar: 2 });
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.title, 'Resource Missing');
        assert.strictEqual(err.detail, undefined);
        assert.strictEqual(err.type, 'https://example.com/errors/not-found');
        assert.strictEqual(err.foo, 1);
        assert.strictEqual(err.bar, 2);
    });

    test('should support default detail and default options together', () => {
        const DefaultError = createHttpError(404, 'Missing resource', {
            title: 'Resource Missing',
            foo: 1,
        });
        const err = new DefaultError({ bar: 2 });
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.title, 'Resource Missing');
        assert.strictEqual(err.detail, 'Missing resource');
        assert.strictEqual(err.foo, 1);
        assert.strictEqual(err.bar, 2);
    });

    test('should support undefined default detail with default options', () => {
        const DefaultError = createHttpError(404, undefined, {
            title: 'Resource Missing',
            foo: 1,
        });
        const err = new DefaultError({ bar: 2 });
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.title, 'Resource Missing');
        assert.strictEqual(err.detail, undefined);
        assert.strictEqual(err.foo, 1);
        assert.strictEqual(err.bar, 2);
    });
});

describe('httpErrors', () => {
    test('should provide all standard errors', () => {
        assert.ok(httpErrors.NotFound);
        assert.ok(httpErrors.BadRequest);
        assert.ok(httpErrors.InternalServerError);
        assert.ok(httpErrors[404]);
        assert.ok(httpErrors['404']);
        assert.strictEqual(httpErrors.NotFound, httpErrors[404]);
        assert.strictEqual(httpErrors.NotFound, httpErrors['404']);
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
